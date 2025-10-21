'use client';

import { useState, useEffect } from 'react';
import { X, Users, Plus, Trash2, UserPlus, Check, CreditCard as CreditCardIcon, Plane, Shield, Lock, MapPin, Hotel, Calendar, Clock, ChevronDown, Bed } from 'lucide-react';
import CreditCard from './CreditCard';

interface PassengerDetail {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address?: string;
  city?: string;
  country?: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
}

// Multi-room support interfaces
interface RoomSelection {
  roomNumber: number;
  selectedOffer: any;
  assignedGuestIds: number[];
  guestsPerRoom: number;
  price: {
    total: string;
    currency: string;
  };
}

interface MultiRoomBookingSubmit {
  isMultiRoom: boolean;
  rooms: Array<{
    roomNumber: number;
    offerId: string;
    offerDetails: any;
    guests: PassengerDetail[];
    price: number;
  }>;
  totalGuests: number;
  totalPrice: number;
  isGroupBooking: boolean;
  groupName?: string;
}

interface PassengerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  numberOfTravelers: number;
  onSubmit: (passengers: PassengerDetail[], isGroupBooking: boolean, groupName?: string) => void;
  bookingType: 'flight' | 'hotel';
  totalPrice?: number;
  currency?: string;

  // Multi-room support (optional - backward compatible)
  numberOfRooms?: number;
  availableOffers?: any[];
  onMultiRoomSubmit?: (bookingData: MultiRoomBookingSubmit) => void;

  bookingDetails?: {
    // Hotel details
    hotelName?: string;
    roomType?: string;
    checkInDate?: string;
    checkOutDate?: string;
    numberOfNights?: number;
    // Flight details
    airline?: string;
    flightNumber?: string;
    departureAirport?: string;
    arrivalAirport?: string;
    departureTime?: string;
    arrivalTime?: string;
    departureDate?: string;
    cabinClass?: string;
  };
}

