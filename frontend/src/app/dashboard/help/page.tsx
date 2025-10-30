'use client';

import { useState, useEffect } from 'react';
import {
  HelpCircle,
  Mail,
  MessageCircle,
  Book,
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import UnifiedNavBar from '@/components/UnifiedNavBar';
import AccountSubNav from '@/components/AccountSubNav';
import BusinessFooter from '@/components/BusinessFooter';

export default function HelpPage() {
  const [user, setUser] = useState({
    name: 'John Doe',
    email: '',
    role: 'user',
    organization: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    const orgData = localStorage.getItem('organization');

    if (userData && orgData) {
      const parsedUser = JSON.parse(userData);
      const parsedOrg = JSON.parse(orgData);

      setUser({
        name: `${parsedUser.firstName} ${parsedUser.lastName}`,
        email: parsedUser.email,
        role: parsedUser.role,
        organization: parsedOrg.name,
      });
    }
  }, []);

  const faqs = [
    {
      question: 'How do I book a flight?',
      answer: 'Navigate to the Flights page from the main menu, enter your departure and destination cities, select your travel dates, and click Search. Choose your preferred flight from the results and follow the booking steps.'
    },
    {
      question: 'Can I cancel or modify my booking?',
      answer: 'Yes, you can manage your bookings from the Bookings page. Click on any booking to view details and available options for cancellation or modification. Note that cancellation policies vary by airline and fare type.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards. Payment is processed securely through our payment partners.'
    },
    {
      question: 'How do I download my booking confirmation?',
      answer: 'Go to the Bookings page, click on your booking, and you\'ll find a "Download Confirmation" button. You can also access your booking confirmation from the email sent to you after completing your purchase.'
    },
    {
      question: 'What are travel policies?',
      answer: 'Travel policies are rules set by your company admin that define spending limits, allowed cabin classes, and approval requirements for bookings. Check with your company admin if you have questions about your organization\'s policies.'
    },
    {
      question: 'How does the Perks program work?',
      answer: 'Our Perks program rewards frequent travelers with gift cards, priority support, and exclusive benefits. The more you book, the higher your tier level and the better the rewards. Visit the Perks page to learn more.'
    }
  ];

  const supportChannels = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      action: 'Send Email',
      link: 'mailto:support@bvodo.com'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team (Coming Soon)',
      action: 'Start Chat',
      disabled: true
    },
    {
      icon: Book,
      title: 'Documentation',
      description: 'Browse our comprehensive guides',
      action: 'View Docs',
      link: '#'
    },
    {
      icon: FileText,
      title: 'Terms & Privacy',
      description: 'Read our policies and terms',
      action: 'View Policies',
      link: '#'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <UnifiedNavBar currentPage="help" user={user} />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">Help & Support</h1>
          <p className="text-gray-600">Find answers and get assistance</p>
        </div>

        {/* Sub Navigation */}
        <AccountSubNav currentPage="help" />

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none bg-white text-base"
            />
          </div>
        </div>

        {/* Support Channels */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-black mb-4">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportChannels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 hover:border-black transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[#ADF802]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-black mb-1">{channel.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{channel.description}</p>
                      {channel.disabled ? (
                        <span className="text-sm text-gray-400">{channel.action}</span>
                      ) : (
                        <a
                          href={channel.link}
                          className="inline-flex items-center gap-1 text-sm font-medium text-black hover:text-gray-700 transition-colors"
                        >
                          {channel.action}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-black mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-black pr-4">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Still Need Help Card */}
        <div className="bg-black rounded-2xl p-8 text-center">
          <HelpCircle className="w-12 h-12 text-[#ADF802] mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-3">Still need help?</h3>
          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            Can't find what you're looking for? Our support team is here to assist you.
          </p>
          <a
            href="mailto:support@bvodo.com"
            className="inline-block px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Contact Support
          </a>
        </div>

      </main>

      {/* Footer */}
      <div className="mt-16">
        <BusinessFooter />
      </div>
    </div>
  );
}
