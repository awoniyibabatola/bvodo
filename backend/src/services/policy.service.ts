import { PrismaClient, BookingPolicy, PolicyException, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * PolicyService
 * Handles all booking policy operations including:
 * - Fetching effective policies for users
 * - Checking policy compliance for bookings
 * - Managing policy exceptions
 * - Logging policy usage
 */

interface PolicyCheckRequest {
  bookingType: 'flight' | 'hotel';
  amount: number;
  currency: string;
  flightClass?: string;
  numberOfNights?: number;
  totalAmount?: number;
  departureDate?: Date;
  returnDate?: Date;
}

interface PolicyCheckResult {
  allowed: boolean;
  requiresApproval: boolean;
  policyId?: string;
  exceptionId?: string;
  violations: string[];
  limits: {
    flightMaxAmount?: number;
    hotelMaxAmountPerNight?: number;
    hotelMaxAmountTotal?: number;
    monthlyLimit?: number;
    annualLimit?: number;
    monthlySpent?: number;
    annualSpent?: number;
    monthlyRemaining?: number;
    annualRemaining?: number;
  };
}

export class PolicyService {
  /**
   * Get the effective policy for a user
   * Takes into account:
   * - Active policies
   * - User role
   * - Policy priority
   * - Effective dates
   * - Policy exceptions
   */
  async getPolicyForUser(
    userId: string,
    organizationId: string
  ): Promise<(BookingPolicy & { exception?: PolicyException | null }) | null> {
    try {
      // Get user to determine role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const today = new Date();

      // Find active policy for user's role
      const policy = await prisma.bookingPolicy.findFirst({
        where: {
          organizationId,
          role: user.role,
          isActive: true,
          OR: [
            {
              effectiveFrom: { lte: today },
              effectiveTo: { gte: today },
            },
            {
              effectiveFrom: { lte: today },
              effectiveTo: null,
            },
            {
              effectiveFrom: null,
              effectiveTo: { gte: today },
            },
            {
              effectiveFrom: null,
              effectiveTo: null,
            },
          ],
          deletedAt: null,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });

      if (!policy) {
        return null;
      }

      // Check for active exceptions for this user
      const exception = await prisma.policyException.findFirst({
        where: {
          policyId: policy.id,
          userId,
          isActive: true,
          OR: [
            {
              validFrom: { lte: today },
              validTo: { gte: today },
            },
            {
              validFrom: { lte: today },
              validTo: null,
            },
            {
              validFrom: null,
              validTo: { gte: today },
            },
            {
              validFrom: null,
              validTo: null,
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        ...policy,
        exception: exception || null,
      };
    } catch (error) {
      console.error('Error fetching policy for user:', error);
      throw error;
    }
  }

  /**
   * Check if a booking complies with the user's policy
   */
  async checkPolicyCompliance(
    userId: string,
    organizationId: string,
    bookingRequest: PolicyCheckRequest
  ): Promise<PolicyCheckResult> {
    try {
      const policy = await this.getPolicyForUser(userId, organizationId);

      if (!policy) {
        // No policy defined - allow all bookings but log warning
        await this.logPolicyUsage({
          organizationId,
          userId,
          eventType: 'policy_applied',
          bookingType: bookingRequest.bookingType,
          requestedAmount: bookingRequest.amount,
          wasAllowed: true,
          requiresApproval: false,
          details: 'No policy defined for user role',
        });

        return {
          allowed: true,
          requiresApproval: false,
          violations: [],
          limits: {},
        };
      }

      const violations: string[] = [];
      let allowed = true;
      let requiresApproval = false;

      // Get effective limits (exception overrides base policy)
      const effectiveLimits = {
        flightMaxAmount:
          policy.exception?.flightMaxAmount || policy.flightMaxAmount,
        hotelMaxAmountPerNight:
          policy.exception?.hotelMaxAmountPerNight || policy.hotelMaxAmountPerNight,
        hotelMaxAmountTotal:
          policy.exception?.hotelMaxAmountTotal || policy.hotelMaxAmountTotal,
        monthlyLimit: policy.monthlyLimit,
        annualLimit: policy.annualLimit,
      };

      // Check booking amount against policy limits
      if (bookingRequest.bookingType === 'flight') {
        // Check flight-specific limits
        if (
          effectiveLimits.flightMaxAmount &&
          bookingRequest.amount > Number(effectiveLimits.flightMaxAmount)
        ) {
          violations.push(
            `Flight amount ($${bookingRequest.amount}) exceeds maximum allowed ($${effectiveLimits.flightMaxAmount})`
          );
          allowed = false;
        }

        // Check allowed flight classes
        if (
          bookingRequest.flightClass &&
          policy.allowedFlightClasses &&
          Array.isArray(policy.allowedFlightClasses)
        ) {
          const allowedClasses = policy.allowedFlightClasses as string[];
          if (!allowedClasses.includes(bookingRequest.flightClass)) {
            violations.push(
              `Flight class ${bookingRequest.flightClass} not allowed. Allowed classes: ${allowedClasses.join(', ')}`
            );
            allowed = false;
          }
        }
      } else if (bookingRequest.bookingType === 'hotel') {
        // Check hotel per-night limit
        if (
          effectiveLimits.hotelMaxAmountPerNight &&
          bookingRequest.numberOfNights
        ) {
          const perNightAmount = bookingRequest.amount / bookingRequest.numberOfNights;
          if (perNightAmount > Number(effectiveLimits.hotelMaxAmountPerNight)) {
            violations.push(
              `Hotel per-night amount ($${perNightAmount.toFixed(2)}) exceeds maximum allowed ($${effectiveLimits.hotelMaxAmountPerNight})`
            );
            allowed = false;
          }
        }

        // Check hotel total limit
        if (
          effectiveLimits.hotelMaxAmountTotal &&
          bookingRequest.totalAmount &&
          bookingRequest.totalAmount > Number(effectiveLimits.hotelMaxAmountTotal)
        ) {
          violations.push(
            `Hotel total amount ($${bookingRequest.totalAmount}) exceeds maximum allowed ($${effectiveLimits.hotelMaxAmountTotal})`
          );
          allowed = false;
        }
      }

      // Check advance booking requirement
      if (
        policy.advanceBookingDays &&
        bookingRequest.departureDate
      ) {
        const daysUntilDeparture = Math.ceil(
          (bookingRequest.departureDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysUntilDeparture < policy.advanceBookingDays) {
          violations.push(
            `Booking must be made at least ${policy.advanceBookingDays} days in advance`
          );
          allowed = false;
        }
      }

      // Check maximum trip duration
      if (
        policy.maxTripDuration &&
        bookingRequest.departureDate &&
        bookingRequest.returnDate
      ) {
        const tripDuration = Math.ceil(
          (bookingRequest.returnDate.getTime() - bookingRequest.departureDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (tripDuration > policy.maxTripDuration) {
          violations.push(
            `Trip duration (${tripDuration} days) exceeds maximum allowed (${policy.maxTripDuration} days)`
          );
          allowed = false;
        }
      }

      // Check monthly limit
      let monthlySpent = 0;
      let monthlyRemaining = 0;
      if (effectiveLimits.monthlyLimit) {
        monthlySpent = await this.getMonthlySpending(userId, organizationId);
        monthlyRemaining = Number(effectiveLimits.monthlyLimit) - monthlySpent;

        if (monthlySpent + bookingRequest.amount > Number(effectiveLimits.monthlyLimit)) {
          violations.push(
            `Monthly limit exceeded. Spent: $${monthlySpent}, Limit: $${effectiveLimits.monthlyLimit}`
          );
          allowed = false;
        }
      }

      // Check annual limit
      let annualSpent = 0;
      let annualRemaining = 0;
      if (effectiveLimits.annualLimit) {
        annualSpent = await this.getAnnualSpending(userId, organizationId);
        annualRemaining = Number(effectiveLimits.annualLimit) - annualSpent;

        if (annualSpent + bookingRequest.amount > Number(effectiveLimits.annualLimit)) {
          violations.push(
            `Annual limit exceeded. Spent: $${annualSpent}, Limit: $${effectiveLimits.annualLimit}`
          );
          allowed = false;
        }
      }

      // Check if requires approval (even if allowed)
      if (
        allowed &&
        policy.requiresApprovalAbove &&
        bookingRequest.amount > Number(policy.requiresApprovalAbove)
      ) {
        requiresApproval = true;
      }

      // Check auto-approve threshold
      if (
        policy.autoApproveBelow &&
        bookingRequest.amount < Number(policy.autoApproveBelow)
      ) {
        requiresApproval = false;
      }

      // Allow manager override if configured
      if (!allowed && policy.allowManagerOverride) {
        requiresApproval = true;
        allowed = true; // Allow but require approval
      }

      // Log policy usage
      await this.logPolicyUsage({
        policyId: policy.id,
        organizationId,
        userId,
        eventType: allowed ? 'policy_applied' : 'policy_violated',
        policySnapshot: policy as any,
        bookingType: bookingRequest.bookingType,
        requestedAmount: bookingRequest.amount,
        policyLimit: Number(
          bookingRequest.bookingType === 'flight'
            ? effectiveLimits.flightMaxAmount
            : effectiveLimits.hotelMaxAmountPerNight
        ),
        currency: bookingRequest.currency,
        wasAllowed: allowed,
        requiresApproval,
        details: violations.join('; '),
      });

      return {
        allowed,
        requiresApproval,
        policyId: policy.id,
        exceptionId: policy.exception?.id,
        violations,
        limits: {
          flightMaxAmount: effectiveLimits.flightMaxAmount
            ? Number(effectiveLimits.flightMaxAmount)
            : undefined,
          hotelMaxAmountPerNight: effectiveLimits.hotelMaxAmountPerNight
            ? Number(effectiveLimits.hotelMaxAmountPerNight)
            : undefined,
          hotelMaxAmountTotal: effectiveLimits.hotelMaxAmountTotal
            ? Number(effectiveLimits.hotelMaxAmountTotal)
            : undefined,
          monthlyLimit: effectiveLimits.monthlyLimit
            ? Number(effectiveLimits.monthlyLimit)
            : undefined,
          annualLimit: effectiveLimits.annualLimit
            ? Number(effectiveLimits.annualLimit)
            : undefined,
          monthlySpent,
          annualSpent,
          monthlyRemaining,
          annualRemaining,
        },
      };
    } catch (error) {
      console.error('Error checking policy compliance:', error);
      throw error;
    }
  }

  /**
   * Calculate user's spending for the current month
   */
  async getMonthlySpending(
    userId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const result = await prisma.booking.aggregate({
        where: {
          userId,
          organizationId,
          status: {
            in: ['confirmed', 'completed', 'pending_approval', 'approved'],
          },
          createdAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
        _sum: {
          totalPrice: true,
        },
      });

      return Number(result._sum.totalPrice || 0);
    } catch (error) {
      console.error('Error calculating monthly spending:', error);
      return 0;
    }
  }

  /**
   * Calculate user's spending for the current year
   */
  async getAnnualSpending(
    userId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const now = new Date();
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      const lastDayOfYear = new Date(now.getFullYear(), 11, 31);

      const result = await prisma.booking.aggregate({
        where: {
          userId,
          organizationId,
          status: {
            in: ['confirmed', 'completed', 'pending_approval', 'approved'],
          },
          createdAt: {
            gte: firstDayOfYear,
            lte: lastDayOfYear,
          },
        },
        _sum: {
          totalPrice: true,
        },
      });

      return Number(result._sum.totalPrice || 0);
    } catch (error) {
      console.error('Error calculating annual spending:', error);
      return 0;
    }
  }

  /**
   * Log policy usage for audit trail
   */
  async logPolicyUsage(data: {
    policyId?: string;
    organizationId: string;
    userId: string;
    bookingId?: string;
    eventType: string;
    policySnapshot?: any;
    bookingType?: string;
    requestedAmount?: number;
    policyLimit?: number;
    currency?: string;
    wasAllowed: boolean;
    requiresApproval: boolean;
    details?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.policyUsageLog.create({
        data: {
          policyId: data.policyId,
          organizationId: data.organizationId,
          userId: data.userId,
          bookingId: data.bookingId,
          eventType: data.eventType,
          policySnapshot: data.policySnapshot,
          bookingType: data.bookingType,
          requestedAmount: data.requestedAmount,
          policyLimit: data.policyLimit,
          currency: data.currency,
          wasAllowed: data.wasAllowed,
          requiresApproval: data.requiresApproval,
          details: data.details,
          metadata: data.metadata,
        },
      });
    } catch (error) {
      console.error('Error logging policy usage:', error);
      // Don't throw - logging should not break the flow
    }
  }

  /**
   * Create a new booking policy
   */
  async createPolicy(data: Prisma.BookingPolicyCreateInput): Promise<BookingPolicy> {
    try {
      return await prisma.bookingPolicy.create({
        data,
        include: {
          organization: true,
          creator: true,
        },
      });
    } catch (error) {
      console.error('Error creating policy:', error);
      throw error;
    }
  }

  /**
   * Update a booking policy
   */
  async updatePolicy(
    id: string,
    data: Prisma.BookingPolicyUpdateInput
  ): Promise<BookingPolicy> {
    try {
      return await prisma.bookingPolicy.update({
        where: { id },
        data,
        include: {
          organization: true,
          creator: true,
        },
      });
    } catch (error) {
      console.error('Error updating policy:', error);
      throw error;
    }
  }

  /**
   * Delete a booking policy (soft delete)
   */
  async deletePolicy(id: string): Promise<BookingPolicy> {
    try {
      return await prisma.bookingPolicy.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });
    } catch (error) {
      console.error('Error deleting policy:', error);
      throw error;
    }
  }

  /**
   * Get all policies for an organization
   */
  async getPolicies(organizationId: string): Promise<BookingPolicy[]> {
    try {
      return await prisma.bookingPolicy.findMany({
        where: {
          organizationId,
          deletedAt: null,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
    } catch (error) {
      console.error('Error fetching policies:', error);
      throw error;
    }
  }

  /**
   * Get a single policy by ID
   */
  async getPolicyById(id: string): Promise<BookingPolicy | null> {
    try {
      return await prisma.bookingPolicy.findUnique({
        where: { id },
        include: {
          organization: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          exceptions: true,
        },
      });
    } catch (error) {
      console.error('Error fetching policy:', error);
      throw error;
    }
  }

  /**
   * Create a policy exception
   */
  async createException(
    data: Prisma.PolicyExceptionCreateInput
  ): Promise<PolicyException> {
    try {
      return await prisma.policyException.create({
        data,
        include: {
          policy: true,
          user: true,
          approver: true,
        },
      });
    } catch (error) {
      console.error('Error creating policy exception:', error);
      throw error;
    }
  }

  /**
   * Get all exceptions for a policy
   */
  async getExceptions(policyId: string): Promise<PolicyException[]> {
    try {
      return await prisma.policyException.findMany({
        where: { policyId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching exceptions:', error);
      throw error;
    }
  }

  /**
   * Get policy usage logs
   */
  async getUsageLogs(
    organizationId: string,
    filters?: {
      userId?: string;
      policyId?: string;
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<any[]> {
    try {
      const where: any = { organizationId };

      if (filters?.userId) where.userId = filters.userId;
      if (filters?.policyId) where.policyId = filters.policyId;
      if (filters?.eventType) where.eventType = filters.eventType;
      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      return await prisma.policyUsageLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          policy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit to 100 most recent logs
      });
    } catch (error) {
      console.error('Error fetching usage logs:', error);
      throw error;
    }
  }
}

export default new PolicyService();