export default function PassengerDetailsModal({
  isOpen,
  onClose,
  numberOfTravelers,
  onSubmit,
  bookingType,
  totalPrice = 0,
  currency = 'USD',
  bookingDetails,
  // Multi-room props (optional)
  numberOfRooms = 1,
  availableOffers = [],
  onMultiRoomSubmit,
}: PassengerDetailsModalProps) {
  // Determine if multi-room mode
  const isMultiRoomMode = numberOfRooms > 1 && availableOffers.length > 0 && onMultiRoomSubmit;

  const [isGroupBooking, setIsGroupBooking] = useState(numberOfTravelers > 3);
  const [groupName, setGroupName] = useState('');
  const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [availableCredits, setAvailableCredits] = useState(5000);
  const [organizationName, setOrganizationName] = useState('Corporate Travel');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    personal: true,
    address: false,
    passport: false,
  });

  // Multi-room state
  const [rooms, setRooms] = useState<RoomSelection[]>([]);
  const [currentRoomStep, setCurrentRoomStep] = useState(0);
  const [showRoomCustomization, setShowRoomCustomization] = useState(false);
  const [selectedRoomForGuest, setSelectedRoomForGuest] = useState<number | null>(null);
  const [editingGuestIndex, setEditingGuestIndex] = useState<number | null>(null);

  // Calculate actual total guests (can be more than initial numberOfTravelers if guests are added)
  const totalGuests = passengers.length;
  const totalRoomsBooked = isMultiRoomMode ? rooms.length : numberOfRooms;

  // Debug logging to verify counts are updating
  console.log('=== Guest Counts ===');
  console.log('passengers.length:', passengers.length);
  console.log('totalGuests:', totalGuests);
  console.log('totalRoomsBooked:', totalRoomsBooked);
  console.log('numberOfTravelers (prop):', numberOfTravelers);
  console.log('numberOfRooms (prop):', numberOfRooms);

  // Smart auto-assignment logic
  const autoAssignGuestsToRooms = (): RoomSelection[] => {
    if (!isMultiRoomMode || availableOffers.length === 0) return [];

    // When booking multiple rooms, ensure each room gets at least 1 guest slot
    // even if there are fewer guests than rooms
    const minGuestsPerRoom = 1;
    const totalGuestSlots = Math.max(numberOfTravelers, numberOfRooms);

    const baseGuestsPerRoom = Math.max(minGuestsPerRoom, Math.floor(totalGuestSlots / numberOfRooms));
    const extraGuests = totalGuestSlots % numberOfRooms;

    const autoRooms: RoomSelection[] = [];
    let guestIndex = 0;

    // Use the first available offer as default suggestion
    const defaultOffer = availableOffers[0];

    console.log('=== Auto-assigning guests to rooms ===');
    console.log('Total travelers:', numberOfTravelers);
    console.log('Total rooms:', numberOfRooms);
    console.log('Total guest slots:', totalGuestSlots);

    for (let i = 0; i < numberOfRooms; i++) {
      const guestsInThisRoom = baseGuestsPerRoom + (i < extraGuests ? 1 : 0);
      const assignedGuestIds = [];

      for (let j = 0; j < guestsInThisRoom; j++) {
        assignedGuestIds.push(guestIndex++);
      }

      console.log(`Room ${i + 1}: ${guestsInThisRoom} guests, IDs:`, assignedGuestIds);

      autoRooms.push({
        roomNumber: i + 1,
        selectedOffer: defaultOffer,
        assignedGuestIds,
        guestsPerRoom: guestsInThisRoom,
        price: {
          total: defaultOffer.price.total,
          currency: defaultOffer.price.currency,
        },
      });
    }

    return autoRooms;
  };

  useEffect(() => {
    // For multi-room bookings, create enough passenger slots to fill all rooms
    // (minimum 1 per room, even if fewer travelers specified)
    const totalPassengerSlots = isMultiRoomMode
      ? Math.max(numberOfTravelers, numberOfRooms)
      : numberOfTravelers;

    // Initialize passengers array
    const initialPassengers: PassengerDetail[] = Array.from({ length: totalPassengerSlots }, () => ({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      city: '',
      country: '',
      passportNumber: '',
      passportExpiry: '',
      passportCountry: '',
    }));
    setPassengers(initialPassengers);
    setIsGroupBooking(numberOfTravelers > 3);

    // Initialize multi-room state with smart auto-assignment
    if (isMultiRoomMode) {
      const autoAssignedRooms = autoAssignGuestsToRooms();
      setRooms(autoAssignedRooms);
    }

    // Load organization data from localStorage and fetch latest credits from API
    const orgData = localStorage.getItem('organization');
    if (orgData) {
      try {
        const parsedOrg = JSON.parse(orgData);
        setOrganizationName(parsedOrg.name || 'Corporate Travel');

        // Fetch latest credits from API
        const fetchCredits = async () => {
          try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/v1/dashboard/stats', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              setAvailableCredits(data.credits.available || 5000);
            } else {
              setAvailableCredits(parsedOrg.availableCredits || 5000);
            }
          } catch (error) {
            console.error('Error fetching credits:', error);
            setAvailableCredits(parsedOrg.availableCredits || 5000);
          }
        };

        fetchCredits();
      } catch (e) {
        // If parsing fails, use defaults
        setOrganizationName('Corporate Travel');
        setAvailableCredits(5000);
      }
    }
  }, [numberOfTravelers, numberOfRooms, isMultiRoomMode]);

  const updatePassenger = (index: number, field: keyof PassengerDetail, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      if (!passenger.firstName || !passenger.lastName || !passenger.email) {
        alert(`Please fill in required fields for ${bookingType === 'flight' ? 'passenger' : 'guest'} ${i + 1}`);
        setCurrentStep(i);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(passenger.email)) {
        alert(`Please enter a valid email for ${bookingType === 'flight' ? 'passenger' : 'guest'} ${i + 1}`);
        setCurrentStep(i);
        return;
      }

      // Address validation
      if (!passenger.city || !passenger.city.trim() || !passenger.country || !passenger.country.trim()) {
        alert(`Please provide city and country for ${bookingType === 'flight' ? 'passenger' : 'guest'} ${i + 1}`);
        setCurrentStep(i);
        return;
      }
    }

    if (isGroupBooking && !groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    onSubmit(passengers, isGroupBooking, isGroupBooking ? groupName : undefined);
  };

  // Multi-room helper functions
  const updateRoomOffer = (roomNumber: number, offer: any) => {
    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.roomNumber === roomNumber
          ? {
              ...room,
              selectedOffer: offer,
              price: {
                total: offer.price.total,
                currency: offer.price.currency,
              },
            }
          : room
      )
    );
  };

  // Add guest to specific room
  const handleAddGuestToRoom = (roomNumber: number) => {
    console.log('=== Add Guest to Room ===');
    console.log('Room Number:', roomNumber);

    setSelectedRoomForGuest(roomNumber);
    setEditingGuestIndex(null);

    // Find the room
    const room = rooms.find(r => r.roomNumber === roomNumber);
    console.log('Found room:', room);

    if (!room) {
      console.error('Room not found!');
      return;
    }

    // First, check if there's an unfilled guest slot in this room
    const firstUnfilledGuestId = room.assignedGuestIds.find(guestId => {
      const guest = passengers[guestId];
      const unfilled = !guest || !guest.firstName || !guest.lastName || !guest.email;
      return unfilled;
    });

    if (firstUnfilledGuestId !== undefined) {
      // Use existing unfilled slot
      console.log('Using existing unfilled slot:', firstUnfilledGuestId);
      setCurrentStep(firstUnfilledGuestId);
    } else {
      // All existing slots are filled, add a new guest slot
      console.log('All slots filled, adding new guest to room');
      const newGuestId = passengers.length;

      // Add new passenger slot
      setPassengers(prev => [...prev, {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        city: '',
        country: '',
        passportNumber: '',
        passportExpiry: '',
        passportCountry: '',
      }]);

      // Add this guest ID to the room
      setRooms(prevRooms =>
        prevRooms.map(r =>
          r.roomNumber === roomNumber
            ? {
                ...r,
                assignedGuestIds: [...r.assignedGuestIds, newGuestId],
                guestsPerRoom: r.guestsPerRoom + 1,
              }
            : r
        )
      );

      setCurrentStep(newGuestId);
      console.log('Created new guest slot:', newGuestId);
    }
  };

  // Edit existing guest in room
  const handleEditGuestInRoom = (roomNumber: number, guestId: number) => {
    setSelectedRoomForGuest(roomNumber);
    setEditingGuestIndex(guestId);
    setCurrentStep(guestId);
  };

  // Save guest and return to room view
  const handleSaveGuestToRoom = () => {
    console.log('=== Save Guest ===');
    console.log('Current step (guest ID):', currentStep);
    console.log('Selected room:', selectedRoomForGuest);

    const currentGuest = passengers[currentStep];
    console.log('Guest data:', currentGuest);

    if (!currentGuest || !currentGuest.firstName || !currentGuest.lastName || !currentGuest.email) {
      alert('Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    console.log(`Guest ${currentGuest.firstName} ${currentGuest.lastName} saved to guest ID ${currentStep}`);
    console.log('This guest belongs to room:', selectedRoomForGuest);

    // Find which room this guest belongs to
    const room = rooms.find(r => r.assignedGuestIds.includes(currentStep));
    console.log('Guest assignment verified - belongs to room:', room?.roomNumber);

    setSelectedRoomForGuest(null);
    setEditingGuestIndex(null);
  };

  const calculateMultiRoomTotalPrice = (): number => {
    return rooms.reduce((total, room) => {
      return total + parseFloat(room.price.total);
    }, 0);
  };

  const handleMultiRoomSubmit = () => {
    if (!onMultiRoomSubmit) return;

    // Validate all guests have required info
    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      if (!passenger.firstName || !passenger.lastName || !passenger.email) {
        alert(`Please fill in required fields for guest ${i + 1}`);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(passenger.email)) {
        alert(`Please enter a valid email for guest ${i + 1}`);
        return;
      }
    }

    // Build multi-room booking data
    const multiRoomData: MultiRoomBookingSubmit = {
      isMultiRoom: true,
      rooms: rooms.map(room => ({
        roomNumber: room.roomNumber,
        offerId: room.selectedOffer.id,
        offerDetails: room.selectedOffer,
        guests: room.assignedGuestIds.map(guestId => passengers[guestId]),
        price: parseFloat(room.price.total),
      })),
      totalGuests: passengers.length, // Use actual total guests, not initial numberOfTravelers
      totalPrice: calculateMultiRoomTotalPrice(),
      isGroupBooking,
      groupName: isGroupBooking ? groupName : undefined,
    };

    onMultiRoomSubmit(multiRoomData);
  };

  const handleProceedToCheckout = () => {
    // Validate all passengers
    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      if (!passenger.firstName || !passenger.lastName || !passenger.email) {
        alert(`Please fill in required fields for ${bookingType === 'flight' ? 'passenger' : 'guest'} ${i + 1}`);
        setCurrentStep(i);
        setShowCheckout(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(passenger.email)) {
        alert(`Please enter a valid email for ${bookingType === 'flight' ? 'passenger' : 'guest'} ${i + 1}`);
        setCurrentStep(i);
        setShowCheckout(false);
        return;
      }

      // Address validation
      if (!passenger.city || !passenger.city.trim() || !passenger.country || !passenger.country.trim()) {
        alert(`Please provide city and country for ${bookingType === 'flight' ? 'passenger' : 'guest'} ${i + 1}`);
        setCurrentStep(i);
        setShowCheckout(false);
        return;
      }
    }

    if (isGroupBooking && !groupName.trim()) {
      alert('Please enter a group name');
      setShowCheckout(false);
      return;
    }

    setShowCheckout(true);
  };

  if (!isOpen) return null;

  const currentPassenger = passengers[currentStep];
  const progress = showCheckout ? 100 : ((currentStep + 1) / numberOfTravelers) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl max-w-[95vw] w-full my-2 shadow-2xl flex flex-col h-[calc(100vh-1rem)] border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gray-50 px-6 py-4 border-b border-gray-200 flex-shrink-0 rounded-t-2xl z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                showCheckout
                  ? 'bg-emerald-100 text-emerald-600'
                  : bookingType === 'flight'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-purple-100 text-purple-600'
              }`}>
                {showCheckout ? (
                  <CreditCardIcon className="w-5 h-5" />
                ) : bookingType === 'flight' ? (
                  <Plane className="w-5 h-5" />
                ) : (
                  <Hotel className="w-5 h-5" />
                )}
              </div>

              {/* Title and Progress */}
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {showCheckout
                    ? 'Complete Your Booking'
                    : `${bookingType === 'flight' ? 'Passenger' : 'Guest'} Information`}
                </h2>
                {!showCheckout && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    Step {currentStep + 1} of {numberOfTravelers} • {Math.round(progress)}% complete
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Add Guest Button */}
              {!showCheckout && numberOfTravelers > 1 && currentStep < numberOfTravelers - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Validate current passenger
                    const passenger = passengers[currentStep];
                    if (!passenger.firstName || !passenger.lastName || !passenger.email) {
                      alert('Please fill in required fields (First Name, Last Name, and Email)');
                      return;
                    }

                    // Email validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(passenger.email)) {
                      alert('Please enter a valid email address');
                      return;
                    }

                    setCurrentStep(currentStep + 1);
                  }}
                  className="relative z-20 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-xl transition-all hover:scale-105 shadow-lg"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add {bookingType === 'flight' ? 'Passenger' : 'Guest'}</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="relative z-20 p-2 hover:bg-gray-200 rounded-lg transition-all text-gray-500 hover:text-gray-900 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {!showCheckout && (
            <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 rounded-b-2xl">
          <div className="h-full">
          {/* Checkout View */}
          {showCheckout ? (
            <div className="min-h-[600px] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
              <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Review & Confirm
                  </h2>
                  <p className="text-gray-600">Please review your booking details and payment method</p>
                </div>

                {/* Credit Card Display */}
                <div className="flex justify-center transform hover:scale-105 transition-transform duration-300">
                  <CreditCard
                    organizationName={organizationName}
                    availableBalance={availableCredits}
                    size="small"
                    className="w-[380px] h-[220px]"
                  />
                </div>

                {/* Booking Summary */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition"></div>
                  <div className="relative bg-white rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-blue-600" />
                      Booking Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">Travelers</span>
                        <span className="font-bold text-gray-900">{totalGuests} {bookingType === 'flight' ? 'passenger(s)' : 'guest(s)'}</span>
                      </div>
                      {isGroupBooking && groupName && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 font-medium">Group Name</span>
                          <span className="font-bold text-gray-900">{groupName}</span>
                        </div>
                      )}
                      <div className="border-t-2 border-gray-200 pt-4 mt-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xl font-bold text-gray-900">Total Amount</span>
                          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                          <span className="text-gray-700 font-medium">Remaining Balance</span>
                          <span className={`text-lg font-bold ${availableCredits - totalPrice >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ${(availableCredits - totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-4 p-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl shadow-md">
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <Lock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-emerald-900 font-medium mb-1">Secure Payment</p>
                    <p className="text-xs text-emerald-700">
                      Your booking will be charged to your organization's credit balance. All transactions are encrypted and secure.
                    </p>
                  </div>
                </div>

                {/* Insufficient Credits Warning */}
                {availableCredits < totalPrice && (
                  <div className="flex items-start gap-4 p-5 bg-red-50 border-2 border-red-200 rounded-2xl shadow-md">
                    <div className="p-2 bg-red-100 rounded-full">
                      <X className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-red-900 font-medium mb-1">Insufficient Credits</p>
                      <p className="text-xs text-red-700">
                        Please contact your administrator to add credits before completing this booking.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
              {/* Left Column - Form (2/3 width in normal mode, full width in multi-room) */}
              <div className={`space-y-6 ${isMultiRoomMode ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
                {/* Group Booking Toggle */}
                {numberOfTravelers > 1 && currentStep === 0 && (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition"></div>
                    <div className="relative p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl">
                      <label className="flex items-start gap-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isGroupBooking}
                          onChange={(e) => setIsGroupBooking(e.target.checked)}
                          className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5" />
                            Group Booking
                          </div>
                          <p className="text-sm text-indigo-700">
                            Enable for corporate groups, family trips, or team travel
                          </p>
                        </div>
                      </label>

                      {isGroupBooking && (
                        <div className="mt-5 pt-5 border-t-2 border-indigo-200">
                          <label className="block text-sm font-bold text-indigo-900 mb-3">
                            Group Name *
                          </label>
                          <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g., Sales Team Q1 Conference, Smith Family Vacation"
                            className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
                            required={isGroupBooking}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Multi-Room 3-Column Layout */}
                {isMultiRoomMode && !showCheckout && (
                  <div className="grid grid-cols-12 gap-3 h-[calc(100vh-16rem)]">
                    {/* LEFT COLUMN: Room Cards with Add Guest & Room Type */}
                    <div className="col-span-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-3 overflow-y-auto">
                      <div className="mb-3">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <Bed className="w-4 h-4 text-blue-600" />
                          Rooms ({numberOfRooms})
                        </h3>
                      </div>

                      <div className="space-y-2">
                        {rooms.map((room) => {
                          const roomGuests = room.assignedGuestIds.map(id => passengers[id]).filter(g => g && g.firstName);

                          // Check if all guests in this room are filled
                          const allGuestsFilled = room.assignedGuestIds.length > 0 && room.assignedGuestIds.every(guestId => {
                            const guest = passengers[guestId];
                            // Explicitly check that guest exists AND has required fields
                            return guest && guest.firstName && guest.lastName && guest.email;
                          });

                          // Debug logging for Room 2+
                          if (room.roomNumber >= 2) {
                            console.log(`Room ${room.roomNumber}:`, {
                              assignedGuestIds: room.assignedGuestIds,
                              allGuestsFilled,
                              passengers: room.assignedGuestIds.map(id => ({
                                guestId: id,
                                exists: !!passengers[id],
                                data: passengers[id]
                              }))
                            });
                          }

                          return (
                            <div
                              key={room.roomNumber}
                              className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all"
                            >
                              {/* Room Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">{room.roomNumber}</span>
                                  </div>
                                  <span className="font-bold text-sm">Room {room.roomNumber}</span>
                                  {allGuestsFilled && (
                                    <div className="ml-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                  ${parseFloat(room.price.total).toFixed(0)}
                                </div>
                              </div>

                              {/* Room Type Selector */}
                              <div className="mb-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Room Type
                                </label>
                                <select
                                  value={room.selectedOffer.id}
                                  onChange={(e) => {
                                    const selectedOffer = availableOffers.find(offer => offer.id === e.target.value);
                                    if (selectedOffer) {
                                      updateRoomOffer(room.roomNumber, selectedOffer);
                                    }
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                  {availableOffers.map((offer) => {
                                    const roomType = offer.room?.typeEstimated?.category
                                      ? `${offer.room.typeEstimated.category.toLowerCase().replace(/_/g, ' ')}`
                                      : 'Standard';
                                    const bedType = offer.room?.typeEstimated?.bedType || '';
                                    return (
                                      <option key={offer.id} value={offer.id}>
                                        {roomType} {bedType && `${bedType}`} - ${parseFloat(offer.price.total).toFixed(0)}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              {/* Guest List */}
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="text-xs font-semibold text-gray-700">
                                    Guests ({roomGuests.length})
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAddGuestToRoom(room.roomNumber)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add
                                  </button>
                                </div>
                                <div className="space-y-1.5">
                                  {room.assignedGuestIds.map((guestId) => {
                                    const guest = passengers[guestId];
                                    const isFilled = guest?.firstName && guest?.lastName;

                                    return (
                                      <button
                                        key={guestId}
                                        type="button"
                                        onClick={() => handleEditGuestInRoom(room.roomNumber, guestId)}
                                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all ${
                                          isFilled
                                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-gray-900 hover:from-blue-100 hover:to-purple-100'
                                            : 'bg-gray-50 border border-dashed border-gray-300 text-gray-500 hover:bg-gray-100 hover:border-gray-400'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium truncate">
                                            {isFilled ? `${guest.firstName} ${guest.lastName}` : `Click to add guest`}
                                          </span>
                                          {isFilled && (
                                            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                              <Check className="w-2.5 h-2.5 text-white" />
                                            </div>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CENTER COLUMN: Guest Form */}
                    <div className="col-span-6 overflow-y-auto pr-2">
                      {selectedRoomForGuest !== null && currentPassenger ? (
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="bg-white rounded-xl border-2 border-blue-200 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                  {editingGuestIndex !== null ? 'Edit' : 'Add'} Guest for Room {selectedRoomForGuest}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  Guest {currentStep + 1} - Fill in details below
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRoomForGuest(null);
                                  setEditingGuestIndex(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                              >
                                <X className="w-5 h-5 text-gray-600" />
                              </button>
                            </div>
                          </div>

                          {/* Personal Information Section - Compact */}
                          <div className="bg-white rounded-xl border-2 border-blue-200 p-4">
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              Personal Information
                            </h4>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    First Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={currentPassenger.firstName}
                                    onChange={(e) => updatePassenger(currentStep, 'firstName', e.target.value)}
                                    placeholder="John"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Last Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={currentPassenger.lastName}
                                    onChange={(e) => updatePassenger(currentStep, 'lastName', e.target.value)}
                                    placeholder="Doe"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    required
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                                <input
                                  type="email"
                                  value={currentPassenger.email}
                                  onChange={(e) => updatePassenger(currentStep, 'email', e.target.value)}
                                  placeholder="john.doe@example.com"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Phone Number
                                </label>
                                <input
                                  type="tel"
                                  value={currentPassenger.phone}
                                  onChange={(e) => updatePassenger(currentStep, 'phone', e.target.value)}
                                  placeholder="+1 (555) 123-4567"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Address Information - Compact */}
                          <div className="bg-white rounded-xl border-2 border-green-200 p-4">
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-green-600" />
                              Address Information
                            </h4>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    City *
                                  </label>
                                  <input
                                    type="text"
                                    value={currentPassenger.city}
                                    onChange={(e) => updatePassenger(currentStep, 'city', e.target.value)}
                                    placeholder="New York"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Country *
                                  </label>
                                  <input
                                    type="text"
                                    value={currentPassenger.country}
                                    onChange={(e) => updatePassenger(currentStep, 'country', e.target.value)}
                                    placeholder="United States"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Save Button */}
                          <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 pt-4 mt-4">
                            <button
                              type="button"
                              onClick={handleSaveGuestToRoom}
                              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                            >
                              <Check className="w-5 h-5" />
                              Save Guest & Return to Rooms
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No Guest Selected</h3>
                            <p className="text-sm text-gray-600">
                              Click "Add Guest" or a guest name in a room card to fill in details
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: Summary */}
                    <div className="col-span-3 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 p-3 overflow-y-auto">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Booking Summary</h3>

                      {/* Room Breakdown */}
                      <div className="space-y-1.5 mb-3">
                        {rooms.map((room) => {
                          const roomGuests = room.assignedGuestIds.map(id => passengers[id]).filter(g => g && g.firstName);
                          return (
                            <div key={room.roomNumber} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <div className="font-bold text-xs text-gray-900">Room {room.roomNumber}</div>
                                  <div className="text-xs text-gray-600 line-clamp-1">
                                    {room.selectedOffer.room?.typeEstimated?.category?.toLowerCase().replace(/_/g, ' ') || 'Standard'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-blue-600">${parseFloat(room.price.total).toFixed(0)}</div>
                                  {bookingDetails?.numberOfNights && (
                                    <div className="text-xs text-gray-500">
                                      ${(parseFloat(room.price.total) / bookingDetails.numberOfNights).toFixed(0)}/night
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">{roomGuests.length}/{room.guestsPerRoom} guests added</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total */}
                      <div className="pt-3 border-t-2 border-gray-300 mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">Subtotal</span>
                          <span className="text-sm font-bold text-gray-900">${calculateMultiRoomTotalPrice().toFixed(2)}</span>
                        </div>
                        {bookingDetails?.numberOfNights && (
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>{numberOfRooms} rooms × {bookingDetails.numberOfNights} nights</span>
                          </div>
                        )}
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <Hotel className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-gray-900">{bookingDetails?.hotelName}</div>
                          </div>
                        </div>
                        {bookingDetails?.checkInDate && bookingDetails?.checkOutDate && (
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-gray-600">{new Date(bookingDetails.checkInDate).toLocaleDateString()}</div>
                              <div className="text-gray-500">to {new Date(bookingDetails.checkOutDate).toLocaleDateString()}</div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <Users className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="text-gray-600">{totalGuests} guests in {totalRoomsBooked} rooms</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Passenger Navigation - Show all passengers */}
                {numberOfTravelers > 1 && !isMultiRoomMode && (
                  <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                        {bookingType === 'flight' ? 'Passengers' : 'Guests'} ({numberOfTravelers})
                      </h4>
                      <span className="text-xs text-gray-500">Click to jump to any {bookingType === 'flight' ? 'passenger' : 'guest'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: numberOfTravelers }).map((_, idx) => {
                        const passenger = passengers[idx];
                        const isComplete = passenger && passenger.firstName && passenger.lastName && passenger.email;
                        const isCurrent = idx === currentStep;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentStep(idx)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                              isCurrent
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                                : isComplete
                                ? 'bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCurrent ? 'bg-white/20' : isComplete ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                            }`}>
                              {isComplete && !isCurrent ? '✓' : idx + 1}
                            </div>
                            <span className="text-sm">
                              {passenger?.firstName || `${bookingType === 'flight' ? 'Passenger' : 'Guest'} ${idx + 1}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Passenger Form - Show ONLY in normal mode (not multi-room) */}
                {!isMultiRoomMode && currentPassenger && (
                  <div className="space-y-6">
                    {/* Passenger Header */}
                    <div className="flex items-center gap-4 pb-5 border-b-2 border-gray-200">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur opacity-50"></div>
                        <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {currentStep + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">
                          {bookingType === 'flight' ? 'Passenger' : 'Guest'} {currentStep + 1}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {currentPassenger.firstName
                            ? `Editing ${currentPassenger.firstName}'s information`
                            : 'Fields marked with * are required'}
                        </p>
                      </div>
                    </div>

                    {/* Personal Information Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleSection('personal')}
                        className="w-full p-4 flex items-center justify-between hover:bg-blue-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900">Personal Information</h4>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${
                            expandedSections.personal ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {expandedSections.personal && (
                        <div className="px-6 pb-6">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            value={currentPassenger.firstName}
                            onChange={(e) => updatePassenger(currentStep, 'firstName', e.target.value)}
                            placeholder="John"
                            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            value={currentPassenger.lastName}
                            onChange={(e) => updatePassenger(currentStep, 'lastName', e.target.value)}
                            placeholder="Doe"
                            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition"
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                        <input
                          type="email"
                          value={currentPassenger.email}
                          onChange={(e) => updatePassenger(currentStep, 'email', e.target.value)}
                          placeholder="john.doe@example.com"
                          className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={currentPassenger.phone}
                            onChange={(e) => updatePassenger(currentStep, 'phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={currentPassenger.dateOfBirth}
                            onChange={(e) => updatePassenger(currentStep, 'dateOfBirth', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition"
                          />
                        </div>
                      </div>
                        </div>
                      )}
                    </div>

                    {/* Address Information */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleSection('address')}
                        className="w-full p-4 flex items-center justify-between hover:bg-green-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900">Address Information</h4>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-green-600 transition-transform duration-200 ${
                            expandedSections.address ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {expandedSections.address && (
                        <div className="px-6 pb-6">

                      <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={currentPassenger.address}
                          onChange={(e) => updatePassenger(currentStep, 'address', e.target.value)}
                          placeholder="123 Main Street, Apt 4B"
                          className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            value={currentPassenger.city}
                            onChange={(e) => updatePassenger(currentStep, 'city', e.target.value)}
                            placeholder="New York"
                            className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm transition"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Country *
                          </label>
                          <input
                            type="text"
                            value={currentPassenger.country}
                            onChange={(e) => updatePassenger(currentStep, 'country', e.target.value)}
                            placeholder="United States"
                            className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm transition"
                            required
                          />
                        </div>
                      </div>
                        </div>
                      )}
                    </div>

                    {/* Passport Details (for flights) */}
                    {bookingType === 'flight' && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-100 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleSection('passport')}
                          className="w-full p-4 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                              <Shield className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="font-bold text-gray-900">Passport Information (Optional)</h4>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-amber-600 transition-transform duration-200 ${
                              expandedSections.passport ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {expandedSections.passport && (
                          <div className="px-6 pb-6">
                            <div className="mb-4">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Passport Number
                          </label>
                          <input
                            type="text"
                            value={currentPassenger.passportNumber}
                            onChange={(e) =>
                              updatePassenger(currentStep, 'passportNumber', e.target.value)
                            }
                            placeholder="A12345678"
                            className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm transition"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Passport Expiry Date
                            </label>
                            <input
                              type="date"
                              value={currentPassenger.passportExpiry}
                              onChange={(e) =>
                                updatePassenger(currentStep, 'passportExpiry', e.target.value)
                              }
                              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm transition"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Issuing Country
                            </label>
                            <input
                              type="text"
                              value={currentPassenger.passportCountry}
                              onChange={(e) =>
                                updatePassenger(currentStep, 'passportCountry', e.target.value)
                              }
                              placeholder="United States"
                              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm transition"
                            />
                          </div>
                        </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Booking Summary (1/3 width) - Hide in multi-room mode */}
              {!isMultiRoomMode && (<div className="lg:col-span-1 space-y-6">
                {/* Booking Summary Card */}
                <div className="sticky top-6">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition"></div>
                    <div className="relative bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-xl">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                        {bookingType === 'flight' ? (
                          <Plane className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Hotel className="w-6 h-6 text-purple-600" />
                        )}
                        Booking Summary
                      </h3>

                      {/* Booking Details */}
                      {bookingDetails && (
                        <div className="mb-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 border-2 border-cyan-200">
                          {bookingType === 'hotel' ? (
                            <>
                              <div className="flex items-start gap-3 mb-4">
                                <Hotel className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-lg mb-1 truncate">
                                    {bookingDetails.hotelName || 'Hotel Booking'}
                                  </h4>
                                  {bookingDetails.roomType && (
                                    <p className="text-sm text-gray-600 font-medium">
                                      {bookingDetails.roomType}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                {bookingDetails.checkInDate && bookingDetails.checkOutDate && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar className="w-4 h-4 text-cyan-600" />
                                    <span className="font-medium">
                                      {new Date(bookingDetails.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(bookingDetails.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                )}
                                {bookingDetails.numberOfNights && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Clock className="w-4 h-4 text-cyan-600" />
                                    <span className="font-medium">{bookingDetails.numberOfNights} {bookingDetails.numberOfNights === 1 ? 'night' : 'nights'}</span>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-start gap-3 mb-4">
                                <Plane className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-lg mb-1">
                                    {bookingDetails.airline || 'Flight Booking'}
                                  </h4>
                                  {bookingDetails.flightNumber && (
                                    <p className="text-sm text-gray-600 font-medium">
                                      Flight {bookingDetails.flightNumber}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                {bookingDetails.departureAirport && bookingDetails.arrivalAirport && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium">
                                      {bookingDetails.departureAirport} → {bookingDetails.arrivalAirport}
                                    </span>
                                  </div>
                                )}
                                {bookingDetails.departureDate && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium">
                                      {new Date(bookingDetails.departureDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                )}
                                {bookingDetails.cabinClass && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium capitalize">{bookingDetails.cabinClass}</span>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Details */}
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 font-medium">Travelers</span>
                            <span className="text-lg font-bold text-gray-900">{numberOfTravelers}</span>
                          </div>
                          {isGroupBooking && groupName && (
                            <div className="pt-2 border-t border-blue-200 mt-2">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-semibold text-indigo-900">{groupName}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 font-medium">Total Amount</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{currency}</div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-3">Completion Progress</div>
                          <div className="space-y-2">
                            {Array.from({ length: numberOfTravelers }).map((_, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  idx < currentStep
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                    : idx === currentStep
                                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}>
                                  {idx < currentStep ? '✓' : idx + 1}
                                </div>
                                <span className={`text-sm ${
                                  idx <= currentStep ? 'font-semibold text-gray-900' : 'text-gray-500'
                                }`}>
                                  {bookingType === 'flight' ? 'Passenger' : 'Guest'} {idx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                          <Lock className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-blue-900 font-medium">Secure & Encrypted</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t-2 border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
          {showCheckout ? (
            <>
              {/* Back to Details Button */}
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-white hover:border-gray-400 transition-all hover:scale-105 shadow-sm"
              >
                ← Back to Details
              </button>

              <div className="flex-1" />

              {/* Complete Booking Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={availableCredits < totalPrice}
                className="group relative px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Check className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Complete Booking</span>
              </button>
            </>
          ) : isMultiRoomMode ? (
            <>
              {/* Multi-room footer: just show complete booking button */}
              <div className="flex-1" />

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {passengers.filter(p => p.firstName && p.lastName && p.email).length} of {totalGuests} guests added
                </p>
              </div>

              <button
                type="button"
                onClick={handleMultiRoomSubmit}
                className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Check className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Complete Booking</span>
              </button>
            </>
          ) : (
            <>
              {/* Previous Button */}
              <button
                type="button"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-white hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-sm disabled:hover:scale-100"
              >
                ← Previous
              </button>

              <div className="flex-1 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-gray-200 shadow-sm">
                  <span className="text-sm font-bold text-gray-900">Step {currentStep + 1}</span>
                  <span className="text-sm text-gray-500">of {numberOfTravelers}</span>
                </div>
              </div>

              {/* Add Guest/Proceed to Checkout Button */}
              {currentStep < numberOfTravelers - 1 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Validate current passenger
                    const passenger = passengers[currentStep];
                    if (!passenger.firstName || !passenger.lastName || !passenger.email) {
                      alert('Please fill in required fields (First Name, Last Name, and Email)');
                      return;
                    }

                    // Email validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(passenger.email)) {
                      alert('Please enter a valid email address');
                      return;
                    }

                    setCurrentStep(currentStep + 1);
                  }}
                  className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <UserPlus className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Add {bookingType === 'flight' ? 'Passenger' : 'Guest'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CreditCardIcon className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Proceed to Checkout</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
