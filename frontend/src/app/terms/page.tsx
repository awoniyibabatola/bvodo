'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
          <p className="text-sm text-gray-600 mt-2">Last updated: January 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-sm max-w-none">

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using BVODO ("the Platform"), you accept and agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 mb-4">
              BVODO provides a corporate travel booking platform that allows organizations to search, book, and manage flights and accommodations. We act as an intermediary between users and travel service providers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-gray-700 mb-4">
              You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Booking and Payment</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>All bookings are subject to availability and confirmation</li>
              <li>Prices are displayed in the currency selected and may vary based on exchange rates</li>
              <li>Payment must be completed before travel services are confirmed</li>
              <li>Organization credit systems are managed internally and subject to approval workflows</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Cancellations and Refunds</h2>
            <p className="text-gray-700 mb-4">
              Cancellation policies vary by service provider. Please review our <Link href="/cancellation-policy" className="text-gray-900 underline">Cancellation Policy</Link> for detailed information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              BVODO acts as a booking intermediary. We are not liable for services provided by airlines, hotels, or other third-party providers. Our liability is limited to the booking facilitation service we provide.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              All content, trademarks, and intellectual property on the Platform remain the property of BVODO or respective licensors.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Privacy</h2>
            <p className="text-gray-700 mb-4">
              Your use of the Platform is subject to our <Link href="/privacy-policy" className="text-gray-900 underline">Privacy Policy</Link>, which explains how we collect and use your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms are governed by the laws of Canada. Any disputes shall be resolved in the courts of the applicable Canadian jurisdiction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. Continued use of the Platform constitutes acceptance of updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">11. Contact</h2>
            <p className="text-gray-700">
              For questions about these Terms, contact us at <a href="mailto:support@bvodo.com" className="text-gray-900 underline">support@bvodo.com</a>
            </p>
          </section>

        </div>
      </div>

      {/* Simple Footer */}
      <div className="border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <Link href="/privacy-policy" className="hover:text-gray-900 transition">
              Privacy Policy
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
