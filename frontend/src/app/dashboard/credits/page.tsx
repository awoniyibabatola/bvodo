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
import UnifiedNavBar from '@/components/UnifiedNavBar';

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
  const [user, setUser] = useState({
    name: 'User',
    role: 'traveler',
    email: '',
    organization: '',
  });
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
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        name: `${parsedUser.firstName} ${parsedUser.lastName}`,
        role: parsedUser.role,
        email: parsedUser.email,
        organization: parsedUser.organization || '',
      });
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <UnifiedNavBar currentPage="dashboard" user={user} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">Manage Credits</h1>
            <p className="text-xs text-gray-600">Organization credit management</p>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Credits */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-xs text-gray-600 font-medium mb-2">Total Credits</div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                ${parseFloat(stats.organization.totalCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Available Credits */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-xs text-gray-600 font-medium mb-2">Available</div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                ${parseFloat(stats.organization.availableCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Used Credits */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-xs text-gray-600 font-medium mb-2">Allocated</div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                ${parseFloat(stats.organization.usedCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-xs text-gray-600 font-medium mb-2">Active Users</div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {stats.users.active}
              </div>
            </div>
          </div>
        )}

        {/* Credit Applications Section */}
        {creditApplications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Your Credit Applications</h2>
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
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Need More Credits?</h3>
              <p className="text-xs text-gray-600">Apply for additional credit to support your travel needs</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/credits/apply')}
              disabled={creditApplications.some(app => app.status === 'pending' || app.status === 'under_review')}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Apply for Credit</span>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users to allocate credits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
            />
          </div>
        </div>

        {/* Users Credit Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900">User Credit Allocation</h2>
            <p className="text-xs text-gray-600 mt-1">Manage individual user credit limits</p>
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
                          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{user.email}</div>
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
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium text-sm"
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
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Allocate Credits</h2>
              <p className="text-xs text-gray-600 mb-6">
                Managing credits for {selectedUser.firstName} {selectedUser.lastName}
              </p>

              <div className="space-y-4">
                {/* Current Balance */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-600 mb-1">Current Credit Limit</div>
                  <div className="text-xl font-bold text-gray-900">
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
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
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
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    placeholder="5000.00"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAllocateCredits}
                    disabled={processing || !allocateAmount}
                    className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAllocateModal(false);
                      setSelectedUser(null);
                      setAllocateAmount('');
                    }}
                    className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
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
