'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Plane, Hotel, AlertCircle } from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

interface PolicyFormData {
  name: string;
  description: string;
  role: string;
  policyType: string;
  flightMaxAmount: string;
  hotelMaxAmountPerNight: string;
  hotelMaxAmountTotal: string;
  allowedFlightClasses: string[];
  requiresApprovalAbove: string;
  isActive: boolean;
}

interface PolicyModalProps {
  policy?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const FLIGHT_CLASSES = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First Class' },
];

const ROLES = [
  { value: 'traveler', label: 'Traveler' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'company_admin', label: 'Company Admin' },
];

const POLICY_TYPES = [
  { value: 'per_trip', label: 'Per Trip' },
  { value: 'per_booking', label: 'Per Booking' },
  { value: 'monthly_limit', label: 'Monthly Limit' },
  { value: 'annual_limit', label: 'Annual Limit' },
];

export default function PolicyModal({ policy, onClose, onSuccess }: PolicyModalProps) {
  const [formData, setFormData] = useState<PolicyFormData>({
    name: '',
    description: '',
    role: '',
    policyType: 'per_trip',
    flightMaxAmount: '',
    hotelMaxAmountPerNight: '',
    hotelMaxAmountTotal: '',
    allowedFlightClasses: ['economy'],
    requiresApprovalAbove: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name || '',
        description: policy.description || '',
        role: policy.role || 'traveler',
        policyType: policy.policyType || 'per_trip',
        flightMaxAmount: policy.flightMaxAmount?.toString() || '',
        hotelMaxAmountPerNight: policy.hotelMaxAmountPerNight?.toString() || '',
        hotelMaxAmountTotal: policy.hotelMaxAmountTotal?.toString() || '',
        allowedFlightClasses: policy.allowedFlightClasses || ['economy'],
        requiresApprovalAbove: policy.requiresApprovalAbove?.toString() || '',
        isActive: policy.isActive ?? true,
      });
    }
  }, [policy]);

  const handleClassToggle = (className: string) => {
    setFormData((prev) => {
      const classes = prev.allowedFlightClasses.includes(className)
        ? prev.allowedFlightClasses.filter((c) => c !== className)
        : [...prev.allowedFlightClasses, className];
      return { ...prev, allowedFlightClasses: classes };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');

      // Prepare payload
      const payload = {
        name: formData.name,
        description: formData.description || null,
        role: formData.role || null,
        policyType: formData.policyType,
        flightMaxAmount: formData.flightMaxAmount ? parseFloat(formData.flightMaxAmount) : null,
        hotelMaxAmountPerNight: formData.hotelMaxAmountPerNight
          ? parseFloat(formData.hotelMaxAmountPerNight)
          : null,
        hotelMaxAmountTotal: formData.hotelMaxAmountTotal
          ? parseFloat(formData.hotelMaxAmountTotal)
          : null,
        allowedFlightClasses: formData.allowedFlightClasses.length > 0
          ? formData.allowedFlightClasses
          : null,
        requiresApprovalAbove: formData.requiresApprovalAbove
          ? parseFloat(formData.requiresApprovalAbove)
          : null,
        isActive: formData.isActive,
      };

      const url = policy
        ? getApiEndpoint(`policies/${policy.id}`)
        : getApiEndpoint('policies');

      const response = await fetch(url, {
        method: policy ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to save policy');
      }
    } catch (err) {
      setError('Error saving policy');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {policy ? 'Edit Policy' : 'Create New Policy'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                placeholder="e.g., Standard Employee Policy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none"
                placeholder="Optional description of this policy"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category (Optional)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                >
                  <option value="">No category</option>
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Optional label for organizing policies
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Type *
                </label>
                <select
                  required
                  value={formData.policyType}
                  onChange={(e) => setFormData({ ...formData, policyType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                >
                  {POLICY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Flight Limits */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Flight Limits
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Flight Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.flightMaxAmount}
                onChange={(e) =>
                  setFormData({ ...formData, flightMaxAmount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                placeholder="e.g., 1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for no limit
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Flight Classes
              </label>
              <div className="grid grid-cols-2 gap-3">
                {FLIGHT_CLASSES.map((fc) => (
                  <label
                    key={fc.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.allowedFlightClasses.includes(fc.value)}
                      onChange={() => handleClassToggle(fc.value)}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">{fc.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Hotel Limits */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Hotel className="w-5 h-5" />
              Hotel Limits
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Per Night ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.hotelMaxAmountPerNight}
                onChange={(e) =>
                  setFormData({ ...formData, hotelMaxAmountPerNight: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                placeholder="e.g., 200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Total Stay ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.hotelMaxAmountTotal}
                onChange={(e) =>
                  setFormData({ ...formData, hotelMaxAmountTotal: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                placeholder="e.g., 1000"
              />
            </div>
          </div>

          {/* Approval Settings */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Approval Settings
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requires Approval Above ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.requiresApprovalAbove}
                onChange={(e) =>
                  setFormData({ ...formData, requiresApprovalAbove: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                placeholder="e.g., 500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Bookings above this amount will require manager approval
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">Policy is active</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : policy ? 'Update Policy' : 'Create Policy'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
