'use client';

import { Mail, Phone, MapPin, Plane } from 'lucide-react';

export default function BusinessFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center">
                  <Plane className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-gray-900">bvodo</span>
              </div>
              <p className="text-sm text-gray-600 mb-4 max-w-md">
                Simplifying corporate travel management with seamless booking experiences and comprehensive travel solutions for businesses worldwide.
              </p>

              {/* Business Address */}
              <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>7569 202 Ave SE<br />Calgary, Alberta, Canada</p>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Contact Us</h4>
              <div className="space-y-3">
                <a href="mailto:support@bvodo.com" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition group">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-900 transition">
                    <Mail className="w-4 h-4 text-gray-600 group-hover:text-white transition" />
                  </div>
                  <span>support@bvodo.com</span>
                </a>
                <a href="tel:+18259456087" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition group">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-900 transition">
                    <Phone className="w-4 h-4 text-gray-600 group-hover:text-white transition" />
                  </div>
                  <span>+1 (825) 945-6087</span>
                </a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition">
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="/privacy-policy" className="text-sm text-gray-600 hover:text-gray-900 transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/cancellation-policy" className="text-sm text-gray-600 hover:text-gray-900 transition">
                    Cancellation Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Bvodo Corporate Travels. All rights reserved.
            </p>

            {/* Partnership Attribution */}
            <p className="text-xs text-gray-500">
              Accommodations powered by{' '}
              <a
                href="https://www.booking.com/content/terms.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-700 transition"
              >
                Booking.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
