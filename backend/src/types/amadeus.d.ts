declare module 'amadeus' {
  export interface AmadeusConfig {
    clientId?: string;
    clientSecret?: string;
    hostname?: 'test' | 'production';
  }

  export default class Amadeus {
    constructor(config: AmadeusConfig);
    static location: any;
    shopping: {
      flightOffersSearch: {
        get(params: any): Promise<any>;
      };
      flightOffers: {
        pricing: {
          post(body: any): Promise<any>;
        };
      };
      hotelOffersSearch: {
        get(params: any): Promise<any>;
      };
      hotelOffersByHotel: {
        get(params: any): Promise<any>;
      };
    };
    booking: {
      flightOrders: {
        post(body: any): Promise<any>;
      };
    };
    referenceData: {
      locations: {
        get(params: any): Promise<any>;
        hotels: {
          byCity: {
            get(params: any): Promise<any>;
          };
        };
      };
      location(id: string): {
        get(): Promise<any>;
      };
    };
    media: {
      files: {
        generatedPhotos: {
          get(params: any): Promise<any>;
        };
      };
    };
    eReputation: {
      hotelSentiments: {
        get(params: any): Promise<any>;
      };
    };
  }
}
