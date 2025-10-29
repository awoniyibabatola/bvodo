'use client';

import React from 'react';
import { X } from 'lucide-react';
import PaymentMethodSelector from './PaymentMethodSelector';

interface PaymentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  selectedOffer: any;
  hotelName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  adults: number;
  rooms: number;
  currency?: string;
  paymentMethod: 'credit' | 'card';
  onPaymentMethodChange: (method: 'credit' | 'card') => void;
  userCredits: number;
  userRole?: string; // User role to show appropriate credit label
}

const PaymentSummaryModal: React.FC<PaymentSummaryModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  selectedOffer,
  hotelName,
  roomType,
  checkInDate,
  checkOutDate,
  numberOfNights,
  adults,
  rooms,
  currency = 'USD',
  paymentMethod,
  onPaymentMethodChange,
  userCredits,
  userRole = 'traveler',
}) => {
  if (!isOpen || !selectedOffer) return null;

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const basePrice = parseFloat(selectedOffer?.price?.base || '0');
  const taxes = parseFloat(selectedOffer?.price?.taxes || '0');
  const fees = parseFloat(selectedOffer?.price?.fees || '0');
  const totalPrice = parseFloat(selectedOffer?.price?.total || '0');
  const dueAtAccommodation = parseFloat(selectedOffer?.price?.dueAtAccommodation || '0');

  const cancellationPolicy = selectedOffer?.policies?.cancellation?.timeline || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Booking Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Hotel Details */}
          <div>
            <h3 className="font-medium text-gray-900 mb-1">{hotelName}</h3>
            <p className="text-sm text-gray-600 mb-3">{roomType}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Check-in:</span>
                <p className="font-medium">{formatDate(checkInDate)}</p>
              </div>
              <div>
                <span className="text-gray-600">Check-out:</span>
                <p className="font-medium">{formatDate(checkOutDate)}</p>
              </div>
              <div>
                <span className="text-gray-600">Guests:</span>
                <p className="font-medium">{adults} {adults === 1 ? 'Adult' : 'Adults'}</p>
              </div>
              <div>
                <span className="text-gray-600">Duration:</span>
                <p className="font-medium">{numberOfNights} {numberOfNights === 1 ? 'Night' : 'Nights'}</p>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="border-t pt-4">
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={onPaymentMethodChange}
              userCredits={userCredits}
              bookingAmount={totalPrice}
              userRole={userRole}
            />
          </div>

          {/* Price Breakdown */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Price Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Rate</span>
                <span className="font-medium">{formatCurrency(basePrice)}</span>
              </div>

              {taxes > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes</span>
                  <span className="font-medium">{formatCurrency(taxes)}</span>
                </div>
              )}

              {fees > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fees</span>
                  <span className="font-medium">{formatCurrency(fees)}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>

              {dueAtAccommodation > 0 && (
                <div className="flex justify-between pt-2 text-xs text-gray-600">
                  <span>Due at Hotel</span>
                  <span className="font-medium">{formatCurrency(dueAtAccommodation)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation Policy */}
          {cancellationPolicy.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Cancellation Policy</h3>
              <div className="space-y-2 text-sm text-gray-600">
                {cancellationPolicy.map((policy: any, index: number) => {
                  const penaltyAmount = parseFloat(policy.penalty_amount || '0');
                  const isFreeCancellation = penaltyAmount === 0;

                  return (
                    <p key={index}>
                      {isFreeCancellation ? (
                        <>Free cancellation before {formatDate(policy.before)}</>
                      ) : (
                        <>Penalty of {formatCurrency(penaltyAmount)} after {formatDate(policy.before)}</>
                      )}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummaryModal;
