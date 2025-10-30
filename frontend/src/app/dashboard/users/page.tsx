'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  DollarSign,
  Edit,
  Trash2,
  MoreVertical,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Shield
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';
import UnifiedNavBar from '@/components/UnifiedNavBar';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  status: string;
  creditLimit: string;
  availableCredits: string;
  policyId?: string | null;
  policy?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function ManageUsersPage() {
  const [user, setUser] = useState({
    name: 'User',
    role: 'traveler',
    email: '',
    organization: '',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);

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
    fetchUsers();
  }, [statusFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);

      const response = await fetch(`${getApiEndpoint('company-admin/users')}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint(`company-admin/users/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('User deactivated successfully');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Failed to deactivate user');
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-[#ADF802]/10 text-gray-900 border-[#ADF802]/30',
      pending: 'bg-amber-50/50 text-amber-800 border-amber-200/50',
      inactive: 'bg-gray-100 text-gray-600 border-gray-300',
      suspended: 'bg-red-50 text-red-700 border-red-200',
    };

    const icons = {
      active: <CheckCircle className="w-3 h-3 text-[#ADF802]" />,
      pending: <Clock className="w-3 h-3 text-amber-600" />,
      inactive: <XCircle className="w-3 h-3 text-gray-500" />,
      suspended: <XCircle className="w-3 h-3 text-red-600" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${styles[status as keyof typeof styles] || styles.inactive}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <UnifiedNavBar currentPage="users" user={user} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">Manage Users</h1>
              <p className="text-xs text-gray-600">{filteredUsers.length} users in your organization</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/policies"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition whitespace-nowrap"
              >
                <Shield className="w-4 h-4" />
                <span>Policies</span>
              </Link>
              <Link
                href="/dashboard/users/invite"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite User</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="company_admin">Company Admin</option>
                <option value="manager">Manager</option>
                <option value="traveler">Traveler</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600 text-sm">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-sm">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Policy
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
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
                        <span className="capitalize text-sm text-gray-700">
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.policy ? (
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-sm text-gray-700">{user.policy.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">No policy</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{user.department || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">
                            ${parseFloat(user.availableCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-gray-500">
                            / ${parseFloat(user.creditLimit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/users/${user.id}/credits`}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                            title="Manage Credits"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/dashboard/users/${user.id}/edit`}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeactivateUser(user.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Deactivate User"
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
      </div>
    </div>
  );
}
