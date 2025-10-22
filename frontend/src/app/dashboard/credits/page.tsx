'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  PlusCircle,
  MinusCircle,
  Search,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

interface OrganizationStats {
  organization: {
    name: string;
    totalCredits: string;
    availableCredits: string;
    usedCredits: string;
  };
  users: {
    total: number;
    active: number;
    pending: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
  };
  totalSpend: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  creditLimit: string;
  availableCredits: string;
  status: string;
}

export default function ManageCreditsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [allocateOperation, setAllocateOperation] = useState<'set' | 'add'>('set');
  const [processing, setProcessing] = useState(false);
  const [creditApplications, setCreditApplications] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      // Fetch stats
      const statsResponse = await fetch(getApiEndpoint('company-admin/stats'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch users
      const usersResponse = await fetch(`${getApiEndpoint('company-admin/users')}?status=active`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const usersData = await usersResponse.json();
      if (usersData.success) {
        setUsers(usersData.data.users);
      }

      // Fetch credit applications
      const appsResponse = await fetch(getApiEndpoint('credit-applications'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const appsData = await appsResponse.json();
      if (appsData.success) {
        setCreditApplications(appsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateCredits = async () => {
    if (!selectedUser || !allocateAmount) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint(`company-admin/users/${selectedUser.id}/credit/allocate`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(allocateAmount),
          operation: allocateOperation,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Credits allocated successfully!');
        setShowAllocateModal(false);
        setSelectedUser(null);
        setAllocateAmount('');
        fetchData();
      } else {
        alert(data.message || 'Failed to allocate credits');
      }
    } catch (error) {
      console.error('Error allocating credits:', error);
      alert('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      <div className="w-full px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Credits</h1>
              <p className="text-gray-600">Organization credit management</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Credits */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Total Credits</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ${parseFloat(stats.organization.totalCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Available Credits */}
            <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Available</span>
              </div>
              <div className="text-3xl font-bold text-green-600">
                ${parseFloat(stats.organization.availableCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Used Credits */}
            <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-50 rounded-xl">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Allocated</span>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                ${parseFloat(stats.organization.usedCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-white rounded-2xl shadow-lg border border-purple-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 rounded-xl">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Active Users</span>
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {stats.users.active}
              </div>
            </div>
          </div>
        )}

        {/* Credit Applications Section */}
        {creditApplications.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Credit Applications</h2>
            <div className="space-y-3">
              {creditApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      app.status === 'approved' ? 'bg-green-100' :
                      app.status === 'rejected' ? 'bg-red-100' :
                      app.status === 'pending' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {app.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {app.status === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                      {app.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600" />}
                      {app.status === 'under_review' && <AlertCircle className="w-5 h-5 text-blue-600" />}
                      {app.status === 'additional_info_required' && <AlertCircle className="w-5 h-5 text-orange-600" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        ${parseFloat(app.requestedAmount).toLocaleString()} {app.currency}
                      </div>
                      <div className="text-sm text-gray-600">
                        {app.status === 'approved' && `Approved: $${parseFloat(app.approvedAmount).toLocaleString()}`}
                        {app.status === 'rejected' && 'Rejected'}
                        {app.status === 'pending' && 'Pending Review'}
                        {app.status === 'under_review' && 'Under Review'}
                        {app.status === 'additional_info_required' && 'Additional Info Required'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apply for Credit Button */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Need More Credits?</h3>
                <p className="text-sm text-gray-600">Apply for additional credit to support your travel needs</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/credits/apply')}
              disabled={creditApplications.some(app => app.status === 'pending' || app.status === 'under_review')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Apply for Credit
            </button>
          </div>
          {creditApplications.some(app => app.status === 'pending' || app.status === 'under_review') && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                You have a pending application. Please wait for review before submitting a new application.
              </p>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users to allocate credits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Users Credit Table */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">User Credit Allocation</h2>
            <p className="text-sm text-gray-600 mt-1">Manage individual user credit limits</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Credit Limit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Used
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const limit = parseFloat(user.creditLimit);
                  const available = parseFloat(user.availableCredits);
                  const used = limit - available;
                  const utilization = limit > 0 ? (used / limit) * 100 : 0;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          ${limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-green-600">
                          ${available.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-orange-600">
                          ${used.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-orange-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{utilization.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowAllocateModal(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Allocate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Allocate Credits Modal */}
        {showAllocateModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Allocate Credits</h2>
              <p className="text-gray-600 mb-6">
                Managing credits for {selectedUser.firstName} {selectedUser.lastName}
              </p>

              <div className="space-y-4">
                {/* Current Balance */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Current Credit Limit</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${parseFloat(selectedUser.creditLimit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Operation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operation
                  </label>
                  <select
                    value={allocateOperation}
                    onChange={(e) => setAllocateOperation(e.target.value as 'set' | 'add')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="set">Set to amount</option>
                    <option value="add">Add to current</option>
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={allocateAmount}
                    onChange={(e) => setAllocateAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="5000.00"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAllocateCredits}
                    disabled={processing || !allocateAmount}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAllocateModal(false);
                      setSelectedUser(null);
                      setAllocateAmount('');
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
