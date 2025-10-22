'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

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
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, [pagination.page]);

  const fetchOrganizations = async (search?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const searchParam = search || searchTerm;
      const url = `${getApiEndpoint('super-admin/organizations')}?page=${pagination.page}&limit=20${searchParam ? `&search=${searchParam}` : ''}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchOrganizations(searchTerm);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(getApiEndpoint('auth/logout'), {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => router.push('/super-admin')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">All Organizations</h1>
              </div>
              <p className="text-sm text-gray-600">
                Manage and monitor all organizations on the platform
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">{pagination.total} organizations</span>
              <button
                onClick={handleLogout}
                className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-2"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or subdomain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  fetchOrganizations('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-600">Loading organizations...</div>
          ) : organizations.length === 0 ? (
            <div className="p-12 text-center text-gray-600">No organizations found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Bookings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Credits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
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
                        <td className="px-6 py-4 text-sm text-gray-600">{org.email}</td>
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
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  org.creditUsagePercentage > 80
                                    ? 'bg-red-600'
                                    : org.creditUsagePercentage > 50
                                    ? 'bg-orange-600'
                                    : 'bg-green-600'
                                }`}
                                style={{ width: `${org.creditUsagePercentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {org.creditUsagePercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(org.createdAt).toLocaleDateString()}
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

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} organizations
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
