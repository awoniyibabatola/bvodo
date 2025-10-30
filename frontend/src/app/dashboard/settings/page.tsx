'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Lock,
  Globe,
  Shield,
  Mail,
  Eye,
  EyeOff,
  Check,
  Clock,
  Moon,
  Sun,
  Monitor,
  Smartphone
} from 'lucide-react';
import UnifiedNavBar from '@/components/UnifiedNavBar';
import BusinessFooter from '@/components/BusinessFooter';

export default function SettingsPage() {
  const [user, setUser] = useState({
    name: 'John Doe',
    email: '',
    role: 'user',
    organization: '',
  });

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingConfirmations, setBookingConfirmations] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(false);
  const [newsletter, setNewsletter] = useState(true);

  // Privacy Settings
  const [profileVisible, setProfileVisible] = useState(true);
  const [activityTracking, setActivityTracking] = useState(true);

  // Password Change
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Preferences
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('America/New_York');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [theme, setTheme] = useState('light');

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

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    // TODO: Add API call to change password
    alert('Password change functionality coming soon');
    setShowPasswordFields(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSaveSettings = () => {
    // TODO: Add API call to save settings
    alert('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <UnifiedNavBar currentPage="settings" user={user} />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and security</p>
        </div>

        {/* Notifications Section */}
        <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-[#ADF802]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">Notifications</h2>
              <p className="text-sm text-gray-600">Manage how you receive updates</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200">
              <div>
                <p className="font-medium text-black">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive important updates via email</p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  emailNotifications ? 'bg-[#ADF802]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                    emailNotifications ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200">
              <div>
                <p className="font-medium text-black">Booking Confirmations</p>
                <p className="text-sm text-gray-600">Get notified when bookings are confirmed</p>
              </div>
              <button
                onClick={() => setBookingConfirmations(!bookingConfirmations)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  bookingConfirmations ? 'bg-[#ADF802]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                    bookingConfirmations ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200">
              <div>
                <p className="font-medium text-black">Price Alerts</p>
                <p className="text-sm text-gray-600">Notify me of price drops on my routes</p>
              </div>
              <button
                onClick={() => setPriceAlerts(!priceAlerts)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  priceAlerts ? 'bg-[#ADF802]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                    priceAlerts ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200">
              <div>
                <p className="font-medium text-black">Newsletter</p>
                <p className="text-sm text-gray-600">Travel tips and exclusive deals</p>
              </div>
              <button
                onClick={() => setNewsletter(!newsletter)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  newsletter ? 'bg-[#ADF802]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                    newsletter ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#ADF802]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">Security</h2>
              <p className="text-sm text-gray-600">Manage your password and security settings</p>
            </div>
          </div>

          {!showPasswordFields ? (
            <button
              onClick={() => setShowPasswordFields(true)}
              className="w-full md:w-auto px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Change Password
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordFields(false)}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="px-6 py-3 bg-[#ADF802] text-black font-bold rounded-xl hover:bg-[#9DE600] transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Section */}
        <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#ADF802]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">Privacy</h2>
              <p className="text-sm text-gray-600">Control your data and privacy preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200">
              <div>
                <p className="font-medium text-black">Profile Visibility</p>
                <p className="text-sm text-gray-600">Make your profile visible to team members</p>
              </div>
              <button
                onClick={() => setProfileVisible(!profileVisible)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  profileVisible ? 'bg-[#ADF802]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                    profileVisible ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200">
              <div>
                <p className="font-medium text-black">Activity Tracking</p>
                <p className="text-sm text-gray-600">Help us improve with usage data</p>
              </div>
              <button
                onClick={() => setActivityTracking(!activityTracking)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  activityTracking ? 'bg-[#ADF802]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                    activityTracking ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-[#ADF802]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">Preferences</h2>
              <p className="text-sm text-gray-600">Customize your experience</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none bg-white"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none bg-white"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Format
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none bg-white"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme (Coming Soon)
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none bg-white opacity-50 cursor-not-allowed"
                disabled
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="px-8 py-4 bg-[#ADF802] text-black font-bold rounded-xl hover:bg-[#9DE600] transition-colors flex items-center gap-2 shadow-lg"
          >
            <Check className="w-5 h-5" />
            Save All Settings
          </button>
        </div>

      </main>

      {/* Footer */}
      <div className="mt-16">
        <BusinessFooter />
      </div>
    </div>
  );
}
