'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  DollarSign,
  Eye,
  Filter,
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

interface CreditApplication {
  id: string;
  organizationId: string;
  requestedAmount: string;
  currency: string;
  companyName: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  approvedAmount?: string;
  rejectionReason?: string;
  organization: {
    name: string;
    subdomain: string;
    email: string;
    totalCredits: string;
    availableCredits: string;
  };
}

export default function SuperAdminCreditApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<CreditApplication | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_info'>('approve');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [approvedCreditTerm, setApprovedCreditTerm] = useState('30');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const url = statusFilter === 'all'
        ? getApiEndpoint('credit-applications/all')
        : `${getApiEndpoint('credit-applications/all')}?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setApplications(data.data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedApp) return;

    if (reviewAction === 'approve' && (!approvedAmount || parseFloat(approvedAmount) <= 0)) {
      alert('Please enter a valid approved amount');
      return;
    }

    if (reviewAction === 'reject' && !rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        getApiEndpoint(`credit-applications/${selectedApp.id}/review`),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: reviewAction,
            approvedAmount: reviewAction === 'approve' ? parseFloat(approvedAmount) : undefined,
            approvedCreditTerm: reviewAction === 'approve' ? parseInt(approvedCreditTerm) : undefined,
            reviewNotes,
            rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(`Application ${reviewAction === 'approve' ? 'approved' : reviewAction === 'reject' ? 'rejected' : 'updated'} successfully!`);
        setShowReviewModal(false);
        setSelectedApp(null);
        setApprovedAmount('');
        setReviewNotes('');
        setRejectionReason('');
        fetchApplications();
      } else {
        alert(data.message || 'Failed to review application');
      }
    } catch (error) {
      console.error('Error reviewing application:', error);
      alert('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'under_review':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'under_review':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-orange-50 border-orange-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      case 'under_review':
        return 'Under Review';
      case 'additional_info_required':
        return 'Info Required';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/super-admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Super Admin
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Credit Applications</h1>
              <p className="text-gray-600">Review and manage credit applications from organizations</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 mb-6 inline-flex gap-2">
          {['all', 'pending', 'under_review', 'approved', 'rejected', 'additional_info_required'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                statusFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filter === 'all' ? 'All' : getStatusText(filter)}
            </button>
          ))}
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Applications ({applications.length})</h2>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No credit applications found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((app) => (
                <div key={app.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Status Icon */}
                      <div className={`p-3 rounded-xl border ${getStatusBg(app.status)}`}>
                        {getStatusIcon(app.status)}
                      </div>

                      {/* Application Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{app.companyName}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBg(app.status)}`}>
                            {getStatusText(app.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Organization</p>
                            <p className="font-medium text-gray-900">{app.organization.name}</p>
                            <p className="text-xs text-gray-500">{app.organization.subdomain}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Contact Person</p>
                            <p className="font-medium text-gray-900">{app.contactPersonName}</p>
                            <p className="text-xs text-gray-500">{app.contactEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-sm text-gray-600">Requested Amount</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {app.currency} ${parseFloat(app.requestedAmount).toLocaleString()}
                            </p>
                          </div>
                          {app.status === 'approved' && app.approvedAmount && (
                            <div>
                              <p className="text-sm text-gray-600">Approved Amount</p>
                              <p className="text-2xl font-bold text-green-600">
                                {app.currency} ${parseFloat(app.approvedAmount).toLocaleString()}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-gray-600">Current Credits</p>
                            <p className="text-xl font-semibold text-blue-600">
                              ${parseFloat(app.organization.totalCredits).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                          {app.reviewedAt && (
                            <span>Reviewed: {new Date(app.reviewedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {(app.status === 'pending' || app.status === 'under_review') && (
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setApprovedAmount(app.requestedAmount);
                            setShowReviewModal(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedApp && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Review Credit Application</h2>
                <p className="text-gray-600 mt-1">{selectedApp.companyName}</p>
              </div>

              <div className="p-8">
                {/* Application Summary */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Application Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Requested:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        ${parseFloat(selectedApp.requestedAmount).toLocaleString()} {selectedApp.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Credits:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        ${parseFloat(selectedApp.organization.totalCredits).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Action Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Review Action
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setReviewAction('approve')}
                      className={`p-4 border-2 rounded-xl transition ${
                        reviewAction === 'approve'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CheckCircle className={`w-6 h-6 mx-auto mb-2 ${reviewAction === 'approve' ? 'text-green-600' : 'text-gray-400'}`} />
                      <div className="text-sm font-medium text-gray-900">Approve</div>
                    </button>
                    <button
                      onClick={() => setReviewAction('reject')}
                      className={`p-4 border-2 rounded-xl transition ${
                        reviewAction === 'reject'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <XCircle className={`w-6 h-6 mx-auto mb-2 ${reviewAction === 'reject' ? 'text-red-600' : 'text-gray-400'}`} />
                      <div className="text-sm font-medium text-gray-900">Reject</div>
                    </button>
                    <button
                      onClick={() => setReviewAction('request_info')}
                      className={`p-4 border-2 rounded-xl transition ${
                        reviewAction === 'request_info'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <AlertCircle className={`w-6 h-6 mx-auto mb-2 ${reviewAction === 'request_info' ? 'text-orange-600' : 'text-gray-400'}`} />
                      <div className="text-sm font-medium text-gray-900">Request Info</div>
                    </button>
                  </div>
                </div>

                {/* Approve Fields */}
                {reviewAction === 'approve' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Approved Amount ({selectedApp.currency}) *
                      </label>
                      <input
                        type="number"
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(e.target.value)}
                        min="1"
                        step="100"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        placeholder="10000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Credit Term (Days)
                      </label>
                      <select
                        value={approvedCreditTerm}
                        onChange={(e) => setApprovedCreditTerm(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="30">30 Days</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Reject Fields */}
                {reviewAction === 'reject' && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="Please provide a detailed reason for rejection..."
                    />
                  </div>
                )}

                {/* Review Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Review Notes (Optional)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any internal notes about this review..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleReview}
                    disabled={processing}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : `Confirm ${reviewAction === 'approve' ? 'Approval' : reviewAction === 'reject' ? 'Rejection' : 'Request'}`}
                  </button>
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedApp(null);
                      setApprovedAmount('');
                      setReviewNotes('');
                      setRejectionReason('');
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
