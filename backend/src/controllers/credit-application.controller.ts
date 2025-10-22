import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  sendCreditApplicationSubmittedEmail,
  sendCreditApplicationApprovedEmail,
  sendCreditApplicationRejectedEmail,
} from '../utils/email.service';

const prisma = new PrismaClient();

/**
 * @desc    Submit a credit application
 * @route   POST /api/v1/credit-applications
 * @access  Company Admin
 */
export const submitCreditApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const {
      requestedAmount,
      currency = 'USD',
      companyName,
      registrationNumber,
      businessType,
      industry,
      yearEstablished,
      numberOfEmployees,
      annualRevenue,
      contactPersonName,
      contactPersonTitle,
      contactEmail,
      contactPhone,
      businessAddress,
      city,
      state,
      country,
      postalCode,
      bankName,
      bankAccountNumber,
      taxId,
      proposedCreditTerm,
      estimatedMonthlySpend,
      documentsUploaded,
    } = req.body;

    // Validation
    if (!requestedAmount || requestedAmount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid requested amount is required',
      });
      return;
    }

    if (!companyName || !contactPersonName || !contactEmail || !contactPhone || !businessAddress || !city || !country || !postalCode) {
      res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
      return;
    }

    // Check if there's already a pending application
    const existingApplication = await prisma.creditApplication.findFirst({
      where: {
        organizationId: user.organizationId,
        status: 'pending',
      },
    });

    if (existingApplication) {
      res.status(400).json({
        success: false,
        message: 'You already have a pending credit application. Please wait for review.',
      });
      return;
    }

    // Create credit application
    const application = await prisma.creditApplication.create({
      data: {
        organizationId: user.organizationId,
        requestedAmount: parseFloat(requestedAmount),
        currency,
        companyName,
        registrationNumber,
        businessType,
        industry,
        yearEstablished: yearEstablished ? parseInt(yearEstablished) : null,
        numberOfEmployees: numberOfEmployees ? parseInt(numberOfEmployees) : null,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
        contactPersonName,
        contactPersonTitle,
        contactEmail,
        contactPhone,
        businessAddress,
        city,
        state,
        country,
        postalCode,
        bankName,
        bankAccountNumber,
        taxId,
        proposedCreditTerm: proposedCreditTerm ? parseInt(proposedCreditTerm) : null,
        estimatedMonthlySpend: estimatedMonthlySpend ? parseFloat(estimatedMonthlySpend) : null,
        documentsUploaded,
        status: 'pending',
      },
    });

    // Send confirmation email
    await sendCreditApplicationSubmittedEmail(
      contactEmail,
      companyName,
      parseFloat(requestedAmount),
      currency
    );

    res.status(201).json({
      success: true,
      message: 'Credit application submitted successfully',
      data: application,
    });
  } catch (error) {
    console.error('Submit credit application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit credit application',
      error: (error as Error).message,
    });
  }
};

/**
 * @desc    Get credit applications for the organization
 * @route   GET /api/v1/credit-applications
 * @access  Company Admin
 */
export const getOrganizationApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    const applications = await prisma.creditApplication.findMany({
      where: {
        organizationId: user.organizationId,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error('Get credit applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credit applications',
      error: (error as Error).message,
    });
  }
};

/**
 * @desc    Get all credit applications (Super Admin)
 * @route   GET /api/v1/super-admin/credit-applications
 * @access  Super Admin
 */
export const getAllCreditApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, limit = '20', offset = '0' } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const applications = await prisma.creditApplication.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            email: true,
            totalCredits: true,
            availableCredits: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.creditApplication.count({ where });

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
    });
  } catch (error) {
    console.error('Get all credit applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credit applications',
      error: (error as Error).message,
    });
  }
};

/**
 * @desc    Review credit application (Approve/Reject)
 * @route   POST /api/v1/super-admin/credit-applications/:applicationId/review
 * @access  Super Admin
 */
