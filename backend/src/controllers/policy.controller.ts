import { Request, Response } from 'express';
import PolicyService from '../services/policy.service';

/**
 * Policy Controller
 * Handles HTTP requests for booking policy management
 */

/**
 * @route   GET /api/policies
 * @desc    Get all policies for the organization
 * @access  Admin, Company Admin
 */
export const getPolicies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.user!;

    // Check if user has admin rights
    if (!['admin', 'company_admin', 'super_admin'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.',
      });
      return;
    }

    const policies = await PolicyService.getPolicies(organizationId);

    res.status(200).json({
      success: true,
      data: policies,
    });
  } catch (error: any) {
    console.error('Error fetching policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policies',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/policies/:id
 * @desc    Get a single policy by ID
 * @access  Admin, Company Admin
 */
export const getPolicyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    // Check if user has admin rights
    if (!['admin', 'company_admin', 'super_admin'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.',
      });
      return;
    }

    const policy = await PolicyService.getPolicyById(id);

    if (!policy) {
      res.status(404).json({
        success: false,
        message: 'Policy not found',
      });
      return;
    }

    // Ensure policy belongs to user's organization
    if (policy.organizationId !== organizationId && req.user!.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Policy belongs to different organization.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    console.error('Error fetching policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/policies
 * @desc    Create a new booking policy
 * @access  Admin, Company Admin
 */
export const createPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId, id: userId } = req.user!;

    // Check if user has admin rights
    if (!['admin', 'company_admin', 'super_admin'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.',
      });
      return;
    }

    const {
      name,
      description,
      role,
      policyType,
      flightMaxAmount,
      hotelMaxAmountPerNight,
      hotelMaxAmountTotal,
      monthlyLimit,
      annualLimit,
      currency,
      allowedFlightClasses,
      requiresApprovalAbove,
      autoApproveBelow,
      allowManagerOverride,
      allowExceptions,
      advanceBookingDays,
      maxTripDuration,
      isActive,
      priority,
      effectiveFrom,
      effectiveTo,
    } = req.body;

    // Validation
    if (!name || !role || !policyType) {
      res.status(400).json({
        success: false,
        message: 'Name, role, and policy type are required',
      });
      return;
    }

    // Validate role
    const validRoles = ['employee', 'traveler', 'manager', 'admin', 'company_admin'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
      return;
    }

    // Validate policy type
    const validTypes = ['per_night', 'per_trip', 'per_booking', 'monthly_limit', 'annual_limit'];
    if (!validTypes.includes(policyType)) {
      res.status(400).json({
        success: false,
        message: `Invalid policy type. Must be one of: ${validTypes.join(', ')}`,
      });
      return;
    }

    const policy = await PolicyService.createPolicy({
      name,
      description,
      role,
      policyType,
      flightMaxAmount,
      hotelMaxAmountPerNight,
      hotelMaxAmountTotal,
      monthlyLimit,
      annualLimit,
      currency: currency || 'USD',
      allowedFlightClasses,
      requiresApprovalAbove,
      autoApproveBelow,
      allowManagerOverride: allowManagerOverride ?? false,
      allowExceptions: allowExceptions ?? true,
      advanceBookingDays,
      maxTripDuration,
      isActive: isActive ?? true,
      priority: priority ?? 0,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      organization: {
        connect: { id: organizationId },
      },
      creator: {
        connect: { id: userId },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      data: policy,
    });
  } catch (error: any) {
    console.error('Error creating policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create policy',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/policies/:id
 * @desc    Update a booking policy
 * @access  Admin, Company Admin
 */
export const updatePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    // Check if user has admin rights
    if (!['admin', 'company_admin', 'super_admin'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.',
      });
      return;
    }

    // Check if policy exists and belongs to organization
    const existingPolicy = await PolicyService.getPolicyById(id);
    if (!existingPolicy) {
      res.status(404).json({
        success: false,
        message: 'Policy not found',
      });
      return;
    }

    if (existingPolicy.organizationId !== organizationId && req.user!.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Policy belongs to different organization.',
      });
      return;
    }

    const {
      name,
      description,
      role,
      policyType,
      flightMaxAmount,
      hotelMaxAmountPerNight,
      hotelMaxAmountTotal,
      monthlyLimit,
      annualLimit,
      currency,
      allowedFlightClasses,
      requiresApprovalAbove,
      autoApproveBelow,
      allowManagerOverride,
      allowExceptions,
      advanceBookingDays,
      maxTripDuration,
      isActive,
      priority,
      effectiveFrom,
      effectiveTo,
    } = req.body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (role !== undefined) updateData.role = role;
    if (policyType !== undefined) updateData.policyType = policyType;
    if (flightMaxAmount !== undefined) updateData.flightMaxAmount = flightMaxAmount;
    if (hotelMaxAmountPerNight !== undefined) updateData.hotelMaxAmountPerNight = hotelMaxAmountPerNight;
    if (hotelMaxAmountTotal !== undefined) updateData.hotelMaxAmountTotal = hotelMaxAmountTotal;
    if (monthlyLimit !== undefined) updateData.monthlyLimit = monthlyLimit;
    if (annualLimit !== undefined) updateData.annualLimit = annualLimit;
    if (currency !== undefined) updateData.currency = currency;
    if (allowedFlightClasses !== undefined) updateData.allowedFlightClasses = allowedFlightClasses;
    if (requiresApprovalAbove !== undefined) updateData.requiresApprovalAbove = requiresApprovalAbove;
    if (autoApproveBelow !== undefined) updateData.autoApproveBelow = autoApproveBelow;
    if (allowManagerOverride !== undefined) updateData.allowManagerOverride = allowManagerOverride;
    if (allowExceptions !== undefined) updateData.allowExceptions = allowExceptions;
    if (advanceBookingDays !== undefined) updateData.advanceBookingDays = advanceBookingDays;
    if (maxTripDuration !== undefined) updateData.maxTripDuration = maxTripDuration;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (priority !== undefined) updateData.priority = priority;
    if (effectiveFrom !== undefined) updateData.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo !== undefined) updateData.effectiveTo = new Date(effectiveTo);

    const policy = await PolicyService.updatePolicy(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Policy updated successfully',
      data: policy,
    });
  } catch (error: any) {
    console.error('Error updating policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update policy',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/policies/:id
 * @desc    Delete a booking policy (soft delete)
 * @access  Admin, Company Admin
 */
export const deletePolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    // Check if user has admin rights
    if (!['admin', 'company_admin', 'super_admin'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.',
      });
      return;
    }

    // Check if policy exists and belongs to organization
    const existingPolicy = await PolicyService.getPolicyById(id);
    if (!existingPolicy) {
      res.status(404).json({
        success: false,
        message: 'Policy not found',
      });
      return;
    }

    if (existingPolicy.organizationId !== organizationId && req.user!.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Policy belongs to different organization.',
      });
      return;
    }

    await PolicyService.deletePolicy(id);

    res.status(200).json({
      success: true,
      message: 'Policy deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete policy',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/policies/my-policy
 * @desc    Get the effective policy for the current user
 * @access  Authenticated users
 */
export const getMyPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: userId, organizationId } = req.user!;

    const policy = await PolicyService.getPolicyForUser(userId, organizationId);

    if (!policy) {
      res.status(200).json({
        success: true,
        message: 'No policy configured for your role',
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    console.error('Error fetching user policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user policy',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/policies/check
 * @desc    Check if a booking complies with policy
 * @access  Authenticated users
 */
export const checkPolicyCompliance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: userId, organizationId } = req.user!;
    const {
      bookingType,
      amount,
      currency,
      flightClass,
      numberOfNights,
      totalAmount,
      departureDate,
      returnDate,
    } = req.body;

    // Validation
    if (!bookingType || !amount || !currency) {
      res.status(400).json({
        success: false,
        message: 'Booking type, amount, and currency are required',
      });
      return;
    }

    if (!['flight', 'hotel'].includes(bookingType)) {
      res.status(400).json({
        success: false,
        message: 'Booking type must be either "flight" or "hotel"',
      });
      return;
    }

    const complianceResult = await PolicyService.checkPolicyCompliance(
      userId,
      organizationId,
      {
        bookingType,
        amount,
        currency,
        flightClass,
        numberOfNights,
        totalAmount,
        departureDate: departureDate ? new Date(departureDate) : undefined,
        returnDate: returnDate ? new Date(returnDate) : undefined,
      }
    );

    res.status(200).json({
      success: true,
      data: complianceResult,
    });
  } catch (error: any) {
    console.error('Error checking policy compliance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check policy compliance',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/policies/:id/exceptions
 * @desc    Create a policy exception
 * @access  Manager, Admin, Company Admin
 */
export const createException = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: policyId } = req.params;
    const { organizationId, id: approverId } = req.user!;

    // Check if user has manager or admin rights
    if (!['manager', 'admin', 'company_admin', 'super_admin'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Manager or admin rights required.',
      });
      return;
    }

    const {
      userId,
      bookingId,
      exceptionType,
      flightMaxAmount,
      hotelMaxAmountPerNight,
      hotelMaxAmountTotal,
      reason,
      validFrom,
      validTo,
    } = req.body;

    // Validation
    if (!exceptionType || !reason) {
      res.status(400).json({
        success: false,
        message: 'Exception type and reason are required',
      });
      return;
    }

    const validExceptionTypes = ['user_permanent', 'user_temporary', 'booking_one_time', 'department'];
    if (!validExceptionTypes.includes(exceptionType)) {
      res.status(400).json({
        success: false,
        message: `Invalid exception type. Must be one of: ${validExceptionTypes.join(', ')}`,
      });
      return;
    }

    const exception = await PolicyService.createException({
      exceptionType,
      reason,
      flightMaxAmount,
      hotelMaxAmountPerNight,
      hotelMaxAmountTotal,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: validTo ? new Date(validTo) : undefined,
      approvedAt: new Date(),
      policy: {
        connect: { id: policyId },
      },
      organization: {
        connect: { id: organizationId },
      },
      user: userId ? {
        connect: { id: userId },
      } : undefined,
      approver: {
        connect: { id: approverId },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Exception created successfully',
      data: exception,
    });
  } catch (error: any) {
    console.error('Error creating exception:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create exception',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/policies/:id/exceptions
 * @desc    Get all exceptions for a policy
 * @access  Admin, Company Admin
 */
export const getExceptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: policyId } = req.params;

    // Check if user has admin rights
    if (!['admin', 'company_admin', 'super_admin'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.',
      });
      return;
    }

    const exceptions = await PolicyService.getExceptions(policyId);

    res.status(200).json({
      success: true,
      data: exceptions,
    });
  } catch (error: any) {
    console.error('Error fetching exceptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exceptions',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/policies/usage-logs
 * @desc    Get policy usage logs
 * @access  Admin, Company Admin
 */
export const getUsageLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.user!;
    const { userId, policyId, eventType, startDate, endDate } = req.query;

    // Check if user has admin rights
    if (!['admin', 'company_admin', 'super_admin'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.',
      });
      return;
    }

    const logs = await PolicyService.getUsageLogs(organizationId, {
      userId: userId as string | undefined,
      policyId: policyId as string | undefined,
      eventType: eventType as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error('Error fetching usage logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage logs',
      error: error.message,
    });
  }
};
