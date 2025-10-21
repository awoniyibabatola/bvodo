import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

/**
 * Get all organizations with statistics
 */
export const getAllOrganizations = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch organizations with user count and booking stats
    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        include: {
          _count: {
            select: {
              users: true,
              bookings: true,
            },
          },
        },
      }),
      prisma.organization.count({ where }),
    ]);

    // Get user credit totals for each organization
    const orgIds = organizations.map(org => org.id);
    const userCredits = await prisma.user.groupBy({
      by: ['organizationId'],
      where: {
        organizationId: { in: orgIds },
      },
      _sum: {
        creditLimit: true,
        availableCredits: true,
      },
    });

    // Create a map for quick lookup
    const userCreditMap = new Map(
      userCredits.map(uc => [
        uc.organizationId,
        {
          totalAllocated: parseFloat(uc._sum.creditLimit?.toString() || '0'),
          available: parseFloat(uc._sum.availableCredits?.toString() || '0'),
        }
      ])
    );

    // Format response with additional statistics
    const formattedOrganizations = organizations.map((org) => {
      const userCreditData = userCreditMap.get(org.id) || { totalAllocated: 0, available: 0 };
      const orgAvailable = parseFloat(org.availableCredits.toString());
      const orgTotal = parseFloat(org.totalCredits.toString());

      // Total available = org unallocated + users' available
      const totalAvailable = orgAvailable + userCreditData.available;

      // Used = users' allocated - users' available
      const usedCredits = userCreditData.totalAllocated - userCreditData.available;

      return {
        id: org.id,
        name: org.name,
        subdomain: org.subdomain,
        email: org.email,
        totalCredits: orgTotal.toString(),
        availableCredits: totalAvailable.toString(),
        usedCredits: usedCredits.toString(),
        creditCurrency: org.creditCurrency,
        creditUsagePercentage:
          orgTotal > 0
            ? Math.round((usedCredits / orgTotal) * 100)
            : 0,
        userCount: org._count.users,
        bookingCount: org._count.bookings,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Organizations retrieved successfully',
      data: formattedOrganizations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Get all organizations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizations',
    });
  }
};

/**
 * Get a single organization with detailed stats
 */
export const getOrganizationById = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            creditLimit: true,
            availableCredits: true,
            createdAt: true,
          },
        },
        bookings: {
          select: {
            id: true,
            bookingReference: true,
            bookingType: true,
            status: true,
            totalPrice: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        creditTransactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...organization,
        totalCredits: organization.totalCredits.toString(),
        availableCredits: organization.availableCredits.toString(),
      },
    });
  } catch (error) {
    logger.error('Get organization by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve organization',
    });
  }
};

/**
 * Allocate credits to an organization
 */
export const allocateCredits = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { amount, operation = 'add' } = req.body;
    const adminUser = (req as AuthRequest).user;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const amountDecimal = new Decimal(amount);
    let newTotalCredits: Decimal;
    let newAvailableCredits: Decimal;
    let creditChange: Decimal;

    if (operation === 'add') {
      // Add to existing credits
      newTotalCredits = organization.totalCredits.add(amountDecimal);
      newAvailableCredits = organization.availableCredits.add(amountDecimal);
      creditChange = amountDecimal;
    } else if (operation === 'set') {
      // Set total credits
      creditChange = amountDecimal.sub(organization.totalCredits);
      newTotalCredits = amountDecimal;

      // Adjust available credits proportionally
      const usedCredits = organization.totalCredits.sub(organization.availableCredits);
      newAvailableCredits = amountDecimal.sub(usedCredits);

      // Ensure available credits don't go negative
      if (newAvailableCredits.lessThan(0)) {
        newAvailableCredits = new Decimal(0);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "add" or "set"',
      });
    }

    // Update organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organization.update({
        where: { id: organizationId },
        data: {
          totalCredits: newTotalCredits,
          availableCredits: newAvailableCredits,
        },
      });

      // Create credit transaction record
      await tx.creditTransaction.create({
        data: {
          organizationId: organizationId,
          userId: adminUser.userId,
          transactionType: 'credit_allocated',
          amount: creditChange.abs(),
          currency: organization.creditCurrency,
          balanceBefore: organization.availableCredits,
          balanceAfter: newAvailableCredits,
          description: `Credits ${operation === 'add' ? 'added' : 'set'} by super admin`,
          createdBy: adminUser.userId,
        },
      });

      return updatedOrg;
    });

    logger.info(
      `Credits allocated to organization ${organizationId} by super admin ${adminUser.email}`
    );

    return res.status(200).json({
      success: true,
      message: 'Credits allocated successfully',
      data: {
        totalCredits: result.totalCredits.toString(),
        availableCredits: result.availableCredits.toString(),
      },
    });
  } catch (error) {
    logger.error('Allocate credits error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to allocate credits',
    });
  }
};

