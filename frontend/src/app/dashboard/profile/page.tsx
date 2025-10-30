'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Building2,
  Shield,
  Calendar,
  MapPin,
  Phone,
  Edit,
  Check,
  X,
  Camera
} from 'lucide-react';
import UnifiedNavBar from '@/components/UnifiedNavBar';
import AccountSubNav from '@/components/AccountSubNav';
import BusinessFooter from '@/components/BusinessFooter';
import { getApiEndpoint } from '@/lib/api-config';

export default function ProfilePage() {
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    organization: '',
    avatar: '',
    phone: '',
    location: '',
    joinedDate: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    const orgData = localStorage.getItem('organization');

    if (userData && orgData) {
      const parsedUser = JSON.parse(userData);
      const parsedOrg = JSON.parse(orgData);

      const userInfo = {
        firstName: parsedUser.firstName || '',
        lastName: parsedUser.lastName || '',
        email: parsedUser.email || '',
        role: parsedUser.role || '',
        organization: parsedOrg.name || '',
        avatar: parsedUser.avatarUrl || '',
        phone: parsedUser.phone || '',
        location: parsedUser.location || '',
        joinedDate: parsedUser.createdAt ? new Date(parsedUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
      };

      setUser(userInfo);
      setEditedUser(userInfo);
    }
  }, []);

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        try {
          // Upload to backend API
          const token = localStorage.getItem('accessToken');
          const response = await fetch(getApiEndpoint('user/avatar'), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ avatarUrl: base64String }),
          });

          const data = await response.json();

          if (data.success) {
            // Update user state
            const updatedUser = { ...user, avatar: base64String };
            setUser(updatedUser);
            setEditedUser(updatedUser);

            // Update localStorage
            const userData = localStorage.getItem('user');
            if (userData) {
              const parsedUser = JSON.parse(userData);
              parsedUser.avatarUrl = base64String;
              localStorage.setItem('user', JSON.stringify(parsedUser));
            }

            alert('Avatar uploaded successfully!');
          } else {
            alert('Failed to upload avatar: ' + data.message);
          }
        } catch (error) {
          console.error('Avatar upload error:', error);
          alert('Failed to upload avatar. Please try again.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      // Update profile via API
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint('user/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editedUser.firstName,
          lastName: editedUser.lastName,
          phone: editedUser.phone,
          location: editedUser.location,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(editedUser);
        setIsEditing(false);

        // Update localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          parsedUser.firstName = editedUser.firstName;
          parsedUser.lastName = editedUser.lastName;
          parsedUser.phone = editedUser.phone;
          parsedUser.location = editedUser.location;
          localStorage.setItem('user', JSON.stringify(parsedUser));
        }

        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile: ' + data.message);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <UnifiedNavBar
        currentPage="profile"
        user={{
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          organization: user.organization,
        }}
      />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and preferences</p>
        </div>

        {/* Sub Navigation */}
        <AccountSubNav currentPage="profile" />

        {/* Profile Card */}
        <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 overflow-hidden mb-6">
          {/* Header Section with Avatar */}
          <div className="bg-black p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center text-black font-bold text-3xl border-4 border-white">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-black" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-300 mb-3">{user.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-[#ADF802] text-black text-xs font-bold rounded-full">
                    {formatRole(user.role)}
                  </span>
                  {user.joinedDate && (
                    <span className="px-3 py-1 bg-white/10 text-white text-xs font-medium rounded-full">
                      Joined {user.joinedDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8 md:p-10">
            <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUser.firstName}
                    onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                  />
                ) : (
                  <div className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900">
                    {user.firstName || 'Not set'}
                  </div>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUser.lastName}
                    onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                  />
                ) : (
                  <div className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900">
                    {user.lastName || 'Not set'}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <div className="px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500">
                  {user.email}
                  <span className="ml-2 text-xs">(Cannot be changed)</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedUser.phone}
                    onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                  />
                ) : (
                  <div className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900">
                    {user.phone || 'Not set'}
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUser.location}
                    onChange={(e) => setEditedUser({ ...editedUser, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                  />
                ) : (
                  <div className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900">
                    {user.location || 'Not set'}
                  </div>
                )}
              </div>

              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Organization
                </label>
                <div className="px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500">
                  {user.organization}
                  <span className="ml-2 text-xs">(Cannot be changed)</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 mt-8 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-black transition-colors">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-2xl font-bold text-black">0</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Total Bookings</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-black transition-colors">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-2xl font-bold text-black">0</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Countries Visited</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-black transition-colors">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="text-2xl font-bold text-black">{formatRole(user.role)}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Account Level</p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <div className="mt-16">
        <BusinessFooter />
      </div>
    </div>
  );
}
