'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react';
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

export default function UserCreditsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);

  const [action, setAction] = useState<'allocate' | 'reduce'>('allocate');
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState<'set' | 'add'>('set');
  const [reason, setReason] = useState('');

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

  const handleAllocateCredits = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint(`company-admin/users/${userId}/credit/allocate`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          operation: operation,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Successfully ${operation === 'set' ? 'set' : 'added'} $${amount} credits!`);
        setAmount('');
        setReason('');
        fetchUser();
      } else {
        setError(data.message || 'Failed to allocate credits');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Allocate error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReduceCredits = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint(`company-admin/users/${userId}/credit/reduce`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          reason: reason || 'Credit reduction by admin',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Successfully reduced $${amount} credits!`);
        setAmount('');
        setReason('');
        fetchUser();
      } else {
        setError(data.message || 'Failed to reduce credits');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Reduce error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (action === 'allocate') {
      await handleAllocateCredits();
    } else {
      await handleReduceCredits();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard/users"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  const creditLimit = parseFloat(userData?.creditLimit || '0');
  const availableCredits = parseFloat(userData?.availableCredits || '0');
  const usedCredits = creditLimit - availableCredits;
  const utilizationPercent = creditLimit > 0 ? (usedCredits / creditLimit) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage User Credits</h1>
              <p className="text-gray-600">Allocate or reduce credit balance</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && userData && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* User Info Card */}
        {userData && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-gray-900">
                  {userData.firstName} {userData.lastName}
                </div>
                <div className="text-sm text-gray-600">{userData.email}</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 capitalize">
                    {userData.role.replace('_', ' ')}
                  </span>
                  {userData.department && (
                    <span className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded-full border border-gray-200">
                      {userData.department}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Credit Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Credit Limit */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">Credit Limit</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  ${creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Available Credits */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">Available</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  ${availableCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Used Credits */}
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-700 font-medium">Used</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  ${usedCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Utilization Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Credit Utilization</span>
                <span className="font-semibold">{utilizationPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    utilizationPercent > 90
                      ? 'bg-red-500'
                      : utilizationPercent > 70
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Credit Management Form */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Action Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAction('allocate')}
                  className={`p-4 rounded-xl border-2 transition flex items-center justify-center gap-3 ${
                    action === 'allocate'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <PlusCircle className={`w-5 h-5 ${action === 'allocate' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${action === 'allocate' ? 'text-green-900' : 'text-gray-700'}`}>
                    Allocate Credits
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAction('reduce')}
                  className={`p-4 rounded-xl border-2 transition flex items-center justify-center gap-3 ${
                    action === 'reduce'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MinusCircle className={`w-5 h-5 ${action === 'reduce' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${action === 'reduce' ? 'text-orange-900' : 'text-gray-700'}`}>
                    Reduce Credits
                  </span>
                </button>
              </div>
            </div>

            {/* Operation Type (only for allocate) */}
            {action === 'allocate' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operation
                </label>
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value as 'set' | 'add')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="set">Set credit limit to amount</option>
                  <option value="add">Add to current credit limit</option>
                </select>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1000.00"
              />
            </div>

            {/* Reason (optional for allocate, visible for reduce) */}
            {action === 'reduce' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., End of quarter adjustment"
                />
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={processing}
                className={`flex-1 text-white py-3 px-6 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  action === 'allocate'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : action === 'allocate' ? (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    Allocate Credits
                  </>
                ) : (
                  <>
                    <MinusCircle className="w-5 h-5" />
                    Reduce Credits
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
