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
  User,
  CreditCard,
  Wallet
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';
import UnifiedNavBar from '@/components/UnifiedNavBar';

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
  const [user, setUser] = useState({
    name: 'User',
    email: '',
    role: 'company_admin',
    organization: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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
      <div className="min-h-screen bg-gray-50">
        <UnifiedNavBar currentPage="users" user={user} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 font-medium">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedNavBar currentPage="users" user={user} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Error Loading User</h2>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <Link
              href="/dashboard/users"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Users</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const creditLimit = parseFloat(userData?.creditLimit || '0');
  const availableCredits = parseFloat(userData?.availableCredits || '0');
  const usedCredits = creditLimit - availableCredits;
  const utilizationPercent = creditLimit > 0 ? (usedCredits / creditLimit) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <UnifiedNavBar currentPage="users" user={user} />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/users"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Users</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage User Credits</h1>
              <p className="text-sm text-gray-600">Allocate or reduce credit balance</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-[#C6F432] border border-[#C6F432] rounded-lg flex items-center gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-gray-900 flex-shrink-0" />
            <p className="text-sm text-gray-900 font-medium">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && userData && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* User Info Card */}
        {userData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-900 font-bold text-lg flex-shrink-0 border border-gray-200">
                {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {userData.firstName} {userData.lastName}
                </div>
                <div className="text-sm text-gray-600 mb-2 break-words">{userData.email}</div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg font-medium capitalize">
                    {userData.role.replace('_', ' ')}
                  </span>
                  {userData.department && (
                    <span className="text-xs px-2.5 py-1 bg-[#C6F432] text-gray-900 rounded-lg font-medium border border-[#C6F432]">
                      {userData.department}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Credit Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Credit Limit */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-gray-700" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Credit Limit</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Available Credits */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-gray-700" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Available</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${availableCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Used Credits */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-gray-700" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Used</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${usedCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Utilization Bar */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span className="font-semibold uppercase tracking-wide">Credit Utilization</span>
                <span className="font-bold text-gray-900">{utilizationPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div
                  className="h-full transition-all bg-gray-600"
                  style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Credit Management Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Credit Management</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Action Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAction('allocate')}
                  className={`p-4 rounded-lg border transition-all flex items-center justify-center gap-2.5 ${
                    action === 'allocate'
                      ? 'border-gray-300 bg-gray-100 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <PlusCircle className={`w-5 h-5 ${action === 'allocate' ? 'text-gray-900' : 'text-gray-400'}`} />
                  <span className={`font-medium text-sm ${action === 'allocate' ? 'text-gray-900' : 'text-gray-700'}`}>
                    Allocate Credits
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAction('reduce')}
                  className={`p-4 rounded-lg border transition-all flex items-center justify-center gap-2.5 ${
                    action === 'reduce'
                      ? 'border-gray-300 bg-gray-100 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <MinusCircle className={`w-5 h-5 ${action === 'reduce' ? 'text-gray-900' : 'text-gray-400'}`} />
                  <span className={`font-medium text-sm ${action === 'reduce' ? 'text-gray-900' : 'text-gray-700'}`}>
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
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
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                  placeholder="1000.00"
                />
              </div>
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                  placeholder="e.g., End of quarter adjustment"
                />
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={processing}
                className="flex-1 text-white py-3 px-6 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm bg-gray-900 hover:bg-gray-800"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : action === 'allocate' ? (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    <span>Allocate Credits</span>
                  </>
                ) : (
                  <>
                    <MinusCircle className="w-5 h-5" />
                    <span>Reduce Credits</span>
                  </>
                )}
              </button>
              <Link
                href="/dashboard/users"
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center"
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
