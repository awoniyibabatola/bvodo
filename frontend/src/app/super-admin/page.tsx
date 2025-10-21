'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  DollarSign,
  Search,
  Plus,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  totalCredits: string;
  availableCredits: string;
  usedCredits: string;
  creditCurrency: string;
  creditUsagePercentage: number;
  userCount: number;
  bookingCount: number;
  createdAt: string;
}

interface Stats {
  totalOrganizations: number;
  totalUsers: number;
  totalBookings: number;
  totalCreditsAllocated: number;
  totalCreditsAvailable: number;
  totalCreditsUsed: number;
  creditUsagePercentage: number;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPlatformResetModal, setShowPlatformResetModal] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Check if user is super admin
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }

      const [statsRes, orgsRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/super-admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/v1/super-admin/organizations?limit=10', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok && orgsRes.ok) {
        const statsData = await statsRes.json();
        const orgsData = await orgsRes.json();
        setStats(statsData.data.stats);
        setOrganizations(orgsData.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `http://localhost:5000/api/v1/super-admin/organizations?search=${searchTerm}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.data);
      }
    } catch (error) {
      console.error('Error searching organizations:', error);
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

  const handlePlatformReset = async () => {
    if (confirmationCode !== 'RESET_ALL_DATA') {
      alert('Invalid confirmation code. Please enter "RESET_ALL_DATA" exactly.');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:5000/api/v1/super-admin/reset-platform', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmationCode }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Platform reset successful!\n\nAll credits and bookings have been deleted.\nBookings deleted: ${data.data.bookingsDeleted}`);
        setShowPlatformResetModal(false);
        setConfirmationCode('');
        fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to reset platform');
      }
    } catch (error) {
      console.error('Platform reset error:', error);
      alert('Failed to reset platform');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage all organizations and credits</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/dashboard/approvals')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Approvals
              </button>
              <button
                onClick={() => router.push('/dashboard/bookings')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Bookings
              </button>
              <button
                onClick={() => router.push('/super-admin/organizations')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Building2 className="w-4 h-4" />
                Organizations
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Organizations</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalOrganizations || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats?.totalBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Credits Allocated</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats?.totalCreditsAllocated.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Credit Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Credits</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats?.totalCreditsAllocated.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Available Credits</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats?.totalCreditsAvailable.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Used Credits</p>
              <p className="text-2xl font-bold text-orange-600">
                ${stats?.totalCreditsUsed.toLocaleString() || 0}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Usage</span>
              <span className="text-sm font-medium text-gray-900">{stats?.creditUsagePercentage || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${stats?.creditUsagePercentage || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Search & Organizations List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Organizations</h2>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{org.name}</p>
                        <p className="text-sm text-gray-500">{org.subdomain}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{org.userCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{org.bookingCount}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          ${parseFloat(org.totalCredits).toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600">
                          ${parseFloat(org.availableCredits).toLocaleString()} available
                        </p>
                        <p className="text-xs text-orange-600">
                          ${parseFloat(org.usedCredits).toLocaleString()} used
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              org.creditUsagePercentage > 80 ? 'bg-red-600' : org.creditUsagePercentage > 50 ? 'bg-orange-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${org.creditUsagePercentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{org.creditUsagePercentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/super-admin/organizations/${org.id}`)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 mt-8">
          <div className="p-6 border-b border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
                <p className="text-sm text-red-700">Irreversible actions that affect the entire platform</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Reset Entire Platform</h3>
                <p className="text-sm text-gray-600 mb-2">
                  This will permanently delete all credits and bookings across all organizations.
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Reset all organization credits to $0</li>
                  <li>Reset all user credits to $0</li>
                  <li>Delete all bookings ({stats?.totalBookings || 0} total)</li>
                  <li>Delete all credit transactions</li>
                </ul>
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">⚠️ This action cannot be undone!</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlatformResetModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium ml-6"
              >
                <AlertTriangle className="w-4 h-4" />
                Reset Platform
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Reset Confirmation Modal */}
      {showPlatformResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-200 bg-red-50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Reset Entire Platform?</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-900 font-bold mb-2">🚨 CRITICAL WARNING 🚨</p>
                <p className="text-sm text-red-800 font-medium">This action CANNOT be undone and will affect ALL organizations!</p>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-sm font-semibold text-gray-900">This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-1.5 ml-2 text-sm text-gray-700">
                  <li><span className="font-medium">{stats?.totalOrganizations || 0}</span> organizations credits (reset to $0)</li>
                  <li><span className="font-medium">{stats?.totalUsers || 0}</span> user credits (reset to $0)</li>
                  <li><span className="font-medium">{stats?.totalBookings || 0}</span> bookings (permanently deleted)</li>
                  <li>All hotel and flight reservations</li>
                  <li>All guest information</li>
                  <li>All credit transaction history</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 mb-2">
                  <span className="font-semibold">Note:</span> Super admin accounts will NOT be deleted or modified.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Type <code className="px-2 py-1 bg-gray-100 text-red-600 rounded font-mono text-xs">RESET_ALL_DATA</code> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="Enter confirmation code"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowPlatformResetModal(false);
                  setConfirmationCode('');
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePlatformReset}
                disabled={confirmationCode !== 'RESET_ALL_DATA'}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
              >
                Reset Platform
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