/**
 * Reduce credits from an organization
 */
export const reduceCredits = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { amount } = req.body;
    const adminUser = (req as AuthRequest).user;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const amountDecimal = new Decimal(amount);

    // Check if organization has enough credits to reduce
    if (organization.totalCredits.lessThan(amountDecimal)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reduce more credits than organization has',
      });
    }

    const newTotalCredits = organization.totalCredits.sub(amountDecimal);
    const newAvailableCredits = organization.availableCredits.sub(amountDecimal);

    // Ensure available credits don't go negative
    const finalAvailableCredits = newAvailableCredits.lessThan(0)
      ? new Decimal(0)
      : newAvailableCredits;

    // Update organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organization.update({
        where: { id: organizationId },
        data: {
          totalCredits: newTotalCredits,
          availableCredits: finalAvailableCredits,
        },
      });

      // Create credit transaction record
      await tx.creditTransaction.create({
        data: {
          organizationId: organizationId,
          userId: adminUser.userId,
          transactionType: 'credit_deducted',
          amount: amountDecimal,
          currency: organization.creditCurrency,
          balanceBefore: organization.availableCredits,
          balanceAfter: finalAvailableCredits,
          description: `Credits reduced by super admin`,
          createdBy: adminUser.userId,
        },
      });

      return updatedOrg;
    });

    logger.info(
      `Credits reduced from organization ${organizationId} by super admin ${adminUser.email}`
    );

    return res.status(200).json({
      success: true,
      message: 'Credits reduced successfully',
      data: {
        totalCredits: result.totalCredits.toString(),
        availableCredits: result.availableCredits.toString(),
      },
    });
  } catch (error) {
    logger.error('Reduce credits error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reduce credits',
    });
  }
};

/**
 * Get super admin dashboard statistics
 */
export const getSuperAdminStats = async (req: Request, res: Response) => {
  try {
    // Get counts
    const [totalOrganizations, totalUsers, totalBookings, recentOrganizations] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.organization.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        include: {
          _count: {
            select: {
              users: true,
              bookings: true,
            },
          },
        },
      }),
    ]);

    // Calculate total credits across all organizations
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        totalCredits: true,
        availableCredits: true,
      },
    });

    // Get all user credits across platform
    const allUserCredits = await prisma.user.groupBy({
      by: ['organizationId'],
      _sum: {
        creditLimit: true,
        availableCredits: true,
      },
    });

    const userCreditTotals = allUserCredits.reduce(
      (acc, uc) => ({
        allocated: acc.allocated + parseFloat(uc._sum.creditLimit?.toString() || '0'),
        available: acc.available + parseFloat(uc._sum.availableCredits?.toString() || '0'),
      }),
      { allocated: 0, available: 0 }
    );

    const totalCreditsAllocated = organizations.reduce(
      (sum, org) => sum + parseFloat(org.totalCredits.toString()),
      0
    );

    // Total available = org unallocated + users' available
    const orgUnallocated = organizations.reduce(
      (sum, org) => sum + parseFloat(org.availableCredits.toString()),
      0
    );
    const totalCreditsAvailable = orgUnallocated + userCreditTotals.available;

    // Used = what users have used from their allocations
    const totalCreditsUsed = userCreditTotals.allocated - userCreditTotals.available;

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrganizations,
          totalUsers,
          totalBookings,
          totalCreditsAllocated,
          totalCreditsAvailable,
          totalCreditsUsed,
          creditUsagePercentage:
            totalCreditsAllocated > 0
              ? Math.round((totalCreditsUsed / totalCreditsAllocated) * 100)
              : 0,
        },
        recentOrganizations: recentOrganizations.map((org) => ({
          id: org.id,
          name: org.name,
          subdomain: org.subdomain,
          totalCredits: org.totalCredits.toString(),
          availableCredits: org.availableCredits.toString(),
          userCount: org._count.users,
          bookingCount: org._count.bookings,
          createdAt: org.createdAt,
        })),
      },
    });
  } catch (error) {
    logger.error('Get super admin stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
    });
  }
};

/**
 * Update organization details
 */
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { name, email } = req.body;
    const adminUser = (req as AuthRequest).user;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
    });

    logger.info(
      `Organization ${organizationId} updated by super admin ${adminUser.email}`
    );

    return res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: updatedOrganization,
    });
  } catch (error) {
    logger.error('Update organization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update organization',
    });
  }
};

/**
 * Delete organization (soft delete)
 */
export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const adminUser = (req as AuthRequest).user;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Soft delete by marking all users as inactive and setting deletedAt
    await prisma.$transaction(async (tx) => {
      // Mark all users as inactive
      await tx.user.updateMany({
        where: { organizationId },
        data: {
          status: 'inactive',
          deletedAt: new Date(),
        },
      });

      // Mark all bookings as deleted
      await tx.booking.updateMany({
        where: { organizationId },
        data: {
          deletedAt: new Date(),
        },
      });

      // Update organization
      await tx.organization.update({
        where: { id: organizationId },
        data: {
          deletedAt: new Date(),
        },
      });
    });

    logger.info(
      `Organization ${organizationId} deleted by super admin ${adminUser.email}`
    );

    return res.status(200).json({
      success: true,
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    logger.error('Delete organization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete organization',
    });
  }
};

