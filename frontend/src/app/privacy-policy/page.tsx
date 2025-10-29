'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mt-2">Last updated: January 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-sm max-w-none">

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              BVODO ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy complies with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA) and explains how we collect, use, disclose, and safeguard your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Personal Information:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Name, email address, phone number</li>
              <li>Date of birth, nationality, passport details (for travel bookings)</li>
              <li>Payment information (processed securely via third-party providers)</li>
              <li>Organization and department information</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Booking Information:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Travel preferences and booking history</li>
              <li>Flight and accommodation details</li>
              <li>Special requests and requirements</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Technical Information:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>IP address, browser type, device information</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Process and manage travel bookings</li>
              <li>Communicate booking confirmations, updates, and changes</li>
              <li>Process payments and manage credit systems</li>
              <li>Provide customer support</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal obligations and prevent fraud</li>
              <li>Send service-related communications (we do not send marketing emails without consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Information Sharing</h2>
            <p className="text-gray-700 mb-4">
              We share your information only as necessary:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Travel Providers:</strong> Airlines, hotels, and other service providers to fulfill bookings</li>
              <li><strong>Payment Processors:</strong> Secure third-party payment services (e.g., Stripe)</li>
              <li><strong>Within Your Organization:</strong> Authorized personnel for approval workflows</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
            <p className="text-gray-700 mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and monitoring</li>
              <li>PCI-compliant payment processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Your Rights (PIPEDA Compliance)</h2>
            <p className="text-gray-700 mb-4">Under Canadian privacy law, you have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Request corrections to inaccurate information</li>
              <li><strong>Withdrawal:</strong> Withdraw consent for certain data uses</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
              <li><strong>Complaints:</strong> File a complaint with the Privacy Commissioner of Canada</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@bvodo.com" className="text-gray-900 underline">privacy@bvodo.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700">
              We retain your information for as long as necessary to provide services and comply with legal obligations. Booking records are typically retained for 7 years for tax and regulatory purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">
              We use essential cookies to operate our Platform. We do not use third-party advertising or tracking cookies. You can manage cookie preferences in your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. International Transfers</h2>
            <p className="text-gray-700">
              Your information may be processed in countries outside Canada where our service providers operate. We ensure adequate safeguards are in place for such transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700">
              Our services are not directed to individuals under 18. We do not knowingly collect information from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy periodically. Changes will be posted on this page with an updated effective date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <div className="text-gray-700">
              <p className="mb-2">For privacy-related questions or to exercise your rights:</p>
              <p className="mb-1"><strong>Email:</strong> <a href="mailto:privacy@bvodo.com" className="text-gray-900 underline">privacy@bvodo.com</a></p>
              <p className="mb-1"><strong>Support:</strong> <a href="mailto:support@bvodo.com" className="text-gray-900 underline">support@bvodo.com</a></p>
              <p className="mt-4 text-sm">
                If you believe we have not complied with Canadian privacy laws, you may file a complaint with the Office of the Privacy Commissioner of Canada at <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline">www.priv.gc.ca</a>
              </p>
            </div>
          </section>

        </div>
      </div>

      {/* Simple Footer */}
      <div className="border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <Link href="/terms" className="hover:text-gray-900 transition">
              Terms and Conditions
            </Link>
            <Link href="/cancellation-policy" className="hover:text-gray-900 transition">
              Cancellation Policy
            </Link>
            <Link href="/" className="hover:text-gray-900 transition">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
