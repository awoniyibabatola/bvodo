import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { hashPassword } from '../utils/auth.utils';
import { logger } from '../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';
import { sendTeamInvitationEmail } from '../utils/email.service';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

/**
 * Invite a new user to the organization
 */
export const inviteUser = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, role, creditLimit, department } = req.body;
    const user = (req as AuthRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name, and last name are required',
      });
    }

    // Check if user already exists in organization
    const existingUser = await prisma.user.findFirst({
      where: {
        organizationId: user.organizationId,
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists in your organization',
      });
    }

    // Get organization to check available credits
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Company admins should not have credit allocations
    if (role === 'company_admin' && creditLimit && parseFloat(creditLimit) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Company admins cannot have credit allocations. Only travelers and managers can have credits.',
      });
    }

    // Check if organization has enough credits if allocating credits
    const creditAmount = creditLimit ? new Decimal(creditLimit) : new Decimal(0);
    if (creditAmount.greaterThan(0) && organization.availableCredits.lessThan(creditAmount)) {
      return res.status(400).json({
        success: false,
        message: `Organization does not have enough available credits. Available: ${organization.availableCredits.toString()}, Requested: ${creditAmount.toString()}`,
      });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');

    // Create user and update organization in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // Create user with pending status
      const newlyCreatedUser = await tx.user.create({
        data: {
          organizationId: organization.id,
          email,
          firstName,
          lastName,
          role: role || 'traveler',
          department: department || null,
          creditLimit: creditAmount,
          availableCredits: creditAmount,
          status: 'pending',
          invitationToken,
          invitationSentAt: new Date(),
          passwordHash: '', // Will be set when user accepts invitation
          emailVerified: false,
        },
      });

      // Deduct credits from organization if allocating
      if (creditAmount.greaterThan(0)) {
        await tx.organization.update({
          where: { id: organization.id },
          data: {
            availableCredits: organization.availableCredits.sub(creditAmount),
          },
        });

        // Create credit transaction record
        await tx.creditTransaction.create({
          data: {
            organizationId: organization.id,
            userId: newlyCreatedUser.id,
            transactionType: 'credit_allocated',
            amount: creditAmount,
            currency: organization.creditCurrency,
            balanceBefore: new Decimal(0),
            balanceAfter: creditAmount,
            description: `Initial credit allocation during user invitation`,
            createdBy: user.userId,
          },
        });
      }

      return newlyCreatedUser;
    });

    logger.info(`User invited: ${email} by ${user.email}`);

    // Get inviter details for email
    const inviterUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { firstName: true, lastName: true },
    });

    const inviterName = inviterUser ? `${inviterUser.firstName} ${inviterUser.lastName}` : 'Your Administrator';

    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation?token=${invitationToken}`;

    // Send invitation email
    const emailSent = await sendTeamInvitationEmail(
      email,
      firstName,
      lastName,
      organization.name,
      inviterName,
      role || 'traveler',
      parseFloat(creditAmount.toString()),
      invitationToken
    );

    // Warn if email failed to send
    if (!emailSent) {
      logger.warn(`Invitation email failed to send to ${email}. User created but email not delivered.`);
    }

    return res.status(201).json({
      success: true,
      message: emailSent
        ? 'User invitation created successfully and email sent'
        : 'User invitation created but email failed to send. Please share the invitation link manually.',
      emailSent,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          creditLimit: newUser.creditLimit.toString(),
          status: newUser.status,
        },
        invitationLink,
      },
    });
  } catch (error) {
    logger.error('Invite user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to invite user',
    });
  }
};

/**
 * Allocate or update credit for a user
 */
export const allocateCredit = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount, operation } = req.body; // operation: 'set' or 'add'
    const adminUser = (req as AuthRequest).user;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Validate amount
    if (!amount || isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: adminUser.organizationId },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Get user
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: adminUser.organizationId,
      },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent company_admin from allocating credits to themselves
    if (adminUser.role === 'company_admin' && targetUser.id === adminUser.userId) {
      return res.status(403).json({
        success: false,
        message: 'Company admins cannot allocate credits to themselves. Only travelers and managers can have credit allocations.',
      });
    }

    // Prevent allocating credits to company_admin role
    if (targetUser.role === 'company_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot allocate credits to company admins. Only travelers and managers can have credit allocations.',
      });
    }

    const amountDecimal = new Decimal(amount);
    let newCreditLimit: Decimal;
    let newAvailableCredits: Decimal;
    let creditChange: Decimal;

    if (operation === 'add') {
      // Add to existing credit
      newCreditLimit = targetUser.creditLimit.add(amountDecimal);
      newAvailableCredits = targetUser.availableCredits.add(amountDecimal);
      creditChange = amountDecimal;
    } else {
      // Set credit (default behavior)
      creditChange = amountDecimal.sub(targetUser.creditLimit);
      newCreditLimit = amountDecimal;
      // Adjust available credits proportionally
      const usedCredits = targetUser.creditLimit.sub(targetUser.availableCredits);
      newAvailableCredits = amountDecimal.sub(usedCredits);

      // Ensure available credits don't go negative
      if (newAvailableCredits.lessThan(0)) {
        newAvailableCredits = new Decimal(0);
      }
    }

    // Check if organization has enough credits
    const requiredOrgCredits = creditChange.greaterThan(0) ? creditChange : new Decimal(0);
    if (organization.availableCredits.lessThan(requiredOrgCredits)) {
      return res.status(400).json({
        success: false,
        message: 'Organization does not have enough available credits',
      });
    }

    // Update user and organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user credits
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          creditLimit: newCreditLimit,
          availableCredits: newAvailableCredits,
        },
      });

      // Update organization credits if we're adding credits
      if (creditChange.greaterThan(0)) {
        await tx.organization.update({
          where: { id: adminUser.organizationId },
          data: {
            availableCredits: organization.availableCredits.sub(creditChange),
          },
        });
      } else if (creditChange.lessThan(0)) {
        // Return credits to organization if reducing
        await tx.organization.update({
          where: { id: adminUser.organizationId },
          data: {
            availableCredits: organization.availableCredits.sub(creditChange), // Note: creditChange is negative, so this adds
          },
        });
      }

      // Create credit transaction record
      await tx.creditTransaction.create({
        data: {
          organizationId: adminUser.organizationId,
          userId: userId,
          transactionType: 'credit_allocated',
          amount: creditChange.abs(),
          currency: organization.creditCurrency,
          balanceBefore: targetUser.availableCredits,
          balanceAfter: newAvailableCredits,
          description: `Credit ${operation === 'add' ? 'added' : 'allocated'} by company admin`,
          createdBy: adminUser.userId,
        },
      });

      return updatedUser;
    });

    logger.info(`Credits allocated to user ${userId} by ${adminUser.email}`);

    return res.status(200).json({
      success: true,
      message: 'Credit allocated successfully',
      data: {
        user: {
          id: result.id,
          email: result.email,
          creditLimit: result.creditLimit.toString(),
          availableCredits: result.availableCredits.toString(),
        },
      },
    });
  } catch (error) {
    logger.error('Allocate credit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to allocate credit',
    });
  }
};

/**
 * Reduce user's credit balance
 */
export const reduceCredit = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    const adminUser = (req as AuthRequest).user;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid positive amount is required',
      });
    }

    // Get user
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: adminUser.organizationId,
      },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const amountDecimal = new Decimal(amount);

    // Check if user has enough available credits
    if (targetUser.availableCredits.lessThan(amountDecimal)) {
      return res.status(400).json({
        success: false,
        message: 'User does not have enough available credits',
      });
    }

    // Update user credits in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newAvailableCredits = targetUser.availableCredits.sub(amountDecimal);
      const newCreditLimit = targetUser.creditLimit.sub(amountDecimal);

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          creditLimit: newCreditLimit,
          availableCredits: newAvailableCredits,
        },
      });

      // Create credit transaction record
      await tx.creditTransaction.create({
        data: {
          organizationId: adminUser.organizationId,
          userId: userId,
          transactionType: 'credit_deducted',
          amount: amountDecimal,
          currency: 'USD',
          balanceBefore: targetUser.availableCredits,
          balanceAfter: newAvailableCredits,
          description: reason || 'Credit reduction by company admin',
          createdBy: adminUser.userId,
        },
      });

      // Return credits to organization
      await tx.organization.update({
        where: { id: adminUser.organizationId },
        data: {
          availableCredits: {
            increment: amountDecimal,
          },
        },
      });

      return updatedUser;
    });

    logger.info(`Credits reduced for user ${userId} by ${adminUser.email}`);

    return res.status(200).json({
      success: true,
      message: 'Credit reduced successfully',
      data: {
        user: {
          id: result.id,
          email: result.email,
          creditLimit: result.creditLimit.toString(),
          availableCredits: result.availableCredits.toString(),
        },
      },
    });
  } catch (error) {
    logger.error('Reduce credit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reduce credit',
    });
  }
};

/**
 * Remove or deactivate a user
 */
export const removeUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { permanent } = req.query; // ?permanent=true for hard delete
    const adminUser = (req as AuthRequest).user;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Prevent self-removal
    if (userId === adminUser.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove your own account',
      });
    }

    // Get user
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: adminUser.organizationId,
      },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (permanent === 'true') {
      // Hard delete
      await prisma.user.delete({
        where: { id: userId },
      });

      logger.info(`User ${userId} permanently deleted by ${adminUser.email}`);

      return res.status(200).json({
        success: true,
        message: 'User permanently removed',
      });
    } else {
      // Soft delete - deactivate
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'inactive',
          deletedAt: new Date(),
        },
      });

      logger.info(`User ${userId} deactivated by ${adminUser.email}`);

      return res.status(200).json({
        success: true,
        message: 'User deactivated',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            status: updatedUser.status,
          },
        },
      });
    }
  } catch (error) {
    logger.error('Remove user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove user',
    });
  }
};

/**
 * Get all users in the organization
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as AuthRequest).user;
    const { status, role } = req.query;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const where: any = {
      organizationId: adminUser.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        status: true,
        creditLimit: true,
        availableCredits: true,
        policyId: true,
        policy: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        users: users.map(user => ({
          ...user,
          creditLimit: user.creditLimit.toString(),
          availableCredits: user.availableCredits.toString(),
          policyId: user.policyId,
          policy: user.policy,
        })),
        total: users.length,
      },
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

/**
 * Get all bookings/trips in the organization
 */
export const getAllTrips = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as AuthRequest).user;
    const { status, bookingType, userId, startDate, endDate } = req.query;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const where: any = {
      organizationId: adminUser.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (bookingType) {
      where.bookingType = bookingType;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.departureDate = {};
      if (startDate) {
        where.departureDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.departureDate.lte = new Date(endDate as string);
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        flightBookings: true,
        hotelBookings: true,
      },
      orderBy: {
        departureDate: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        bookings: bookings.map(booking => ({
          ...booking,
          basePrice: booking.basePrice.toString(),
          taxesFees: booking.taxesFees.toString(),
          totalPrice: booking.totalPrice.toString(),
        })),
        total: bookings.length,
      },
    });
  } catch (error) {
    logger.error('Get all trips error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch trips',
    });
  }
};

/**
 * Get organization statistics
 */
export const getOrganizationStats = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as AuthRequest).user;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: adminUser.organizationId },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Get user counts
    const totalUsers = await prisma.user.count({
      where: { organizationId: adminUser.organizationId },
    });

    const activeUsers = await prisma.user.count({
      where: {
        organizationId: adminUser.organizationId,
        status: 'active',
      },
    });

    const pendingUsers = await prisma.user.count({
      where: {
        organizationId: adminUser.organizationId,
        status: 'pending',
      },
    });

    // Get booking counts
    const totalBookings = await prisma.booking.count({
      where: { organizationId: adminUser.organizationId },
    });

    const confirmedBookings = await prisma.booking.count({
      where: {
        organizationId: adminUser.organizationId,
        status: 'confirmed',
      },
    });

    const pendingBookings = await prisma.booking.count({
      where: {
        organizationId: adminUser.organizationId,
        status: { in: ['pending', 'pending_approval'] },
      },
    });

    // Get total spend
    const bookings = await prisma.booking.findMany({
      where: {
        organizationId: adminUser.organizationId,
        status: { in: ['confirmed', 'completed'] },
      },
      select: {
        totalPrice: true,
      },
    });

    const totalSpend = bookings.reduce(
      (sum, booking) => sum.add(booking.totalPrice),
      new Decimal(0)
    );

    return res.status(200).json({
      success: true,
      data: {
        organization: {
          name: organization.name,
          totalCredits: organization.totalCredits.toString(),
          availableCredits: organization.availableCredits.toString(),
          usedCredits: organization.totalCredits.sub(organization.availableCredits).toString(),
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          pending: pendingUsers,
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          pending: pendingBookings,
        },
        totalSpend: totalSpend.toString(),
      },
    });
  } catch (error) {
    logger.error('Get organization stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch organization statistics',
    });
  }
};

/**
 * Update user details
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, role, department, status, policyId } = req.body;
    const adminUser = (req as AuthRequest).user;

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get user
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: adminUser.organizationId,
      },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If policyId is provided, verify it belongs to the same organization
    if (policyId !== undefined) {
      if (policyId !== null) {
        const policy = await prisma.bookingPolicy.findFirst({
          where: {
            id: policyId,
            organizationId: adminUser.organizationId,
          },
        });

        if (!policy) {
          return res.status(400).json({
            success: false,
            message: 'Invalid policy ID or policy does not belong to your organization',
          });
        }
      }
    }

    // Build update data
    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (status) updateData.status = status;
    if (policyId !== undefined) updateData.policyId = policyId;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        policy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info(`User ${userId} updated by ${adminUser.email}`);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          department: updatedUser.department,
          status: updatedUser.status,
          policyId: updatedUser.policyId,
          policy: updatedUser.policy,
        },
      },
    });
  } catch (error) {
    logger.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
};
