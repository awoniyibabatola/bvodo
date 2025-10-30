'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Plane,
  Hotel,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';
import UnifiedNavBar from '@/components/UnifiedNavBar';
import PolicyModal from '@/components/PolicyModal';

interface Policy {
  id: string;
  name: string;
  description: string | null;
  role: string;
  policyType: string;
  flightMaxAmount: number | null;
  hotelMaxAmountPerNight: number | null;
  hotelMaxAmountTotal: number | null;
  allowedFlightClasses: string[] | null;
  requiresApprovalAbove: number | null;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export default function PoliciesPage() {
  const [user, setUser] = useState({
    name: 'User',
    role: 'admin',
    email: '',
    organization: '',
  });
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser({
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        role: userData.role || 'admin',
        email: userData.email || '',
        organization: userData.organization?.name || '',
      });
    }
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Please log in to view policies');
        setLoading(false);
        return;
      }

      const response = await fetch(getApiEndpoint('policies'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPolicies(data.data || []);
      } else {
        setError(data.message || 'Failed to load policies');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint(`policies/${policyId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Policy deleted successfully');
        fetchPolicies();
      } else {
        alert(data.message || 'Failed to delete policy');
      }
    } catch (err) {
      alert('Error deleting policy');
    }
  };

  const handleToggleActive = async (policy: Policy) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint(`policies/${policy.id}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: policy.name,
          role: policy.role,
          policyType: policy.policyType,
          isActive: !policy.isActive,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchPolicies();
      } else {
        alert(data.message || 'Failed to update policy');
      }
    } catch (err) {
      alert('Error updating policy');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavBar currentPage="policies" user={user} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">Booking Policies</h1>
              <p className="text-xs text-gray-600">{policies.length} policies configured</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Create Policy
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-900">Error loading policies</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchPolicies}
                  className="mt-3 text-sm font-medium text-red-700 hover:text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Policies Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600 text-sm">Loading policies...</p>
            </div>
          ) : policies.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No policies yet</h3>
              <p className="text-sm text-gray-600 mb-6">Create your first booking policy to control travel spending</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Create Policy
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Policy Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role / Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Flight Limits
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Hotel Limits
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {policies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{policy.name}</div>
                          {policy.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{policy.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-700 font-medium">
                            <Users className="w-3 h-3" />
                            {policy.role.charAt(0).toUpperCase() + policy.role.slice(1).replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {policy.policyType.replace('_', ' ').split(' ').map(w =>
                              w.charAt(0).toUpperCase() + w.slice(1)
                            ).join(' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          {policy.flightMaxAmount ? (
                            <div className="text-gray-900 font-medium">
                              ${policy.flightMaxAmount.toLocaleString()}
                            </div>
                          ) : (
                            <div className="text-gray-400">-</div>
                          )}
                          {policy.allowedFlightClasses && policy.allowedFlightClasses.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {policy.allowedFlightClasses.slice(0, 2).map(c =>
                                c.replace('_', ' ').charAt(0).toUpperCase() + c.replace('_', ' ').slice(1)
                              ).join(', ')}
                              {policy.allowedFlightClasses.length > 2 && ' +' + (policy.allowedFlightClasses.length - 2)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          {policy.hotelMaxAmountPerNight && (
                            <div className="text-gray-900">
                              ${policy.hotelMaxAmountPerNight.toLocaleString()}/night
                            </div>
                          )}
                          {policy.hotelMaxAmountTotal && (
                            <div className="text-xs text-gray-500">
                              ${policy.hotelMaxAmountTotal.toLocaleString()} total
                            </div>
                          )}
                          {!policy.hotelMaxAmountPerNight && !policy.hotelMaxAmountTotal && (
                            <div className="text-gray-400">-</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(policy)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition"
                        >
                          {policy.isActive ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-green-700">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-600">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedPolicy(policy)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                            title="Edit Policy"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(policy.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Policy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {(showCreateModal || selectedPolicy) && (
          <PolicyModal
            policy={selectedPolicy}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedPolicy(null);
            }}
            onSuccess={fetchPolicies}
          />
        )}
      </div>
    </div>
  );
}
