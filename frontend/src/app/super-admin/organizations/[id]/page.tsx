'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft,
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Plus,
  Minus,
  Calendar,
  LogOut,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  totalCredits: string;
  availableCredits: string;
  creditCurrency: string;
  createdAt: string;
  updatedAt: string;
  users: any[];
  bookings: any[];
  creditTransactions: any[];
}

export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAction, setCreditAction] = useState<'allocate' | 'reduce'>('allocate');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditOperation, setCreditOperation] = useState<'add' | 'set'>('add');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetType, setResetType] = useState<'credits' | 'bookings'>('credits');

  useEffect(() => {
    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `http://localhost:5000/api/v1/super-admin/organizations/${organizationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setOrganization(data.data);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreditAction = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint =
        creditAction === 'allocate'
          ? `/api/v1/super-admin/organizations/${organizationId}/credits/allocate`
          : `/api/v1/super-admin/organizations/${organizationId}/credits/reduce`;

      const body =
        creditAction === 'allocate'
          ? { amount: parseFloat(creditAmount), operation: creditOperation }
          : { amount: parseFloat(creditAmount) };

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert(`Credits ${creditAction === 'allocate' ? 'allocated' : 'reduced'} successfully`);
        setShowCreditModal(false);
        setCreditAmount('');
        fetchOrganization();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update credits');
      }
    } catch (error) {
      console.error('Error updating credits:', error);
      alert('Failed to update credits');
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch('http://localhost:5000/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('organization');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      router.push('/login');
    }
  };

  const handleReset = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      let endpoint = '';
      let method = 'POST';

      if (resetType === 'credits') {
        endpoint = `http://localhost:5000/api/v1/super-admin/organizations/${organizationId}/credits/reset`;
      } else {
        endpoint = `http://localhost:5000/api/v1/super-admin/organizations/${organizationId}/bookings`;
        method = 'DELETE';
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        alert(`${resetType === 'credits' ? 'Credits' : 'Bookings'} reset successfully`);
        setShowResetModal(false);
        fetchOrganization();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to reset');
      }
    } catch (error) {
      console.error('Reset error:', error);
      alert('Failed to reset');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading organization...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Organization not found</div>
      </div>
    );
  }

  const usedCredits =
    parseFloat(organization.totalCredits) - parseFloat(organization.availableCredits);
  const usagePercentage =
    parseFloat(organization.totalCredits) > 0
      ? Math.round((usedCredits / parseFloat(organization.totalCredits)) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => router.push('/super-admin/organizations')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{organization.subdomain}</span>
                <span>•</span>
                <span>{organization.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCreditAction('allocate');
                  setShowCreditModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Credits
              </button>
              <button
                onClick={() => {
                  setCreditAction('reduce');
                  setShowCreditModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Minus className="w-4 h-4" />
                Reduce Credits
              </button>
              <div className="border-l border-gray-300 h-8"></div>
              <button
                onClick={() => {
                  setResetType('credits');
                  setShowResetModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                title="Reset All Credits"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Credits
              </button>
              <button
                onClick={() => {
                  setResetType('bookings');
                  setShowResetModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                title="Delete All Bookings"
              >
                <Trash2 className="w-4 h-4" />
                Delete Bookings
              </button>
              <button
                onClick={handleLogout}
                className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{organization.users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{organization.bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Credits</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${parseFloat(organization.availableCredits).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(organization.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Credit Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Credits</p>
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(organization.totalCredits).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Available</p>
              <p className="text-2xl font-bold text-green-600">
                ${parseFloat(organization.availableCredits).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Used</p>
              <p className="text-2xl font-bold text-orange-600">
                ${usedCredits.toLocaleString()}
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Credit Usage</span>
              <span className="text-sm font-medium text-gray-900">{usagePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  usagePercentage > 80
                    ? 'bg-red-600'
                    : usagePercentage > 50
                    ? 'bg-orange-600'
                    : 'bg-green-600'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            </div>
            <div className="p-6">
              {organization.users.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No users yet</p>
              ) : (
                <div className="space-y-3">
                  {organization.users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'company_admin'
                            ? 'bg-blue-100 text-blue-700'
                            : user.role === 'manager'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                  ))}
                  {organization.users.length > 5 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      +{organization.users.length - 5} more users
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
            </div>
            <div className="p-6">
              {organization.bookings.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No bookings yet</p>
              ) : (
                <div className="space-y-3">
                  {organization.bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{booking.bookingReference}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${parseFloat(booking.totalPrice || '0').toLocaleString()}
                        </p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'pending_approval'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {organization.bookings.length > 5 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      +{organization.bookings.length - 5} more bookings
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Credit Transactions */}
        <div className="bg-white rounded-xl shadow-sm mt-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Credit Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            {organization.creditTransactions.length === 0 ? (
              <p className="text-gray-600 text-center py-12">No transactions yet</p>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {organization.creditTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.transactionType === 'credit_allocated'
                              ? 'bg-green-100 text-green-700'
                              : transaction.transactionType === 'credit_deducted'
                              ? 'bg-red-100 text-red-700'
                              : transaction.transactionType === 'credit_held'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {transaction.transactionType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${parseFloat(transaction.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {creditAction === 'allocate' ? 'Allocate Credits' : 'Reduce Credits'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {creditAction === 'allocate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operation
                  </label>
                  <select
                    value={creditOperation}
                    onChange={(e) => setCreditOperation(e.target.value as 'add' | 'set')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="add">Add to existing credits</option>
                    <option value="set">Set total credits</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Current total: ${parseFloat(organization.totalCredits).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Current available: ${parseFloat(organization.availableCredits).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  setCreditAmount('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreditAction}
                disabled={!creditAmount || parseFloat(creditAmount) <= 0}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition ${
                  creditAction === 'allocate'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {creditAction === 'allocate' ? 'Allocate' : 'Reduce'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {resetType === 'credits' ? 'Reset All Credits?' : 'Delete All Bookings?'}
              </h3>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 font-medium">⚠️ Warning: This action cannot be undone!</p>
              </div>
              {resetType === 'credits' ? (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>This will:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Set organization credits to $0</li>
                    <li>Set all user credits to $0</li>
                    <li>Create a transaction record</li>
                  </ul>
                  <p className="mt-3 font-medium">Current total credits: ${parseFloat(organization?.totalCredits || '0').toLocaleString()}</p>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>This will permanently delete:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>All bookings ({organization?.bookings.length || 0} total)</li>
                    <li>All hotel reservations and guest details</li>
                    <li>All flight reservations</li>
                    <li>All credit transactions</li>
                  </ul>
                  <p className="mt-3 font-medium text-red-600">This will NOT restore credits!</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition ${
                  resetType === 'credits'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {resetType === 'credits' ? 'Reset Credits' : 'Delete Bookings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
