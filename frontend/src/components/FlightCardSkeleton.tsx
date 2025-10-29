'use client';

export default function FlightCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Airline Logo and Flight Info */}
        <div className="flex items-start gap-3 sm:gap-4 flex-1">
          {/* Airline Logo Skeleton */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded flex-shrink-0" />

          {/* Flight Details Skeleton */}
          <div className="flex-1 space-y-3">
            {/* Airline Name */}
            <div className="h-4 bg-gray-200 rounded w-32" />

            {/* Route Info */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Departure Time */}
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-4" />
              {/* Arrival Time */}
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>

            {/* Duration & Stops */}
            <div className="flex items-center gap-4">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </div>

            {/* Airports */}
            <div className="flex items-center gap-2">
              <div className="h-3 bg-gray-200 rounded w-12" />
              <div className="h-3 bg-gray-200 rounded w-4" />
              <div className="h-3 bg-gray-200 rounded w-12" />
            </div>
          </div>
        </div>

        {/* Right: Price and Button */}
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
          {/* Price Skeleton */}
          <div className="flex-1 sm:flex-none sm:text-right">
            <div className="h-4 bg-gray-200 rounded w-16 mb-1" />
            <div className="h-8 bg-gray-200 rounded w-24" />
          </div>

          {/* Button Skeleton */}
          <div className="h-10 bg-gray-200 rounded w-full sm:w-32" />
        </div>
      </div>
    </div>
  );
}
