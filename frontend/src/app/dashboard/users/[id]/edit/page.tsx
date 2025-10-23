'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, User, Mail, Briefcase, Shield } from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  status: string;
  creditLimit: string;
  availableCredits: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    department: '',
    status: '',
  });

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint('company-admin/users'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        const user = data.data.users.find((u: UserData) => u.id === userId);
        if (user) {
          setUserData(user);
          setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department || '',
            status: user.status,
          });
        } else {
          setError('User not found');
        }
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint(`company-admin/users/${userId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/users');
        }, 1500);
      } else {
        setError(data.message || 'Failed to update user');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard/users"
            className="text-gray-900 hover:text-gray-700 font-medium"
          >
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/users"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-900 rounded-2xl shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
              <p className="text-gray-600">Update user information and permissions</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <p className="text-sm text-green-700 font-medium">
              User updated successfully! Redirecting...
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* User Info Card */}
        {userData && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-900">
                  {userData.firstName} {userData.lastName}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {userData.email}
                </div>
                <div className="flex gap-4 mt-2 text-sm">
                  <div className="text-gray-600">
                    Credits: <span className="font-semibold text-gray-900">
                      ${parseFloat(userData.availableCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span> / ${parseFloat(userData.creditLimit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="w-4 h-4 inline mr-2" />
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="traveler">Traveler</option>
                <option value="manager">Manager</option>
                <option value="company_admin">Company Admin</option>
                <option value="admin">Admin</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                User's role determines their access level in the system
              </p>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Engineering"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Inactive or suspended users cannot access the system
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
              <Link
                href="/dashboard/users"
                className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
