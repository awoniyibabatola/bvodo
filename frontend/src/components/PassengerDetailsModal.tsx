'use client';

import { useState, useEffect } from 'react';
import { X, Users, Plus, Trash2, UserPlus, Check, CreditCard as CreditCardIcon, Plane, Shield, Lock, MapPin, Hotel, Calendar, Clock, Bed } from 'lucide-react';
import CreditCard from './CreditCard';
import { getApiEndpoint } from '@/lib/api-config';

// Comprehensive list of countries
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
  'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
  'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

interface PassengerDetail {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender?: string;
  type?: 'adult' | 'child' | 'infant_without_seat';  // Passenger type - required for flights
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
      gender: '',
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

            const response = await fetch(getApiEndpoint('dashboard/stats'), {
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

      // Gender validation for flights
      if (bookingType === 'flight' && (!passenger.gender || !passenger.gender.trim())) {
        alert(`Please select gender for passenger ${i + 1}`);
        setCurrentStep(i);
        return;
      }

      // Passenger type validation for flights (REQUIRED by Duffel API)
      if (bookingType === 'flight' && (!passenger.type || !passenger.type.trim())) {
        alert(`Please select passenger type for passenger ${i + 1}`);
        setCurrentStep(i);
        return;
      }

      // Phone validation for flights (REQUIRED by Duffel API)
      if (bookingType === 'flight') {
        if (!passenger.phone || !passenger.phone.trim()) {
          alert(`Phone number is required for passenger ${i + 1}. Airlines need this for booking confirmation.`);
          setCurrentStep(i);
          return;
        }
        // Strip spaces and validate E.164 format
        const phoneWithoutSpaces = passenger.phone.replace(/\s/g, '');
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phoneWithoutSpaces)) {
          alert(`Please enter a valid phone number with country code for passenger ${i + 1} (e.g., +1 416 555 1234)`);
          setCurrentStep(i);
          return;
        }
        // Update passenger with space-stripped phone number
        passenger.phone = phoneWithoutSpaces;
      }

