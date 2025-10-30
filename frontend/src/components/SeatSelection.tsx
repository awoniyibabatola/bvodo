'use client';

import { useState, useEffect } from 'react';
import { X, Plane, Users, Check, Info, DollarSign } from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

interface Seat {
  designator: string;
  available: boolean;
  price?: {
    amount: number;
    currency: string;
  };
  type: 'seat' | 'bassinet' | 'empty' | 'exit_row' | 'lavatory' | 'galley';
  serviceId?: string;
  disclosures?: string[];
}

interface SeatRow {
  seats: Seat[];
}

interface SeatCabin {
  cabinClass: string;
  rows: SeatRow[];
}

interface SeatMap {
  segmentId: string;
  cabins: SeatCabin[];
}

interface SelectedSeat {
  passengerId: string;
  passengerName: string;
  segmentId: string;
  seatDesignator: string;
  serviceId: string;
  price: {
    amount: number;
    currency: string;
  };
}

interface SeatSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  passengers: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  onConfirm: (selectedSeats: SelectedSeat[]) => void;
}

export default function SeatSelection({
  isOpen,
  onClose,
  offerId,
  passengers,
  onConfirm,
}: SeatSelectionProps) {
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

  // Fetch seat maps
  useEffect(() => {
    if (isOpen && offerId) {
      fetchSeatMaps();
    }
  }, [isOpen, offerId]);

  const fetchSeatMaps = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(getApiEndpoint(`flights/offers/${offerId}/seat-maps`));
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        setSeatMaps(data.data);
        setError(null);
      } else if (data.success && (!data.data || data.data.length === 0)) {
        setSeatMaps([]);
        setError('No seat maps available for this flight. Seat selection may not be offered by the airline.');
      } else {
        setError(data.message || 'Failed to load seat maps. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching seat maps:', error);
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentPassenger = passengers[currentPassengerIndex];
  const currentSeatMap = seatMaps[currentSegmentIndex];

  const handleSeatSelect = (seat: Seat, segmentId: string) => {
    if (!seat.available || !seat.serviceId) return;

    const newSelection: SelectedSeat = {
      passengerId: currentPassenger.id,
      passengerName: `${currentPassenger.firstName} ${currentPassenger.lastName}`,
      segmentId,
      seatDesignator: seat.designator,
      serviceId: seat.serviceId,
      price: seat.price || { amount: 0, currency: 'USD' },
    };

    // Remove any existing selection for this passenger/segment combo
    const filtered = selectedSeats.filter(
      (s) => !(s.passengerId === currentPassenger.id && s.segmentId === segmentId)
    );

    setSelectedSeats([...filtered, newSelection]);
  };

  const isSeatSelected = (seatDesignator: string, segmentId: string) => {
    return selectedSeats.some(
      (s) =>
        s.seatDesignator === seatDesignator &&
        s.segmentId === segmentId &&
        s.passengerId === currentPassenger.id
    );
  };

  const isSeatTaken = (seatDesignator: string, segmentId: string) => {
    return selectedSeats.some(
      (s) =>
        s.seatDesignator === seatDesignator &&
        s.segmentId === segmentId &&
        s.passengerId !== currentPassenger.id
    );
  };

  const nextPassenger = () => {
    if (currentPassengerIndex < passengers.length - 1) {
      setCurrentPassengerIndex(currentPassengerIndex + 1);
    }
  };

  const prevPassenger = () => {
    if (currentPassengerIndex > 0) {
      setCurrentPassengerIndex(currentPassengerIndex - 1);
    }
  };

  const totalCost = selectedSeats.reduce((sum, seat) => sum + seat.price.amount, 0);
  const currency = selectedSeats[0]?.price.currency || 'USD';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg border border-white/20">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Select Your Seat</h2>
                <p className="text-gray-300 text-sm">
                  {currentPassenger.firstName} {currentPassenger.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition border border-transparent hover:border-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Passenger Progress */}
          <div className="mt-4 flex items-center space-x-2">
            {passengers.map((passenger, index) => (
              <div
                key={passenger.id}
                className={`flex-1 h-2 rounded-full transition ${
                  index === currentPassengerIndex
                    ? 'bg-[#ADF802]'
                    : index < currentPassengerIndex
                    ? 'bg-gray-600'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mb-4" />
              <p className="text-gray-600">Loading seat map...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md mx-auto">
                <Info className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <p className="text-gray-900 font-semibold mb-2">Seat Selection Not Available</p>
                <p className="text-gray-600 text-sm mb-4">
                  We're unable to offer seat selection for this flight at this time. You may be able to select seats during check-in or at the airport.
                </p>
                <button
                  onClick={onClose}
                  className="w-full px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  Continue to Baggage
                </button>
              </div>
            </div>
          ) : !currentSeatMap ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-md mx-auto">
                <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-900 font-semibold mb-2">Seat Selection Not Available</p>
                <p className="text-gray-600 text-sm mb-3">We're unable to display seat options for this flight at this time.</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  Continue to Baggage
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Legend */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center space-x-6 text-sm border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white border-2 border-gray-900 rounded-lg" />
                  <span className="text-gray-700 font-medium">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[#ADF802] border-2 border-gray-900 rounded-lg" />
                  <span className="text-gray-700 font-medium">Selected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 border border-gray-400 rounded-lg" />
                  <span className="text-gray-700 font-medium">Occupied</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-100 border-2 border-gray-700 rounded-lg" />
                  <span className="text-gray-700 font-medium">Extra Legroom</span>
                </div>
              </div>

              {/* Cabin Sections */}
              {currentSeatMap.cabins.map((cabin, cabinIndex) => (
                <div key={cabinIndex} className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {cabin.cabinClass} Class
                    </h3>
                    <Plane className="w-5 h-5 text-gray-600" />
                  </div>

                  {/* Seat Grid */}
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-2">
                    {cabin.rows.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex items-center justify-center space-x-2">
                        {row.seats.map((seat, seatIndex) => {
                          if (seat.type === 'empty') {
                            return <div key={seatIndex} className="w-10 h-10" />;
                          }

                          if (seat.type === 'lavatory' || seat.type === 'galley') {
                            return (
                              <div
                                key={seatIndex}
                                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400"
                              >
                                {seat.type === 'lavatory' ? 'WC' : 'GAL'}
                              </div>
                            );
                          }

                          const isSelected = isSeatSelected(seat.designator, currentSeatMap.segmentId);
                          const isTaken = isSeatTaken(seat.designator, currentSeatMap.segmentId);
                          const isExitRow = seat.type === 'exit_row';

                          return (
                            <button
                              key={seatIndex}
                              onClick={() => handleSeatSelect(seat, currentSeatMap.segmentId)}
                              disabled={!seat.available || isTaken}
                              className={`
                                w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold
                                transition-all duration-200 transform hover:scale-110 border-2
                                ${
                                  isSelected
                                    ? 'bg-[#ADF802] text-gray-900 border-gray-900 shadow-lg scale-110'
                                    : !seat.available || isTaken
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                                    : isExitRow
                                    ? 'bg-gray-100 text-gray-900 border-gray-700 hover:bg-gray-200 hover:shadow-md'
                                    : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-50 hover:shadow-md'
                                }
                              `}
                              title={
                                seat.price
                                  ? `${seat.designator} - ${seat.price.currency} ${seat.price.amount}`
                                  : seat.designator
                              }
                            >
                              {isSelected ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                seat.designator
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                <DollarSign className="w-5 h-5 text-gray-700" />
                <span>Total: {currency} {totalCost.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600">
                {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={prevPassenger}
              disabled={currentPassengerIndex === 0}
              className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ← Previous
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Skip Seat Selection
              </button>

              {currentPassengerIndex < passengers.length - 1 ? (
                <button
                  onClick={nextPassenger}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition shadow-md"
                >
                  Next Passenger →
                </button>
              ) : (
                <button
                  onClick={() => onConfirm(selectedSeats)}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition shadow-lg flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm Seats
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
