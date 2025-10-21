'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Star, MapPin as MapPinIcon, DollarSign } from 'lucide-react';
import Link from 'next/link';

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const useMapHook = dynamic(
  () => import('react-leaflet').then((mod) => ({ default: mod.useMap })),
  { ssr: false }
);

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Custom marker icons with improved design
const createCustomIcon = (isSelected: boolean, price?: string) => {
  const primaryColor = isSelected ? '#2563EB' : '#1F2937';
  const bgColor = isSelected ? '#ffffff' : '#ffffff';
  const shadowColor = isSelected ? 'rgba(37, 99, 235, 0.3)' : 'rgba(0, 0, 0, 0.2)';
  const borderColor = isSelected ? '#2563EB' : '#E5E7EB';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative; filter: drop-shadow(0 4px 12px ${shadowColor});">
        <div style="
          background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor} 100%);
          border: 2px solid ${borderColor};
          border-radius: 20px;
          padding: 6px 12px;
          font-weight: 700;
          font-size: 13px;
          color: ${primaryColor};
          white-space: nowrap;
          transform: translateY(-100%);
          transition: all 0.2s ease;
          ${isSelected ? 'transform: translateY(-100%) scale(1.1);' : ''}
        ">
          ${price || '📍'}
        </div>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid ${borderColor};
        "></div>
        <div style="
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${bgColor};
        "></div>
      </div>
    `,
    iconSize: [70, 45],
    iconAnchor: [35, 45],
    popupAnchor: [0, -45],
  });
};

// Component to update map view when hotels change
const MapUpdater = dynamic(
  () => Promise.resolve(({ hotels }: { hotels: any[] }) => {
    // This will be defined client-side only
    const { useMap } = require('react-leaflet');
    const map = useMap();

    useEffect(() => {
      if (hotels && hotels.length > 0 && map) {
        const bounds = L.latLngBounds(
          hotels
            .filter(h => h.latitude && h.longitude)
            .map(h => [h.latitude, h.longitude] as [number, number])
        );
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      }
    }, [hotels, map]);

    return null;
  }),
  { ssr: false }
);

// Map tile options
const MAP_STYLES = {
  standard: {
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  terrain: {
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
};

interface HotelMapProps {
  hotels: any[];
  selectedHotel: any;
  onHotelSelect: (hotel: any) => void;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  roomQuantity: number;
}

export default function HotelMap({
  hotels,
  selectedHotel,
  onHotelSelect,
  checkInDate,
  checkOutDate,
  adults,
  roomQuantity,
}: HotelMapProps) {
  const [mounted, setMounted] = useState(false);
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('standard');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get center coordinates from hotels or default to New York
  const getCenter = (): [number, number] => {
    if (hotels && hotels.length > 0) {
      const validHotel = hotels.find(h => h.latitude && h.longitude);
      if (validHotel) {
        return [validHotel.latitude, validHotel.longitude];
      }
    }
    return [40.7128, -74.0060]; // New York default
  };

  // Prepare hotel data with coordinates
  const hotelsWithCoords = hotels
    .map((hotel, index) => {
      // Try to get coordinates from geocoding or use approximate location
      // For demo, we'll add slight variations to city center for visualization
      const baseLatitude = getCenter()[0];
      const baseLongitude = getCenter()[1];

      return {
        ...hotel,
        latitude: baseLatitude + (Math.random() - 0.5) * 0.05,
        longitude: baseLongitude + (Math.random() - 0.5) * 0.05,
      };
    });

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  const currentStyle = MAP_STYLES[mapStyle];

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Map Style Selector */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '16px',
        zIndex: 1001,
        background: 'white',
        borderRadius: '12px',
        padding: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {Object.entries(MAP_STYLES).map(([key, style]) => (
            <button
              key={key}
              onClick={() => setMapStyle(key as keyof typeof MAP_STYLES)}
              style={{
                padding: '6px 12px',
                border: mapStyle === key ? '2px solid #2563EB' : '2px solid transparent',
                borderRadius: '8px',
                background: mapStyle === key ? '#EFF6FF' : '#F9FAFB',
                color: mapStyle === key ? '#2563EB' : '#6B7280',
                fontSize: '12px',
                fontWeight: mapStyle === key ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>

      <MapContainer
        center={getCenter()}
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          key={mapStyle}
          attribution={currentStyle.attribution}
          url={currentStyle.url}
        />

        <MapUpdater hotels={hotelsWithCoords} />

      {hotelsWithCoords.map((hotel, index) => {
        const isSelected = selectedHotel?.hotel?.hotelId === hotel.hotel?.hotelId;
        const price = hotel.offers && hotel.offers.length > 0
          ? `$${hotel.offers[0].price?.total || hotel.offers[0].price?.base}`
          : undefined;

        return (
          <Marker
            key={index}
            position={[hotel.latitude, hotel.longitude]}
            icon={createCustomIcon(isSelected, price)}
            eventHandlers={{
              click: () => onHotelSelect(hotel),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[250px]">
                <h3 className="font-bold text-gray-900 mb-2 text-sm">
                  {hotel.hotel?.name || 'Hotel'}
                </h3>

                {hotel.hotel?.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-semibold text-gray-700">
                      {hotel.hotel.rating} / 5
                    </span>
                  </div>
                )}

                {hotel.hotel?.address && (
                  <div className="flex items-start gap-1 mb-2">
                    <MapPinIcon className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-gray-600">
                      {hotel.hotel.address.cityName || hotel.hotel.address.countryCode}
                    </span>
                  </div>
                )}

                {hotel.offers && hotel.offers.length > 0 && (
                  <div className="flex items-center gap-1 mb-3 p-2 bg-blue-50 rounded">
                    <DollarSign className="w-3 h-3 text-blue-600" />
                    <span className="text-sm font-bold text-blue-600">
                      ${hotel.offers[0].price?.total || hotel.offers[0].price?.base}
                    </span>
                    <span className="text-xs text-gray-600">per night</span>
                  </div>
                )}

                <Link
                  href={`/dashboard/hotels/${hotel.hotel?.hotelId}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=${adults}&rooms=${roomQuantity}`}
                  className="block w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-xs text-center"
                >
                  View Details
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
    </div>
  );
}
