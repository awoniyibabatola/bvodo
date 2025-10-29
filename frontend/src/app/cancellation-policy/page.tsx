'use client';

import Link from 'next/link';
import { ArrowLeft, Plane, Hotel, AlertCircle } from 'lucide-react';

export default function CancellationPolicyPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Cancellation Policy</h1>
          <p className="text-sm text-gray-600 mt-2">Last updated: January 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-sm max-w-none">

          {/* Important Notice */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Important Notice</h3>
                <p className="text-gray-700 text-sm">
                  Cancellation policies vary by provider and fare type. Always review the specific terms of your booking before purchase. Refund eligibility depends on the service provider's policy and timing of cancellation.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. General Policy</h2>
            <p className="text-gray-700 mb-4">
              BVODO facilitates bookings with third-party travel providers. Cancellations are subject to the terms and conditions of the airline, hotel, or service provider. We process cancellation requests on your behalf but cannot override provider policies.
            </p>
          </section>

          {/* Flight Cancellations */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Plane className="w-5 h-5 text-gray-900" />
              <h2 className="text-xl font-bold text-gray-900">2. Flight Cancellations</h2>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Refundable Tickets:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Can be cancelled for a full or partial refund minus any airline fees</li>
              <li>Refund processing time: 7-20 business days depending on payment method</li>
              <li>Airline cancellation fees may apply (typically $50-$200 per ticket)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Non-Refundable Tickets:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Generally not eligible for refund</li>
              <li>May receive travel credit minus change fees (typically $100-$300)</li>
              <li>Credit validity: Usually 12 months from original booking date</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Timeframes:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>24-Hour Rule:</strong> Most tickets can be cancelled within 24 hours of booking for full refund (if booked 7+ days before departure)</li>
              <li><strong>7+ Days Before:</strong> Standard cancellation fees apply</li>
              <li><strong>Less Than 7 Days:</strong> Higher fees or no refund</li>
              <li><strong>After Departure:</strong> No refund available</li>
            </ul>
          </section>

          {/* Hotel Cancellations */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Hotel className="w-5 h-5 text-gray-900" />
              <h2 className="text-xl font-bold text-gray-900">3. Hotel Cancellations</h2>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Standard Policy:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Free Cancellation:</strong> Cancel up to 24-48 hours before check-in (varies by property)</li>
              <li><strong>Late Cancellation:</strong> First night charged if cancelled within 24-48 hours</li>
              <li><strong>No-Show:</strong> Full booking amount charged</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Non-Refundable Rates:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Prepaid rates are typically non-refundable</li>
              <li>No refund for early checkout</li>
              <li>Discounted rates often have stricter cancellation terms</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Special Circumstances:</h3>
            <p className="text-gray-700">
              Some hotels may waive cancellation fees for emergencies (medical, natural disasters). Contact the property directly with documentation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. How to Cancel</h2>
            <ol className="list-decimal pl-6 text-gray-700 space-y-3">
              <li>
                <strong>Online:</strong> Log in to your BVODO account, go to "My Bookings," and select "Cancel Booking"
              </li>
              <li>
                <strong>Email:</strong> Send cancellation request to <a href="mailto:support@bvodo.com" className="text-gray-900 underline">support@bvodo.com</a> with booking reference
              </li>
              <li>
                <strong>Response Time:</strong> We will process your request within 24 hours and confirm cancellation status
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Refund Processing</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Credit Card:</strong> 7-14 business days after approval</li>
              <li><strong>Organization Credit:</strong> Refunded immediately to account balance</li>
              <li><strong>Service Fees:</strong> BVODO platform fees ($5-$25) are non-refundable</li>
              <li><strong>Currency:</strong> Refunds issued in original payment currency</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Modifications vs. Cancellations</h2>
            <p className="text-gray-700 mb-4">
              If you need to change travel dates or details, contact us before cancelling. Modifications may incur lower fees than full cancellations:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Date changes typically cost $50-$200 plus fare difference</li>
              <li>Name corrections may be available for a small fee</li>
              <li>Route changes subject to airline/hotel policies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Force Majeure</h2>
            <p className="text-gray-700">
              In cases of natural disasters, pandemics, government travel restrictions, or airline/hotel closures, special cancellation terms may apply. Refunds depend on provider policies and applicable regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Travel Insurance</h2>
            <p className="text-gray-700 mb-4">
              We strongly recommend purchasing travel insurance for protection against:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Trip cancellation for covered reasons (illness, emergencies)</li>
              <li>Travel delays and interruptions</li>
              <li>Medical emergencies during travel</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Insurance must be purchased within 14 days of initial booking for full coverage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Exceptions</h2>
            <p className="text-gray-700 mb-4">This policy does not apply to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Group bookings (10+ travelers) - subject to separate terms</li>
              <li>Charter flights or packages</li>
              <li>Special negotiated corporate rates with custom terms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Contact Support</h2>
            <div className="text-gray-700">
              <p className="mb-4">For cancellation assistance:</p>
              <p className="mb-1"><strong>Email:</strong> <a href="mailto:support@bvodo.com" className="text-gray-900 underline">support@bvodo.com</a></p>
              <p className="mb-1"><strong>Response Time:</strong> Within 24 hours</p>
              <p className="mt-4 text-sm">
                Include your booking reference, travel dates, and reason for cancellation for faster processing.
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
            <Link href="/privacy-policy" className="hover:text-gray-900 transition">
              Privacy Policy
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
