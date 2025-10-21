import { Request, Response } from 'express';
import AmadeusService, { FlightSearchParams } from '../services/amadeus.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Search for flights
 */
export const searchFlights = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      travelClass,
      nonStop,
      currencyCode,
      maxPrice,
      max,
    } = req.query;

    // Validation
    if (!origin || !destination || !departureDate || !adults) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: origin, destination, departureDate, adults',
      });
      return;
    }

    const searchParams: FlightSearchParams = {
      originLocationCode: origin as string,
      destinationLocationCode: destination as string,
      departureDate: departureDate as string,
      returnDate: returnDate as string | undefined,
      adults: parseInt(adults as string),
      children: children ? parseInt(children as string) : undefined,
      infants: infants ? parseInt(infants as string) : undefined,
      travelClass: travelClass as any,
      nonStop: nonStop === 'true',
      currencyCode: currencyCode as string,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      max: max ? parseInt(max as string) : 50,
    };

    const flights = await AmadeusService.searchFlights(searchParams);

    res.status(200).json({
      success: true,
      message: 'Flights retrieved successfully',
      data: flights,
      count: flights.length,
    });
  } catch (error: any) {
    logger.error('Search flights error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search flights',
    });
  }
};

/**
 * Get flight price
 */
export const getFlightPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { flightOffers } = req.body;

    if (!flightOffers || !Array.isArray(flightOffers)) {
      res.status(400).json({
        success: false,
        message: 'Missing or invalid flightOffers',
      });
      return;
    }

    const pricedFlights = await AmadeusService.getFlightPrice(flightOffers);

    res.status(200).json({
      success: true,
      message: 'Flight price retrieved successfully',
      data: pricedFlights,
    });
  } catch (error: any) {
    logger.error('Get flight price error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get flight price',
    });
  }
};

/**
 * Create flight booking
 */
export const createFlightBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { flightOffers, travelers } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!flightOffers || !travelers) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: flightOffers, travelers',
      });
      return;
    }

    const flightOrder = await AmadeusService.createFlightOrder(flightOffers, travelers);

    // TODO: Save booking to database
    // const booking = await prisma.booking.create({...})

    res.status(201).json({
      success: true,
      message: 'Flight booked successfully',
      data: flightOrder,
    });
  } catch (error: any) {
    logger.error('Create flight booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create flight booking',
    });
  }
};

/**
 * Search for locations (airports/cities)
 */
export const searchLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameter: keyword',
      });
      return;
    }

    const locations = await AmadeusService.searchLocation(keyword as string);

    res.status(200).json({
      success: true,
      message: 'Locations retrieved successfully',
      data: locations,
    });
  } catch (error: any) {
    logger.error('Search locations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search locations',
    });
  }
};