export const reviewCreditApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { applicationId } = req.params;
    const { action, approvedAmount, approvedCreditTerm, reviewNotes, rejectionReason } = req.body;

    if (!action || !['approve', 'reject', 'request_info'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve, reject, or request_info',
      });
      return;
    }

    const application = await prisma.creditApplication.findUnique({
      where: { id: applicationId },
      include: { organization: true },
    });

    if (!application) {
      res.status(404).json({
        success: false,
        message: 'Credit application not found',
      });
      return;
    }

    if (application.status !== 'pending' && application.status !== 'under_review') {
      res.status(400).json({
        success: false,
        message: 'Application has already been processed',
      });
      return;
    }

    let updateData: any = {
      reviewedBy: user.id,
      reviewedAt: new Date(),
      reviewNotes,
    };

    if (action === 'approve') {
      if (!approvedAmount || approvedAmount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Approved amount is required',
        });
        return;
      }

      updateData.status = 'approved';
      updateData.approvedAmount = parseFloat(approvedAmount);
      updateData.approvedCreditTerm = approvedCreditTerm ? parseInt(approvedCreditTerm) : null;
      updateData.creditLimitEffectiveDate = new Date();

      // Update the organization's credits in a transaction
      await prisma.$transaction(async (tx) => {
        // Update application
        await tx.creditApplication.update({
          where: { id: applicationId },
          data: updateData,
        });

        // Add credits to organization
        const newTotalCredits = parseFloat(application.organization.totalCredits.toString()) + parseFloat(approvedAmount);
        const newAvailableCredits = parseFloat(application.organization.availableCredits.toString()) + parseFloat(approvedAmount);

        await tx.organization.update({
          where: { id: application.organizationId },
          data: {
            totalCredits: newTotalCredits,
            availableCredits: newAvailableCredits,
          },
        });

        // Create credit transaction
        await tx.creditTransaction.create({
          data: {
            organizationId: application.organizationId,
            transactionType: 'credit_added',
            amount: parseFloat(approvedAmount),
            currency: application.currency,
            balanceBefore: parseFloat(application.organization.totalCredits.toString()),
            balanceAfter: newTotalCredits,
            description: `Credit application approved - ${application.currency} ${approvedAmount} added`,
            notes: `Application ID: ${applicationId}\nReviewed by: Super Admin\n${reviewNotes || ''}`,
            createdBy: user.id,
          },
        });
      });

      // Send approval email
      await sendCreditApplicationApprovedEmail(
        application.contactEmail,
        application.companyName,
        parseFloat(approvedAmount),
        application.currency
      );
    } else if (action === 'reject') {
      if (!rejectionReason) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        });
        return;
      }

      updateData.status = 'rejected';
      updateData.rejectionReason = rejectionReason;

      await prisma.creditApplication.update({
        where: { id: applicationId },
        data: updateData,
      });

      // Send rejection email
      await sendCreditApplicationRejectedEmail(
        application.contactEmail,
        application.companyName,
        rejectionReason
      );
    } else if (action === 'request_info') {
      updateData.status = 'additional_info_required';

      await prisma.creditApplication.update({
        where: { id: applicationId },
        data: updateData,
      });
    }

    const updatedApplication = await prisma.creditApplication.findUnique({
      where: { id: applicationId },
      include: { organization: true },
    });

    res.status(200).json({
      success: true,
      message: `Application ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked for additional information'}`,
      data: updatedApplication,
    });
  } catch (error) {
    console.error('Review credit application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review credit application',
      error: (error as Error).message,
    });
  }
};

/**
 * @desc    Get credit application by ID
 * @route   GET /api/v1/super-admin/credit-applications/:applicationId
 * @access  Super Admin
 */
export const getCreditApplicationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.creditApplication.findUnique({
      where: { id: applicationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            email: true,
            phone: true,
            country: true,
            totalCredits: true,
            availableCredits: true,
            creditCurrency: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!application) {
      res.status(404).json({
        success: false,
        message: 'Credit application not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Get credit application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credit application',
      error: (error as Error).message,
    });
  }
};