/**
 * Reset all credits for an organization (set to 0)
 */
export const resetOrganizationCredits = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const adminUser = (req as AuthRequest).user;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Reset organization and all user credits in a transaction
    await prisma.$transaction(async (tx) => {
      // Reset all user credits to 0
      await tx.user.updateMany({
        where: { organizationId },
        data: {
          creditLimit: 0,
          availableCredits: 0,
        },
      });

      // Reset organization credits to 0
      await tx.organization.update({
        where: { id: organizationId },
        data: {
          totalCredits: 0,
          availableCredits: 0,
        },
      });

      // Create a transaction record
      await tx.creditTransaction.create({
        data: {
          organizationId: organizationId,
          userId: adminUser.userId,
          transactionType: 'credit_deducted',
          amount: organization.totalCredits,
          currency: organization.creditCurrency,
          balanceBefore: organization.availableCredits,
          balanceAfter: 0,
          description: `All credits reset by super admin`,
          createdBy: adminUser.userId,
        },
      });
    });

    logger.info(
      `All credits reset for organization ${organizationId} by super admin ${adminUser.email}`
    );

    return res.status(200).json({
      success: true,
      message: 'All credits reset successfully',
    });
  } catch (error) {
    logger.error('Reset credits error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset credits',
    });
  }
};

/**
 * Delete all bookings for an organization
 */
export const deleteOrganizationBookings = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const adminUser = (req as AuthRequest).user;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Delete all bookings and related data
    const result = await prisma.$transaction(async (tx) => {
      // Delete all hotel booking rooms and guests
      const hotelBookings = await tx.hotelBooking.findMany({
        where: {
          booking: { organizationId },
        },
        select: { id: true },
      });

      for (const hb of hotelBookings) {
        await tx.guest.deleteMany({
          where: {
            roomBooking: {
              hotelBookingId: hb.id,
            },
          },
        });

        await tx.roomBookingItem.deleteMany({
          where: { hotelBookingId: hb.id },
        });
      }

      // Delete hotel bookings
      await tx.hotelBooking.deleteMany({
        where: {
          booking: { organizationId },
        },
      });

      // Delete flight bookings
      await tx.flightBooking.deleteMany({
        where: {
          booking: { organizationId },
        },
      });

      // Delete credit transactions related to bookings
      await tx.creditTransaction.deleteMany({
        where: { organizationId },
      });

      // Delete all bookings
      const deletedCount = await tx.booking.deleteMany({
        where: { organizationId },
      });

      return deletedCount;
    });

    logger.info(
      `All bookings deleted for organization ${organizationId} by super admin ${adminUser.email}`
    );

    return res.status(200).json({
      success: true,
      message: `${result.count} booking(s) deleted successfully`,
    });
  } catch (error) {
    logger.error('Delete bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete bookings',
    });
  }
};

/**
 * Reset entire platform (all orgs, credits, bookings) - DANGER!
 */
export const resetPlatform = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as AuthRequest).user;
    const { confirmationCode } = req.body;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Require confirmation code
    if (confirmationCode !== 'RESET_ALL_DATA') {
      return res.status(400).json({
        success: false,
        message: 'Invalid confirmation code. Use "RESET_ALL_DATA" to confirm.',
      });
    }

    // Reset everything
    const result = await prisma.$transaction(async (tx) => {
      // Delete all guests
      await tx.guest.deleteMany({});

      // Delete all room bookings
      await tx.roomBookingItem.deleteMany({});

      // Delete all hotel bookings
      await tx.hotelBooking.deleteMany({});

      // Delete all flight bookings
      await tx.flightBooking.deleteMany({});

      // Delete all credit transactions
      await tx.creditTransaction.deleteMany({});

      // Delete all bookings
      const bookingsDeleted = await tx.booking.deleteMany({});

      // Reset all user credits
      await tx.user.updateMany({
        where: {
          role: { not: 'super_admin' },
        },
        data: {
          creditLimit: 0,
          availableCredits: 0,
        },
      });

      // Reset all organization credits
      await tx.organization.updateMany({
        data: {
          totalCredits: 0,
          availableCredits: 0,
        },
      });

      return {
        bookingsDeleted: bookingsDeleted.count,
      };
    });

    logger.warn(
      `ENTIRE PLATFORM RESET by super admin ${adminUser.email}`
    );

    return res.status(200).json({
      success: true,
      message: 'Platform reset successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Reset platform error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset platform',
    });
  }
};
