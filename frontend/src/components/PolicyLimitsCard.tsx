'use client';

import { useEffect, useState } from 'react';
import { Shield, Plane, Hotel, DollarSign, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

interface Policy {
  id: string;
  name: string;
  description: string | null;
  flightMaxAmount: number | null;
  hotelMaxAmountPerNight: number | null;
  hotelMaxAmountTotal: number | null;
  allowedFlightClasses: string[] | null;
  requiresApprovalAbove: number | null;
}

export default function PolicyLimitsCard() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) return;

        const parsedUser = JSON.parse(userData);
        setUserEmail(parsedUser.email);

        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch(getApiEndpoint(`policies/user/${parsedUser.email}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPolicy(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching policy:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-0.5">No Policy Assigned</h3>
            <p className="text-xs text-gray-500">
              Contact your administrator for travel policy information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatAmount = (amount: number | null) => {
    if (!amount) return 'No limit';
    return `$${amount.toLocaleString()}`;
  };

  const formatClasses = (classes: string[] | null) => {
    if (!classes || classes.length === 0) return 'Any class';
    return classes
      .map((c) => c.charAt(0).toUpperCase() + c.slice(1).replace('_', ' '))
      .join(', ');
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-gray-300 transition-all overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#ADF802]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{policy.name}</h3>
            <p className="text-[10px] text-gray-400">Your Travel Policy Limits</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {policy.description && (
          <p className="text-xs text-gray-600 mb-4 pb-4 border-b border-gray-200">
            {policy.description}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Flight Limits */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Plane className="w-3.5 h-3.5 text-gray-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-gray-900 mb-1.5">Flights</h4>
              <div className="space-y-1">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] text-gray-500">Max amount:</span>
                  <span className="text-[10px] font-bold text-gray-900">
                    {formatAmount(policy.flightMaxAmount)}
                  </span>
                </div>
                {policy.allowedFlightClasses && policy.allowedFlightClasses.length > 0 && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] text-gray-500">Classes:</span>
                    <span className="text-[10px] font-bold text-gray-900">
                      {formatClasses(policy.allowedFlightClasses)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hotel Limits */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Hotel className="w-3.5 h-3.5 text-gray-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-gray-900 mb-1.5">Hotels</h4>
              <div className="space-y-1">
                {policy.hotelMaxAmountPerNight && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] text-gray-500">Per night:</span>
                    <span className="text-[10px] font-bold text-gray-900">
                      {formatAmount(policy.hotelMaxAmountPerNight)}
                    </span>
                  </div>
                )}
                {policy.hotelMaxAmountTotal && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] text-gray-500">Total stay:</span>
                    <span className="text-[10px] font-bold text-gray-900">
                      {formatAmount(policy.hotelMaxAmountTotal)}
                    </span>
                  </div>
                )}
                {!policy.hotelMaxAmountPerNight && !policy.hotelMaxAmountTotal && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] text-gray-500">Max amount:</span>
                    <span className="text-[10px] font-bold text-gray-900">No limit</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Approval Threshold */}
        {policy.requiresApprovalAbove && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-4">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <p className="text-[10px] text-amber-900">
              <span className="font-semibold">Approval required</span> for bookings above{' '}
              <span className="font-semibold">{formatAmount(policy.requiresApprovalAbove)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
