'use client';

import { Mail, Phone, MapPin } from 'lucide-react';

export default function BusinessFooter() {
  return (
    <div className="border-t border-gray-200 bg-gray-50 py-6 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Company Info */}
        <div className="text-center mb-4">
          <h3 className="font-bold text-gray-900 text-sm mb-2">Bvodo Corporate Travels</h3>

          {/* Contact Information */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <a href="mailto:support@bvodo.com" className="hover:text-gray-900 underline">
                support@bvodo.com
              </a>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <a href="tel:+18259456087" className="hover:text-gray-900">
                +1 (825) 945-6087
              </a>
            </div>
          </div>

          {/* Business Address */}
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-3">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <p>7569 202 Ave SE, Calgary, Alberta, Canada</p>
          </div>
        </div>

        {/* Legal Links */}
        <div className="text-center border-t border-gray-200 pt-3">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
            <a href="/terms" className="hover:text-gray-900 transition font-medium">
              Terms & Conditions
            </a>
            <span className="text-gray-400">•</span>
            <a href="/privacy-policy" className="hover:text-gray-900 transition font-medium">
              Privacy Policy
            </a>
            <span className="text-gray-400">•</span>
            <a href="/cancellation-policy" className="hover:text-gray-900 transition font-medium">
              Cancellation Policy
            </a>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            © {new Date().getFullYear()} Bvodo Corporate Travels. All rights reserved.
          </p>
        </div>

        {/* Booking.com Attribution (shown when applicable) */}
        <div className="text-center mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Some accommodations are provided through our partnership with Booking.com.
            <a
              href="https://www.booking.com/content/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline hover:text-gray-700"
            >
              View Booking.com Terms & Conditions
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