      // Date of Birth validation for flights (REQUIRED by Duffel API)
      if (bookingType === 'flight') {
        if (!passenger.dateOfBirth || !passenger.dateOfBirth.trim()) {
          alert(`Date of birth is required for passenger ${i + 1}. Airlines need this for booking confirmation.`);
          setCurrentStep(i);
          return;
        }
        // Check minimum age (at least 2 years old)
        const birthDate = new Date(passenger.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        const actualAge = age - (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? 1 : 0);

        if (actualAge < 2) {
          alert(`Passenger ${i + 1} must be at least 2 years old to travel alone. Infants require special booking.`);
          setCurrentStep(i);
          return;
        }

        // Validate that passenger type matches age
        const expectedType = actualAge >= 12 ? 'adult' : actualAge >= 2 ? 'child' : 'infant_without_seat';
        if (passenger.type && passenger.type !== expectedType) {
          const typeLabels = {
            'adult': 'Adult (12+ years)',
            'child': 'Child (2-11 years)',
            'infant_without_seat': 'Infant (under 2 years)'
          };
          if (!confirm(
            `Warning: Passenger ${i + 1} is ${actualAge} years old but marked as "${typeLabels[passenger.type as keyof typeof typeLabels]}".\n\n` +
            `Based on age, they should be "${typeLabels[expectedType as keyof typeof typeLabels]}".\n\n` +
            `Continue anyway? (This may cause booking errors with the airline)`
          )) {
            setCurrentStep(i);
            return;
          }
        }
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
        gender: '',
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

      // Gender validation for flights
      if (bookingType === 'flight' && (!passenger.gender || !passenger.gender.trim())) {
        alert(`Please select gender for passenger ${i + 1}`);
        setCurrentStep(i);
        setShowCheckout(false);
        return;
      }

      // Passenger type validation for flights (REQUIRED by Duffel API)
      if (bookingType === 'flight' && (!passenger.type || !passenger.type.trim())) {
        alert(`Please select passenger type for passenger ${i + 1}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-lg max-w-2xl w-full my-2 flex flex-col max-h-[calc(100vh-2rem)] border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="relative bg-white px-4 py-3 border-b border-gray-200 flex-shrink-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className="p-1.5 rounded border border-gray-200 flex-shrink-0 bg-white">
                {showCheckout ? (
                  <CreditCardIcon className="w-4 h-4 text-gray-700" />
                ) : bookingType === 'flight' ? (
                  <Plane className="w-4 h-4 text-gray-700" />
                ) : (
                  <Hotel className="w-4 h-4 text-gray-700" />
                )}
              </div>

              {/* Title and Progress */}
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 truncate">
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

            <div className="flex items-center gap-2 flex-shrink-0">
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
                  className="relative z-20 flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded text-xs font-semibold hover:bg-gray-50 transition-all"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Add {bookingType === 'flight' ? 'Passenger' : 'Guest'}</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="relative z-20 p-1.5 hover:bg-gray-100 rounded transition-all text-gray-500 hover:text-gray-900 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {!showCheckout && (
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all duration-500"
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
            <div className="min-h-[600px] bg-white p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-1">
                  <h2 className="text-base font-bold text-gray-900">
                    Review & Confirm
                  </h2>
                  <p className="text-xs text-gray-600">Please review your booking details and payment method</p>
                </div>

                {/* Credit Card Display */}
                <div className="flex justify-center">
                  <CreditCard
                    organizationName={organizationName}
                    availableBalance={availableCredits}
                    size="small"
                    className="w-[380px] h-[220px]"
                  />
                </div>

                {/* Booking Summary */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-700" />
                    Booking Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs text-gray-600">Travelers</span>
                      <span className="text-xs font-bold text-gray-900">{totalGuests} {bookingType === 'flight' ? 'passenger(s)' : 'guest(s)'}</span>
                    </div>
                    {isGroupBooking && groupName && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-600">Group Name</span>
                        <span className="text-xs font-bold text-gray-900">{groupName}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-900">Total Amount</span>
                        <span className="text-lg font-bold text-gray-900">
                          ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded border border-gray-200">
                        <span className="text-xs text-gray-700">Remaining Balance</span>
                        <span className={`text-sm font-bold ${availableCredits - totalPrice >= 0 ? 'text-gray-900' : 'text-gray-900'}`}>
                          ${(availableCredits - totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="p-1 bg-white rounded border border-gray-200">
                    <Lock className="w-3 h-3 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-900 font-semibold mb-0.5">Secure Payment</p>
                    <p className="text-xs text-gray-600">
                      Your booking will be charged to your organization's credit balance. All transactions are encrypted and secure.
                    </p>
                  </div>
                </div>

                {/* Insufficient Credits Warning */}
                {availableCredits < totalPrice && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-300 rounded">
                    <div className="p-1 bg-white rounded border border-gray-300">
                      <X className="w-3 h-3 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-900 font-semibold mb-0.5">Insufficient Credits</p>
                      <p className="text-xs text-gray-600">
                        Please contact your administrator to add credits before completing this booking.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Form Content */}
              <div className="space-y-4 max-w-3xl mx-auto">
                {/* Group Booking Toggle */}
                {numberOfTravelers > 1 && currentStep === 0 && (
                  <div className="p-4 bg-white border border-gray-200 rounded">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isGroupBooking}
                        onChange={(e) => setIsGroupBooking(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-gray-900 rounded focus:ring-1 focus:ring-gray-900"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 flex items-center gap-2 mb-1 text-xs">
                          <Users className="w-3 h-3" />
                          Group Booking
                        </div>
                        <p className="text-xs text-gray-600">
                          Enable for corporate groups, family trips, or team travel
                        </p>
                      </div>
                    </label>

                    {isGroupBooking && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <label className="block text-xs font-semibold text-gray-900 mb-2">
                          Group Name *
                        </label>
                        <input
                          type="text"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          placeholder="e.g., Sales Team Q1 Conference"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                          required={isGroupBooking}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Multi-Room 3-Column Layout */}
                {isMultiRoomMode && !showCheckout && (
                  <div className="grid grid-cols-12 gap-3 h-[calc(100vh-16rem)]">
                    {/* LEFT COLUMN: Room Cards with Add Guest & Room Type */}
                    <div className="col-span-3 bg-white rounded border border-gray-200 p-3 overflow-y-auto">
                      <div className="mb-3">
                        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <Bed className="w-3 h-3 text-gray-700" />
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
                              className="bg-white rounded p-2 border border-gray-200"
                            >
                              {/* Room Header */}
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded bg-gray-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-gray-700">{room.roomNumber}</span>
                                  </div>
                                  <span className="font-bold text-xs">Room {room.roomNumber}</span>
                                  {allGuestsFilled && (
                                    <div className="ml-1 w-3 h-3 rounded-full bg-gray-200 flex items-center justify-center">
                                      <Check className="w-2 h-2 text-gray-700" />
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs font-bold text-gray-900">
                                  ${parseFloat(room.price.total).toFixed(0)}
                                </div>
                              </div>

                              {/* Room Type Selector */}
                              <div className="mb-1.5">
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
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
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
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-xs font-semibold text-gray-700">
                                    Guests ({roomGuests.length})
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAddGuestToRoom(room.roomNumber)}
                                    className="text-xs text-gray-700 hover:text-gray-900 font-semibold flex items-center gap-1"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
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
                                        className={`w-full text-left px-2.5 py-2 rounded text-xs transition-all ${
                                          isFilled
                                            ? 'bg-gray-50 border border-gray-200 text-gray-900 hover:bg-gray-100'
                                            : 'bg-gray-50 border border-dashed border-gray-300 text-gray-500 hover:bg-gray-100 hover:border-gray-400'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium truncate">
                                            {isFilled ? `${guest.firstName} ${guest.lastName}` : `Click to add guest`}
                                          </span>
                                          {isFilled && (
                                            <div className="w-3 h-3 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                              <Check className="w-2 h-2 text-white" />
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
                          <div className="bg-white rounded border border-gray-200 p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-sm font-bold text-gray-900">
                                  {editingGuestIndex !== null ? 'Edit' : 'Add'} Guest for Room {selectedRoomForGuest}
                                </h3>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  Guest {currentStep + 1} - Fill in details below
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRoomForGuest(null);
                                  setEditingGuestIndex(null);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded transition-all"
                              >
                                <X className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>

                          {/* Personal Information Section - Compact */}
                          <div className="bg-white rounded border border-gray-200 p-3">
                            <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-gray-700" />
                              Personal Information
                            </h4>

                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                    First Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={currentPassenger.firstName}
                                    onChange={(e) => updatePassenger(currentStep, 'firstName', e.target.value)}
                                    placeholder="John"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                    Last Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={currentPassenger.lastName}
                                    onChange={(e) => updatePassenger(currentStep, 'lastName', e.target.value)}
                                    placeholder="Doe"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                                    required
                                  />
                                </div>
                              </div>

                              {bookingType === 'flight' && (
                                <>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                      Gender *
                                    </label>
                                    <select
                                      value={currentPassenger.gender || ''}
                                      onChange={(e) => updatePassenger(currentStep, 'gender', e.target.value)}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                                      required
                                    >
                                      <option value="">Select gender</option>
                                      <option value="m">Male</option>
                                      <option value="f">Female</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                      Passenger Type *
                                    </label>
                                    <select
                                      value={currentPassenger.type || ''}
                                      onChange={(e) => updatePassenger(currentStep, 'type', e.target.value as 'adult' | 'child' | 'infant_without_seat')}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                                      required
                                    >
                                      <option value="">Select passenger type</option>
                                      <option value="adult">Adult (12+ years)</option>
                                      <option value="child">Child (2-11 years)</option>
                                      <option value="infant_without_seat">Infant (under 2 years)</option>
                                    </select>
                                  </div>
                                </>
                              )}

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-0.5">Email Address *</label>
                                <input
                                  type="email"
                                  value={currentPassenger.email}
                                  onChange={(e) => updatePassenger(currentStep, 'email', e.target.value)}
                                  placeholder="john.doe@example.com"
                                  pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                                  title="Please enter a valid email address (e.g., john.doe@example.com)"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                  Phone Number {bookingType === 'flight' ? '*' : <span className="text-gray-500 font-normal">(Optional)</span>}
                                </label>
                                <input
                                  type="tel"
                                  value={currentPassenger.phone}
                                  onChange={(e) => updatePassenger(currentStep, 'phone', e.target.value)}
                                  placeholder="+1 416 555 1234"
                                  pattern="^\+[1-9]\d{1,14}$"
                                  title="Please enter a valid phone number with country code (e.g., +1 416 555 1234)"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                                  required={bookingType === 'flight'}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Address Information - Compact */}
                          <div className="bg-white rounded border border-gray-200 p-3">
                            <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-gray-700" />
                              Address Information
                            </h4>

                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                    City *
                                  </label>
                                  <input
                                    type="text"
                                    value={currentPassenger.city}
                                    onChange={(e) => updatePassenger(currentStep, 'city', e.target.value)}
                                    placeholder="New York"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                    Country *
                                  </label>
                                  <select
                                    value={currentPassenger.country}
                                    onChange={(e) => updatePassenger(currentStep, 'country', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                                    required
                                  >
                                    <option value="">Select country</option>
                                    {COUNTRIES.map((country) => (
                                      <option key={country} value={country}>
                                        {country}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Save Button */}
                          <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-3 mt-3">
                            <button
                              type="button"
                              onClick={handleSaveGuestToRoom}
                              className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded font-semibold flex items-center justify-center gap-1.5 transition-all text-xs"
                            >
                              <Check className="w-3 h-3" />
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
                    <div className="col-span-3 bg-gray-50 rounded border border-gray-200 p-3 overflow-y-auto">
                      <h3 className="text-xs font-bold text-gray-900 mb-2">Booking Summary</h3>

                      {/* Room Breakdown */}
                      <div className="space-y-1.5 mb-3">
                        {rooms.map((room) => {
                          const roomGuests = room.assignedGuestIds.map(id => passengers[id]).filter(g => g && g.firstName);
                          return (
                            <div key={room.roomNumber} className="bg-white rounded p-2 border border-gray-200">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <div className="font-bold text-xs text-gray-900">Room {room.roomNumber}</div>
                                  <div className="text-xs text-gray-600 line-clamp-1">
                                    {room.selectedOffer.room?.typeEstimated?.category?.toLowerCase().replace(/_/g, ' ') || 'Standard'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-bold text-gray-900">${parseFloat(room.price.total).toFixed(0)}</div>
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
                  <div className="bg-white rounded border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-gray-700">
                        {bookingType === 'flight' ? 'Passengers' : 'Guests'} ({numberOfTravelers})
                      </h4>
                      <span className="text-xs text-gray-500">Click to jump to any {bookingType === 'flight' ? 'passenger' : 'guest'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: numberOfTravelers }).map((_, idx) => {
                        const passenger = passengers[idx];
                        const isComplete = passenger && passenger.firstName && passenger.lastName && passenger.email;
                        const isCurrent = idx === currentStep;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentStep(idx)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded font-semibold transition-all text-xs ${
                              isCurrent
                                ? 'bg-gray-900 text-white'
                                : isComplete
                                ? 'bg-gray-50 text-gray-900 border border-gray-300 hover:bg-gray-100'
                                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCurrent ? 'bg-white/20' : isComplete ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {isComplete && !isCurrent ? '✓' : idx + 1}
                            </div>
                            <span className="text-xs">
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
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                      <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center text-white font-bold text-sm">
                        {currentStep + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900">
                          {bookingType === 'flight' ? 'Passenger' : 'Guest'} {currentStep + 1}
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {currentPassenger.firstName
                            ? `Editing ${currentPassenger.firstName}'s information`
                            : 'Fields marked with * are required'}
                        </p>
                      </div>
                    </div>

                    {/* Personal Information Section */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-200">
                        <div className="w-9 h-9 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">Personal Information</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              First Name *
                            </label>
                            <input
                              type="text"
                              value={currentPassenger.firstName}
                              onChange={(e) => updatePassenger(currentStep, 'firstName', e.target.value)}
                              placeholder="John"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              value={currentPassenger.lastName}
                              onChange={(e) => updatePassenger(currentStep, 'lastName', e.target.value)}
                              placeholder="Doe"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                              required
                            />
                          </div>
                        </div>

                        {bookingType === 'flight' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Gender *
                              </label>
                              <select
                                value={currentPassenger.gender || ''}
                                onChange={(e) => updatePassenger(currentStep, 'gender', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                                required
                              >
                                <option value="">Select gender</option>
                                <option value="m">Male</option>
                                <option value="f">Female</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Passenger Type *
                              </label>
                              <select
                                value={currentPassenger.type || ''}
                                onChange={(e) => updatePassenger(currentStep, 'type', e.target.value as 'adult' | 'child' | 'infant_without_seat')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                                required
                              >
                                <option value="">Select passenger type</option>
                                <option value="adult">Adult (12+ years)</option>
                                <option value="child">Child (2-11 years)</option>
                                <option value="infant_without_seat">Infant (under 2 years)</option>
                              </select>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address *</label>
                          <input
                            type="email"
                            value={currentPassenger.email}
                            onChange={(e) => updatePassenger(currentStep, 'email', e.target.value)}
                            placeholder="john.doe@example.com"
                            pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                            title="Please enter a valid email address (e.g., john.doe@example.com)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              Phone Number {bookingType === 'flight' ? '*' : <span className="text-gray-500 font-normal">(Optional)</span>}
                            </label>
                            <input
                              type="tel"
                              value={currentPassenger.phone}
                              onChange={(e) => updatePassenger(currentStep, 'phone', e.target.value)}
                              placeholder="+1 416 555 1234"
                              title="Please enter a valid phone number with country code (e.g., +1 416 555 1234). Spaces are allowed for readability."
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                              required={bookingType === 'flight'}
                            />
                            <p className="text-xs text-gray-500 mt-1.5">With country code</p>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              Date of Birth {bookingType === 'flight' ? '*' : <span className="text-gray-500 font-normal">(Optional)</span>}
                            </label>
                            <input
                              type="date"
                              value={currentPassenger.dateOfBirth}
                              onChange={(e) => updatePassenger(currentStep, 'dateOfBirth', e.target.value)}
                              max={new Date().toISOString().split('T')[0]}
                              min={new Date(new Date().setFullYear(new Date().getFullYear() - 120)).toISOString().split('T')[0]}
                              title="Please select your date of birth. Must be at least 2 years old to travel alone."
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                              required={bookingType === 'flight'}
                            />
                            <p className="text-xs text-gray-500 mt-1.5">Min. 2 years old</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-200">
                        <div className="w-9 h-9 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">Address Information</h4>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Street Address
                          </label>
                          <input
                            type="text"
                            value={currentPassenger.address}
                            onChange={(e) => updatePassenger(currentStep, 'address', e.target.value)}
                            placeholder="123 Main Street, Apt 4B"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              value={currentPassenger.city}
                              onChange={(e) => updatePassenger(currentStep, 'city', e.target.value)}
                              placeholder="New York"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              Country *
                            </label>
                            <select
                              value={currentPassenger.country}
                              onChange={(e) => updatePassenger(currentStep, 'country', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                              required
                            >
                              <option value="">Select country</option>
                              {COUNTRIES.map((country) => (
                                <option key={country} value={country}>
                                  {country}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Passport Details (for flights) */}
                    {bookingType === 'flight' && (
                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-200">
                          <div className="w-9 h-9 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm">Passport Information <span className="text-gray-500 font-normal text-xs">(Optional)</span></h4>
                        </div>

                        <div className="space-y-4">
                          {/* Info Box */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-sm text-gray-700">
                              <strong>Note:</strong> Recommended for international flights
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              Passport Number
                            </label>
                            <input
                              type="text"
                              value={currentPassenger.passportNumber}
                              onChange={(e) =>
                                updatePassenger(currentStep, 'passportNumber', e.target.value)
                              }
                              placeholder="A12345678"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Expiry Date
                              </label>
                              <input
                                type="date"
                                value={currentPassenger.passportExpiry}
                                onChange={(e) =>
                                  updatePassenger(currentStep, 'passportExpiry', e.target.value)
                                }
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Issuing Country
                              </label>
                              <select
                                value={currentPassenger.passportCountry}
                                onChange={(e) =>
                                  updatePassenger(currentStep, 'passportCountry', e.target.value)
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all min-h-[44px]"
                              >
                                <option value="">Select country</option>
                                {COUNTRIES.map((country) => (
                                  <option key={country} value={country}>
                                    {country}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
                {/* Booking Summary Card */}
                <div className="sticky top-6">
                  <div className="bg-white rounded border border-gray-200 p-3">
                    <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                      {bookingType === 'flight' ? (
                        <Plane className="w-3 h-3 text-gray-700" />
                      ) : (
                        <Hotel className="w-3 h-3 text-gray-700" />
                      )}
                      Booking Summary
                    </h3>

                      {/* Booking Details */}
                      {bookingDetails && (
                        <div className="mb-3 bg-gray-50 rounded p-2 border border-gray-200">
                          {bookingType === 'hotel' ? (
                            <>
                              <div className="flex items-start gap-2 mb-2">
                                <Hotel className="w-3 h-3 text-gray-700 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-xs mb-0.5 truncate">
                                    {bookingDetails.hotelName || 'Hotel Booking'}
                                  </h4>
                                  {bookingDetails.roomType && (
                                    <p className="text-xs text-gray-600 font-medium">
                                      {bookingDetails.roomType}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1 text-xs">
                                {bookingDetails.checkInDate && bookingDetails.checkOutDate && (
                                  <div className="flex items-center gap-1.5 text-gray-700">
                                    <Calendar className="w-3 h-3 text-gray-600" />
                                    <span className="font-medium text-xs">
                                      {new Date(bookingDetails.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(bookingDetails.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                )}
                                {bookingDetails.numberOfNights && (
                                  <div className="flex items-center gap-1.5 text-gray-700">
                                    <Clock className="w-3 h-3 text-gray-600" />
                                    <span className="font-medium text-xs">{bookingDetails.numberOfNights} {bookingDetails.numberOfNights === 1 ? 'night' : 'nights'}</span>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-start gap-2 mb-2">
                                <Plane className="w-3 h-3 text-gray-700 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-xs mb-0.5">
                                    {bookingDetails.airline || 'Flight Booking'}
                                  </h4>
                                  {bookingDetails.flightNumber && (
                                    <p className="text-xs text-gray-600 font-medium">
                                      Flight {bookingDetails.flightNumber}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1 text-xs">
                                {bookingDetails.departureAirport && bookingDetails.arrivalAirport && (
                                  <div className="flex items-center gap-1.5 text-gray-700">
                                    <MapPin className="w-3 h-3 text-gray-600" />
                                    <span className="font-medium text-xs">
                                      {bookingDetails.departureAirport} → {bookingDetails.arrivalAirport}
                                    </span>
                                  </div>
                                )}
                                {bookingDetails.departureDate && (
                                  <div className="flex items-center gap-1.5 text-gray-700">
                                    <Calendar className="w-3 h-3 text-gray-600" />
                                    <span className="font-medium text-xs">
                                      {new Date(bookingDetails.departureDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                )}
                                {bookingDetails.cabinClass && (
                                  <div className="flex items-center gap-1.5 text-gray-700">
                                    <Users className="w-3 h-3 text-gray-600" />
                                    <span className="font-medium text-xs capitalize">{bookingDetails.cabinClass}</span>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Details */}
                      <div className="space-y-2">
                        <div className="bg-gray-50 rounded p-2 border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600 font-medium">Travelers</span>
                            <span className="text-sm font-bold text-gray-900">{numberOfTravelers}</span>
                          </div>
                          {isGroupBooking && groupName && (
                            <div className="pt-1 border-t border-gray-200 mt-1">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-gray-700" />
                                <span className="text-xs font-semibold text-gray-900">{groupName}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded p-2 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 font-medium">Total Amount</span>
                            <span className="text-sm font-bold text-gray-900">
                              ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{currency}</div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="bg-gray-50 rounded p-2 border border-gray-200">
                          <div className="text-xs font-medium text-gray-700 mb-2">Completion Progress</div>
                          <div className="space-y-1.5">
                            {Array.from({ length: numberOfTravelers }).map((_, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                  idx < currentStep
                                    ? 'bg-gray-700 text-white'
                                    : idx === currentStep
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}>
                                  {idx < currentStep ? '✓' : idx + 1}
                                </div>
                                <span className={`text-xs ${
                                  idx <= currentStep ? 'font-semibold text-gray-900' : 'text-gray-500'
                                }`}>
                                  {bookingType === 'flight' ? 'Passenger' : 'Guest'} {idx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-center gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded">
                          <Lock className="w-3 h-3 text-gray-700" />
                          <span className="text-xs text-gray-900 font-medium">Secure & Encrypted</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between gap-3 flex-shrink-0">
          {showCheckout ? (
            <>
              {/* Back to Details Button */}
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all text-xs"
              >
                ← Back to Details
              </button>

              <div className="flex-1" />

              {/* Complete Booking Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={availableCredits < totalPrice}
                className="px-4 py-2 bg-gray-900 text-white rounded font-semibold hover:bg-gray-800 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                <Check className="w-3 h-3" />
                <span>Complete Booking</span>
              </button>
            </>
          ) : isMultiRoomMode ? (
            <>
              {/* Multi-room footer: just show complete booking button */}
              <div className="flex-1" />

              <div className="text-center">
                <p className="text-xs text-gray-600">
                  {passengers.filter(p => p.firstName && p.lastName && p.email).length} of {totalGuests} guests added
                </p>
              </div>

              <button
                type="button"
                onClick={handleMultiRoomSubmit}
                className="px-4 py-2 bg-gray-900 text-white rounded font-semibold hover:bg-gray-800 transition-all flex items-center gap-1.5 text-xs"
              >
                <Check className="w-3 h-3" />
                <span>Complete Booking</span>
              </button>
            </>
          ) : (
            <>
              {/* Previous Button */}
              <button
                type="button"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs"
              >
                ← Previous
              </button>

              <div className="flex-1 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded border border-gray-200">
                  <span className="text-xs font-bold text-gray-900">Step {currentStep + 1}</span>
                  <span className="text-xs text-gray-500">of {numberOfTravelers}</span>
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
                  className="px-4 py-2 bg-gray-900 text-white rounded font-semibold hover:bg-gray-800 transition-all flex items-center gap-1.5 text-xs"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Add {bookingType === 'flight' ? 'Passenger' : 'Guest'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="px-4 py-2 bg-gray-900 text-white rounded font-semibold hover:bg-gray-800 transition-all flex items-center gap-1.5 text-xs"
                >
                  <CreditCardIcon className="w-3 h-3" />
                  <span>Proceed to Checkout</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
