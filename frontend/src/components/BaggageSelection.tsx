'use client';

import { useState, useEffect } from 'react';
import { X, Briefcase, Plus, Minus, Check, DollarSign, Weight } from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

interface BaggageService {
  id: string;
  type: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  segmentIds: string[];
  passengerIds: string[];
  maxQuantity: number;
}

interface SelectedBaggage {
  serviceId: string;
  description: string;
  quantity: number;
  price: {
    amount: number;
    currency: string;
  };
  totalPrice: number;
}

interface BaggageSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  passengers: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  onConfirm: (selectedBaggage: SelectedBaggage[]) => void;
}

export default function BaggageSelection({
  isOpen,
  onClose,
  offerId,
  passengers,
  onConfirm,
}: BaggageSelectionProps) {
  const [baggageServices, setBaggageServices] = useState<BaggageService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBaggage, setSelectedBaggage] = useState<Map<string, SelectedBaggage>>(new Map());

  useEffect(() => {
    if (isOpen && offerId) {
      fetchBaggageServices();
    }
  }, [isOpen, offerId]);

  const fetchBaggageServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(getApiEndpoint(`flights/offers/${offerId}/services`));
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        setBaggageServices(data.data);
        setError(null);
      } else if (data.success && (!data.data || data.data.length === 0)) {
        setBaggageServices([]);
        setError('No additional baggage options available for this flight. Your ticket may already include baggage allowance.');
      } else {
        setError(data.message || 'Failed to load baggage options. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching baggage services:', error);
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (service: BaggageService, change: number) => {
    const current = selectedBaggage.get(service.id);
    const newQuantity = current ? current.quantity + change : change;

    if (newQuantity <= 0) {
      const updated = new Map(selectedBaggage);
      updated.delete(service.id);
      setSelectedBaggage(updated);
    } else if (newQuantity <= service.maxQuantity) {
      const updated = new Map(selectedBaggage);
      updated.set(service.id, {
        serviceId: service.id,
        description: service.description,
        quantity: newQuantity,
        price: service.price,
        totalPrice: service.price.amount * newQuantity,
      });
      setSelectedBaggage(updated);
    }
  };

  const totalCost = Array.from(selectedBaggage.values()).reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );
  const currency = baggageServices[0]?.price.currency || 'USD';

  const handleConfirm = () => {
    onConfirm(Array.from(selectedBaggage.values()));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg border border-white/20">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Add Extra Baggage</h2>
                <p className="text-gray-300 text-sm">
                  Select additional luggage for your trip
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
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mb-4" />
              <p className="text-gray-600">Loading baggage options...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md mx-auto">
                <Briefcase className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <p className="text-gray-900 font-semibold mb-2">Extra Baggage Unavailable</p>
                <p className="text-gray-600 text-sm mb-3">{error}</p>
                <div className="text-left bg-white rounded-lg p-3 mb-4 border border-yellow-100">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Common reasons:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Baggage is already included in your ticket</li>
                    <li>• Airline doesn't sell extra baggage online</li>
                    <li>• Add baggage at check-in or airport</li>
                    <li>• This fare type has restrictions</li>
                  </ul>
                </div>
                <button
                  onClick={onClose}
                  className="w-full px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          ) : baggageServices.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
                <Briefcase className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-gray-900 font-semibold mb-2">No Extra Baggage Available</p>
                <p className="text-gray-600 text-sm mb-3">
                  No additional baggage options are available for purchase at this time.
                </p>
                <div className="text-left bg-white rounded-lg p-3 mb-4 border border-blue-100">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Good news:</p>
                  <p className="text-xs text-gray-600">
                    Your ticket likely already includes baggage allowance. Check your booking confirmation for details.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {baggageServices.map((service) => {
                const selected = selectedBaggage.get(service.id);
                const quantity = selected?.quantity || 0;

                return (
                  <div
                    key={service.id}
                    className="border-2 border-gray-200 rounded-xl p-5 hover:border-gray-400 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Weight className="w-5 h-5 text-gray-700" />
                          <h3 className="font-semibold text-gray-900">
                            {service.description}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Up to {service.maxQuantity} bag{service.maxQuantity > 1 ? 's' : ''} available
                        </p>
                        <div className="flex items-center space-x-2 text-lg font-bold text-gray-900">
                          <DollarSign className="w-5 h-5 text-gray-700" />
                          <span>
                            {service.price.currency} {service.price.amount.toFixed(2)} per bag
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1 border border-gray-200">
                          <button
                            onClick={() => updateQuantity(service, -1)}
                            disabled={quantity === 0}
                            className="p-2 hover:bg-white rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed border border-transparent hover:border-gray-300"
                          >
                            <Minus className="w-4 h-4 text-gray-700" />
                          </button>

                          <div className="w-12 text-center font-semibold text-gray-900">
                            {quantity}
                          </div>

                          <button
                            onClick={() => updateQuantity(service, 1)}
                            disabled={quantity >= service.maxQuantity}
                            className="p-2 hover:bg-white rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed border border-transparent hover:border-gray-300"
                          >
                            <Plus className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        {/* Total for this item */}
                        {quantity > 0 && (
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Subtotal</div>
                            <div className="font-bold text-gray-900">
                              {service.price.currency} {(service.price.amount * quantity).toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Info Box */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg border border-gray-300">
                  <Check className="w-5 h-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Baggage Information</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Each bag is subject to airline size and weight restrictions</li>
                    <li>• Bags are applied per passenger per segment</li>
                    <li>• Additional fees may apply at the airport for overweight items</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-2xl font-bold text-gray-900">
                <DollarSign className="w-6 h-6 text-gray-700" />
                <span>Total: {currency} {totalCost.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600">
                {Array.from(selectedBaggage.values()).reduce((sum, item) => sum + item.quantity, 0)} bag
                {Array.from(selectedBaggage.values()).reduce((sum, item) => sum + item.quantity, 0) !== 1
                  ? 's'
                  : ''}{' '}
                added
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              Skip Baggage Selection
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition shadow-lg flex items-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>Confirm Baggage</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
