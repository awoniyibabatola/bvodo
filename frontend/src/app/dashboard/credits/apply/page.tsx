'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

export default function ApplyCreditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    // Application Details
    requestedAmount: '',
    currency: 'USD',

    // Business Information
    companyName: '',
    registrationNumber: '',
    businessType: '',
    industry: '',
    yearEstablished: '',
    numberOfEmployees: '',
    annualRevenue: '',

    // Contact Information
    contactPersonName: '',
    contactPersonTitle: '',
    contactEmail: '',
    contactPhone: '',

    // Address
    businessAddress: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',

    // Financial Information
    bankName: '',
    bankAccountNumber: '',
    taxId: '',

    // Credit Terms
    proposedCreditTerm: '30',
    estimatedMonthlySpend: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint('credit-applications'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccessModal(true);
      } else {
        alert(data.message || 'Failed to submit application');
        setLoading(false);
      }
    } catch (error) {
      console.error('Submit application error:', error);
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/dashboard/credits');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/credits"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Credits
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Apply for Credit</h1>
              <p className="text-gray-600">Get credit to manage your corporate travel bookings</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 md:p-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Credit Application Process</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Submit your application with complete business information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Our team reviews within 2-3 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Upon approval, credits are added to your account immediately</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Credit Amount Section */}
          <div className="p-3 md:p-4 lg:p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Credit Request
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Requested Amount *
                </label>
                <input
                  type="number"
                  name="requestedAmount"
                  value={formData.requestedAmount}
                  onChange={handleChange}
                  required
                  min="1000"
                  step="100"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10000"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum: $1,000</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="NGN">NGN</option>
                </select>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="p-3 md:p-4 lg:p-5 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Business Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Registration Number
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="RC123456"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Type
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Business Type</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Limited Liability Company (LLC)">Limited Liability Company (LLC)</option>
                  <option value="Corporation">Corporation</option>
                  <option value="Public Limited Company (PLC)">Public Limited Company (PLC)</option>
                  <option value="Private Limited Company">Private Limited Company</option>
                  <option value="Non-Profit Organization">Non-Profit Organization</option>
                  <option value="Cooperative">Cooperative</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Education">Education</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                  <option value="Transportation & Logistics">Transportation & Logistics</option>
                  <option value="Energy & Utilities">Energy & Utilities</option>
                  <option value="Telecommunications">Telecommunications</option>
                  <option value="Media & Entertainment">Media & Entertainment</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Construction">Construction</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Legal Services">Legal Services</option>
                  <option value="Marketing & Advertising">Marketing & Advertising</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Non-Profit">Non-Profit</option>
                  <option value="Government">Government</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year Established
                </label>
                <input
                  type="number"
                  name="yearEstablished"
                  value={formData.yearEstablished}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="2020"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Employees
                </label>
                <input
                  type="number"
                  name="numberOfEmployees"
                  value={formData.numberOfEmployees}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Annual Revenue (USD)
                </label>
                <input
                  type="number"
                  name="annualRevenue"
                  value={formData.annualRevenue}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="1000000"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-3 md:p-4 lg:p-5 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact Person
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  name="contactPersonTitle"
                  value={formData.contactPersonTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="CFO"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
          </div>

          {/* Business Address */}
          <div className="p-3 md:p-4 lg:p-5 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Business Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Business Street"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Lagos"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Lagos State"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Nigeria"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="100001"
                />
              </div>
            </div>
          </div>

          {/* Credit Terms */}
          <div className="p-3 md:p-4 lg:p-5 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Credit Terms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Proposed Credit Term
                </label>
                <select
                  name="proposedCreditTerm"
                  value={formData.proposedCreditTerm}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estimated Monthly Spend on Travel
                </label>
                <select
                  name="estimatedMonthlySpend"
                  value={formData.estimatedMonthlySpend}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Monthly Spend Range</option>
                  <option value="1000">$0 - $1,000</option>
                  <option value="2500">$1,000 - $2,500</option>
                  <option value="5000">$2,500 - $5,000</option>
                  <option value="7500">$5,000 - $7,500</option>
                  <option value="10000">$7,500 - $10,000</option>
                  <option value="15000">$10,000 - $15,000</option>
                  <option value="20000">$15,000 - $20,000</option>
                  <option value="30000">$20,000 - $30,000</option>
                  <option value="50000">$30,000 - $50,000</option>
                  <option value="75000">$50,000 - $75,000</option>
                  <option value="100000">$75,000 - $100,000</option>
                  <option value="150000">$100,000+</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="p-3 md:p-4 lg:p-5 bg-gray-50">
            <div className="flex items-start gap-4 mb-6">
              <input
                type="checkbox"
                required
                className="w-5 h-5 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <p className="text-sm text-gray-700">
                I confirm that the information provided is accurate and complete. I understand that this application
                is subject to review and approval, and that bvodo reserves the right to request additional documentation
                or decline the application.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Submitting Application...' : 'Submit Credit Application'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            {/* Confetti Background Effect */}
            <div className="relative bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-8 text-center">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-float"></div>
                <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-blue-400 rounded-full animate-float animation-delay-1000"></div>
                <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-float animation-delay-2000"></div>
                <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-yellow-400 rounded-full animate-float animation-delay-500"></div>
                <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-pink-400 rounded-full animate-float animation-delay-1500"></div>
              </div>

              {/* Success Icon */}
              <div className="relative mb-6">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                  <CheckCircle2 className="w-14 h-14 text-white" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-green-400 rounded-full animate-ping opacity-20"></div>
                </div>
              </div>

              {/* Success Message */}
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Application Submitted!
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your credit application has been successfully submitted. Our team will review your application and get back to you within <span className="font-semibold text-gray-900">2-3 business days</span>.
              </p>

              {/* What Happens Next */}
              <div className="bg-white rounded-2xl p-6 mb-6 text-left shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  What Happens Next?
                </h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">1</span>
                    </div>
                    <span>Our credit team will review your application</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">2</span>
                    </div>
                    <span>You'll receive an email notification with the decision</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">3</span>
                    </div>
                    <span>If approved, credits will be added to your account immediately</span>
                  </li>
                </ul>
              </div>

              {/* Application Reference */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">You can track your application status in</p>
                <p className="font-bold text-blue-600">Dashboard → Manage Credits</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSuccessModalClose}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Go to Credits Dashboard
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
