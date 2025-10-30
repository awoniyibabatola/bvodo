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
                  emailNotifications ? 'bg-black' : 'bg-gray-300'
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
                  bookingConfirmations ? 'bg-black' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                    bookingConfirmations ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200 opacity-60">
              <div>
                <p className="font-medium text-black">Price Alerts <span className="text-xs text-gray-500">(Coming Soon)</span></p>
                <p className="text-sm text-gray-600">Notify me of price drops on my routes</p>
              </div>
              <button
                disabled
                className="w-14 h-8 rounded-full bg-gray-300 cursor-not-allowed"
              >
                <div className="w-6 h-6 bg-white rounded-full shadow-md transform translate-x-1" />
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
                  newsletter ? 'bg-black' : 'bg-gray-300'
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
                  className="px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
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
                <p className="font-medium text-black">Activity Tracking</p>
                <p className="text-sm text-gray-600">Help us improve with usage data</p>
              </div>
              <button
                onClick={() => setActivityTracking(!activityTracking)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  activityTracking ? 'bg-black' : 'bg-gray-300'
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
                <optgroup label="North America">
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Anchorage">Alaska Time (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                  <option value="America/Phoenix">Arizona Time (MST)</option>
                  <option value="America/Toronto">Toronto (ET)</option>
                  <option value="America/Vancouver">Vancouver (PT)</option>
                  <option value="America/Halifax">Halifax (AT)</option>
                  <option value="America/Mexico_City">Mexico City (CST)</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Dublin">Dublin (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Europe/Berlin">Berlin (CET)</option>
                  <option value="Europe/Madrid">Madrid (CET)</option>
                  <option value="Europe/Rome">Rome (CET)</option>
                  <option value="Europe/Amsterdam">Amsterdam (CET)</option>
                  <option value="Europe/Brussels">Brussels (CET)</option>
                  <option value="Europe/Vienna">Vienna (CET)</option>
                  <option value="Europe/Zurich">Zurich (CET)</option>
                  <option value="Europe/Stockholm">Stockholm (CET)</option>
                  <option value="Europe/Copenhagen">Copenhagen (CET)</option>
                  <option value="Europe/Oslo">Oslo (CET)</option>
                  <option value="Europe/Helsinki">Helsinki (EET)</option>
                  <option value="Europe/Athens">Athens (EET)</option>
                  <option value="Europe/Istanbul">Istanbul (TRT)</option>
                  <option value="Europe/Moscow">Moscow (MSK)</option>
                  <option value="Europe/Warsaw">Warsaw (CET)</option>
                  <option value="Europe/Prague">Prague (CET)</option>
                  <option value="Europe/Budapest">Budapest (CET)</option>
                  <option value="Europe/Bucharest">Bucharest (EET)</option>
                  <option value="Europe/Lisbon">Lisbon (WET)</option>
                </optgroup>
                <optgroup label="Asia">
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Asia/Riyadh">Riyadh (AST)</option>
                  <option value="Asia/Kuwait">Kuwait (AST)</option>
                  <option value="Asia/Doha">Doha (AST)</option>
                  <option value="Asia/Bahrain">Bahrain (AST)</option>
                  <option value="Asia/Muscat">Muscat (GST)</option>
                  <option value="Asia/Tehran">Tehran (IRST)</option>
                  <option value="Asia/Karachi">Karachi (PKT)</option>
                  <option value="Asia/Kolkata">Mumbai/Delhi (IST)</option>
                  <option value="Asia/Dhaka">Dhaka (BST)</option>
                  <option value="Asia/Bangkok">Bangkok (ICT)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                  <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                  <option value="Asia/Shanghai">Shanghai (CST)</option>
                  <option value="Asia/Beijing">Beijing (CST)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Seoul">Seoul (KST)</option>
                  <option value="Asia/Manila">Manila (PHT)</option>
                  <option value="Asia/Jakarta">Jakarta (WIB)</option>
                  <option value="Asia/Kuala_Lumpur">Kuala Lumpur (MYT)</option>
                  <option value="Asia/Taipei">Taipei (CST)</option>
                  <option value="Asia/Jerusalem">Jerusalem (IST)</option>
                  <option value="Asia/Beirut">Beirut (EET)</option>
                  <option value="Asia/Amman">Amman (EET)</option>
                  <option value="Asia/Baghdad">Baghdad (AST)</option>
                </optgroup>
                <optgroup label="Africa">
                  <option value="Africa/Cairo">Cairo (EET)</option>
                  <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
                  <option value="Africa/Lagos">Lagos (WAT)</option>
                  <option value="Africa/Nairobi">Nairobi (EAT)</option>
                  <option value="Africa/Casablanca">Casablanca (WET)</option>
                  <option value="Africa/Algiers">Algiers (CET)</option>
                  <option value="Africa/Tunis">Tunis (CET)</option>
                  <option value="Africa/Accra">Accra (GMT)</option>
                  <option value="Africa/Addis_Ababa">Addis Ababa (EAT)</option>
                  <option value="Africa/Dar_es_Salaam">Dar es Salaam (EAT)</option>
                  <option value="Africa/Kampala">Kampala (EAT)</option>
                  <option value="Africa/Kigali">Kigali (CAT)</option>
                  <option value="Africa/Lusaka">Lusaka (CAT)</option>
                  <option value="Africa/Harare">Harare (CAT)</option>
                </optgroup>
                <optgroup label="Australia & Pacific">
                  <option value="Australia/Sydney">Sydney (AEDT)</option>
                  <option value="Australia/Melbourne">Melbourne (AEDT)</option>
                  <option value="Australia/Brisbane">Brisbane (AEST)</option>
                  <option value="Australia/Perth">Perth (AWST)</option>
                  <option value="Australia/Adelaide">Adelaide (ACDT)</option>
                  <option value="Pacific/Auckland">Auckland (NZDT)</option>
                  <option value="Pacific/Fiji">Fiji (FJT)</option>
                  <option value="Pacific/Guam">Guam (ChST)</option>
                  <option value="Pacific/Tahiti">Tahiti (TAHT)</option>
                </optgroup>
                <optgroup label="South America">
                  <option value="America/Sao_Paulo">São Paulo (BRT)</option>
                  <option value="America/Buenos_Aires">Buenos Aires (ART)</option>
                  <option value="America/Santiago">Santiago (CLT)</option>
                  <option value="America/Lima">Lima (PET)</option>
                  <option value="America/Bogota">Bogotá (COT)</option>
                  <option value="America/Caracas">Caracas (VET)</option>
                  <option value="America/Montevideo">Montevideo (UYT)</option>
                  <option value="America/Asuncion">Asunción (PYT)</option>
                  <option value="America/La_Paz">La Paz (BOT)</option>
                </optgroup>
                <optgroup label="Atlantic">
                  <option value="Atlantic/Reykjavik">Reykjavik (GMT)</option>
                  <option value="Atlantic/Azores">Azores (AZOT)</option>
                  <option value="Atlantic/Cape_Verde">Cape Verde (CVT)</option>
                  <option value="Atlantic/Bermuda">Bermuda (AST)</option>
                </optgroup>
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
            className="px-8 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg"
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
