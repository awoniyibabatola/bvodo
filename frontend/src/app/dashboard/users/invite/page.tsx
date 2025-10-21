'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function InviteUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [orgCredits, setOrgCredits] = useState({
    available: 0,
    total: 0,
  });

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'traveler',
    creditLimit: '',
    department: '',
  });

  // Fetch organization credits on load
  useEffect(() => {
    const fetchOrgCredits = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const org = JSON.parse(localStorage.getItem('organization') || '{}');

        const res = await fetch('http://localhost:5000/api/v1/company-admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setOrgCredits({
            available: parseFloat(data.data.credits.available),
            total: parseFloat(data.data.credits.total),
          });
        }
      } catch (err) {
        console.error('Error fetching org credits:', err);
      }
    };

    fetchOrgCredits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validate credit allocation
    const requestedCredit = formData.creditLimit ? parseFloat(formData.creditLimit) : 0;
    if (requestedCredit > 0 && requestedCredit > orgCredits.available) {
      setError(`Insufficient credits. Available: $${orgCredits.available.toLocaleString()}, Requested: $${requestedCredit.toLocaleString()}`);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:5000/api/v1/company-admin/users/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setInvitationLink(data.data.invitationLink);
        // Reset form
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'traveler',
          creditLimit: '',
          department: '',
        });
      } else {
        setError(data.message || 'Failed to invite user');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Invite error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      <div className="max-w-3xl mx-auto px-4 py-8">
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
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invite User</h1>
              <p className="text-gray-600">Add a new member to your organization</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">Invitation Sent!</h3>
                <p className="text-sm text-green-700 mb-3">
                  The user has been invited successfully. Share this invitation link:
                </p>
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <code className="text-xs text-gray-700 break-all">{invitationLink}</code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(invitationLink);
                    alert('Link copied to clipboard!');
                  }}
                  className="mt-3 text-sm text-green-700 hover:text-green-800 font-medium"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="john.doe@company.com"
              />
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
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
                  Last Name <span className="text-red-500">*</span>
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

            {/* Role & Department */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
            </div>

            {/* Credit Limit - Only show for traveler and manager roles */}
            {(formData.role === 'traveler' || formData.role === 'manager') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Limit (USD)
                </label>
                <input
                  type="number"
                  name="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  max={orgCredits.available}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5000.00"
                />
                <div className="mt-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-gray-600">
                      Organization available credits: <span className="font-semibold text-gray-900">${orgCredits.available.toLocaleString()}</span>
                    </p>
                    {formData.creditLimit && parseFloat(formData.creditLimit) > orgCredits.available && (
                      <p className="text-red-600 font-medium mt-1">
                        ⚠️ Insufficient credits! Reduce the amount or add more credits to your organization.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Send Invitation
                  </>
                )}
              </button>
              <Link
                href="/dashboard"
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
