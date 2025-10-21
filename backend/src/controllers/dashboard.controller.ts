import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class DashboardController {
  /**
   * Get dashboard statistics for the organization
   */
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      if (!user || !user.organizationId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get organization with credit balance
      const organization = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: {
          availableCredits: true,
          totalCredits: true,
          name: true,
        },
      });

      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Get user details to check role and personal credits
      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          role: true,
          creditLimit: true,
          availableCredits: true,
        },
      });

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Determine if user should see personal or organization credits
      const isAdminRole = currentUser.role === 'admin' || currentUser.role === 'company_admin';

      // Get bookings - for travelers/managers, only their bookings; for admins, all bookings
      const bookings = await prisma.booking.findMany({
        where: {
          organizationId: user.organizationId,
          ...(isAdminRole ? {} : { userId: user.userId }),
        },
        include: {
          hotelBookings: true,
          flightBookings: true,
        },
      });

      // Calculate statistics
      const totalBookings = bookings.length;

      // Count hotel bookings
      const hotelBookings = bookings.filter(b => b.bookingType === 'hotel');
      const totalHotelsBooked = hotelBookings.length;

      // Count flight bookings
      const flightBookings = bookings.filter(b => b.bookingType === 'flight');
      const totalFlightsTaken = flightBookings.length;

      // Calculate total hotel nights
      const totalHotelNights = hotelBookings.reduce((acc, booking) => {
        const hotelBooking = booking.hotelBookings && booking.hotelBookings.length > 0 ? booking.hotelBookings[0] : null;
        return acc + (hotelBooking?.numberOfNights || 0);
      }, 0);

      // Count unique destinations (cities)
      const uniqueCities = new Set<string>();
      hotelBookings.forEach(booking => {
        const hotelBooking = booking.hotelBookings && booking.hotelBookings.length > 0 ? booking.hotelBookings[0] : null;
        if (hotelBooking?.city) {
          uniqueCities.add(hotelBooking.city);
        }
      });
      flightBookings.forEach(booking => {
        const flightBooking = booking.flightBookings && booking.flightBookings.length > 0 ? booking.flightBookings[0] : null;
        if (flightBooking?.arrivalAirport) {
          uniqueCities.add(flightBooking.arrivalAirport);
        }
      });
      const totalDestinations = uniqueCities.size;

      // Calculate credits based on user role
      let availableCredits: number;
      let totalCredit: number;
      let totalCreditUsed: number;
      let totalCreditHeld: number;
      let creditUsagePercentage: number;

      if (isAdminRole) {
        // For admins: show organization credits
        const creditTransactions = await prisma.creditTransaction.findMany({
          where: {
            organizationId: user.organizationId,
          },
        });

        totalCreditUsed = creditTransactions
          .filter(t => t.transactionType === 'credit_deducted')
          .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);

        totalCreditHeld = creditTransactions
          .filter(t => t.transactionType === 'credit_held')
          .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);

        availableCredits = parseFloat(organization.availableCredits.toString());
        totalCredit = parseFloat(organization.totalCredits.toString());

        creditUsagePercentage = totalCredit > 0
          ? Math.round(((totalCredit - availableCredits) / totalCredit) * 100)
          : 0;
      } else {
        // For travelers/managers: show personal credits
        availableCredits = parseFloat(currentUser.availableCredits.toString());
        totalCredit = parseFloat(currentUser.creditLimit.toString());
        totalCreditUsed = totalCredit - availableCredits;
        totalCreditHeld = 0; // We can track this if needed

        creditUsagePercentage = totalCredit > 0
          ? Math.round((totalCreditUsed / totalCredit) * 100)
          : 0;
      }

      // Get recent bookings (last 5)
      const recentBookings = await prisma.booking.findMany({
        where: {
          organizationId: user.organizationId,
          ...(isAdminRole ? {} : { userId: user.userId }),
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          hotelBookings: true,
          flightBookings: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      });

      // Format recent bookings
      const formattedRecentBookings = recentBookings.map(booking => {
        let route = '';
        const hotelBooking = booking.hotelBookings && booking.hotelBookings.length > 0 ? booking.hotelBookings[0] : null;
        const flightBooking = booking.flightBookings && booking.flightBookings.length > 0 ? booking.flightBookings[0] : null;

        if (booking.bookingType === 'hotel' && hotelBooking) {
          route = hotelBooking.hotelName || 'Hotel Booking';
        } else if (booking.bookingType === 'flight' && flightBooking) {
          route = `${flightBooking.departureAirport} → ${flightBooking.arrivalAirport}`;
        }

        // Map status properly for frontend display
        let displayStatus = booking.status;
        if (booking.status === 'confirmed' || booking.status === 'completed') {
          displayStatus = 'confirmed';
        } else if (booking.status === 'pending_approval') {
          displayStatus = 'pending_approval';
        } else if (booking.status === 'awaiting_confirmation') {
          displayStatus = 'awaiting_confirmation';
        } else if (booking.status === 'cancelled' || booking.status === 'rejected') {
          displayStatus = 'cancelled';
        } else if (booking.status === 'pending') {
          displayStatus = 'pending';
        }

        return {
          type: booking.bookingType === 'flight' ? 'Flight' : 'Hotel',
          route,
          traveler: `${booking.user.firstName} ${booking.user.lastName}`,
          date: booking.createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          status: displayStatus,
          amount: `$${parseFloat(booking.totalPrice?.toString() || '0').toFixed(0)}`,
        };
      });

      return res.json({
        credits: {
          available: availableCredits,
          used: totalCreditUsed,
          held: totalCreditHeld,
          total: totalCredit,
          usagePercentage: creditUsagePercentage,
        },
        stats: {
          totalBookings,
          hotelsBooked: totalHotelsBooked,
          hotelNights: totalHotelNights,
          flightsTaken: totalFlightsTaken,
          destinations: totalDestinations,
        },
        recentBookings: formattedRecentBookings,
        organization: {
          name: organization.name,
        },
      });
    } catch (error: any) {
      logger.error('Dashboard stats error:', error);
      return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }
}
