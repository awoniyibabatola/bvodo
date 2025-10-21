# Multi-Room Booking Architecture

## Data Structures

### Frontend Types

```typescript
// Extended guest detail (same as PassengerDetail)
interface GuestDetail {
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

// Single room selection
interface RoomSelection {
  roomNumber: number; // 1, 2, 3, etc.
  selectedOffer: any; // Amadeus hotel offer object
  assignedGuestIds: number[]; // Indices of guests assigned to this room
  guestsPerRoom: number; // How many guests this room can hold
  price: {
    total: string;
    currency: string;
    perNight: number;
  };
}

// Multi-room booking state
interface MultiRoomBooking {
  totalRooms: number;
  totalGuests: number;
  rooms: RoomSelection[];
  allGuests: GuestDetail[];
  totalPrice: number;
  currency: string;
}

// Updated modal props
interface PassengerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;

  // Multi-room support
  numberOfRooms: number; // NEW
  numberOfTravelers: number;
  availableOffers: any[]; // NEW - all available room offers

  // Existing props
  onSubmit: (bookingData: MultiRoomBookingSubmit) => void; // UPDATED
  bookingType: 'flight' | 'hotel';
  totalPrice?: number;
  currency?: string;
  bookingDetails?: HotelBookingDetails;
}

// Submission data structure
interface MultiRoomBookingSubmit {
  isMultiRoom: boolean;
  rooms: Array<{
    roomNumber: number;
    offerId: string;
    offerDetails: any;
    guests: GuestDetail[];
    price: number;
  }>;
  totalGuests: number;
  totalPrice: number;
  isGroupBooking: boolean;
  groupName?: string;
}
```

### Backend Schema Updates

```typescript
// Prisma schema changes needed

model HotelBooking {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])

  hotelId         String
  hotelName       String

  checkInDate     DateTime
  checkOutDate    DateTime
  numberOfNights  Int

  // Multi-room support
  isMultiRoom     Boolean  @default(false)
  totalRooms      Int      @default(1)
  rooms           RoomBookingItem[] // One-to-many relation

  totalGuests     Int
  totalPrice      Decimal
  currency        String

  isGroupBooking  Boolean  @default(false)
  groupName       String?

  status          BookingStatus @default(PENDING)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model RoomBookingItem {
  id              String   @id @default(cuid())
  bookingId       String
  booking         HotelBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  roomNumber      Int
  offerId         String
  roomType        String
  bedType         String?

  price           Decimal
  currency        String

  guests          Guest[]  // One-to-many relation
  numberOfGuests  Int

  createdAt       DateTime @default(now())
}

model Guest {
  id                String   @id @default(cuid())
  roomBookingId     String
  roomBooking       RoomBookingItem @relation(fields: [roomBookingId], references: [id], onDelete: Cascade)

  firstName         String
  lastName          String
  email             String
  phone             String
  dateOfBirth       String

  address           String?
  city              String?
  country           String?

  passportNumber    String?
  passportExpiry    String?
  passportCountry   String?

  createdAt         DateTime @default(now())
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

## Smart Auto-Assignment Logic

### Algorithm

```typescript
function autoAssignGuests(
  totalGuests: number,
  totalRooms: number,
  defaultOffer: any
): RoomSelection[] {
  // Calculate guests per room (distribute evenly)
  const baseGuestsPerRoom = Math.floor(totalGuests / totalRooms);
  const extraGuests = totalGuests % totalRooms;

  const rooms: RoomSelection[] = [];
  let guestIndex = 0;

  for (let i = 0; i < totalRooms; i++) {
    // First rooms get extra guests if not evenly divisible
    const guestsInThisRoom = baseGuestsPerRoom + (i < extraGuests ? 1 : 0);

    const assignedGuestIds = [];
    for (let j = 0; j < guestsInThisRoom; j++) {
      assignedGuestIds.push(guestIndex++);
    }

    rooms.push({
      roomNumber: i + 1,
      selectedOffer: defaultOffer, // Auto-suggest same room type
      assignedGuestIds,
      guestsPerRoom: guestsInThisRoom,
      price: {
        total: defaultOffer.price.total,
        currency: defaultOffer.price.currency,
        perNight: parseFloat(defaultOffer.price.total) / numberOfNights,
      },
    });
  }

  return rooms;
}

// Example: 7 guests, 3 rooms
// Room 1: 3 guests (indices 0, 1, 2)
// Room 2: 2 guests (indices 3, 4)
// Room 3: 2 guests (indices 5, 6)
```

## UI Flow

### Step 1: Initial Auto-Assignment
```
┌─────────────────────────────────────────────┐
│ Book 3 Rooms for 7 Guests                   │
├─────────────────────────────────────────────┤
│ We've auto-assigned your guests evenly:     │
│                                             │
│ Room 1: 3 guests • Deluxe King Room         │
│ Room 2: 2 guests • Deluxe King Room         │
│ Room 3: 2 guests • Deluxe King Room         │
│                                             │
│ [Customize Rooms] [Continue →]              │
└─────────────────────────────────────────────┘
```

### Step 2: Customize Room Types (Optional)
```
┌─────────────────────────────────────────────┐
│ Customize Your Rooms                        │
├─────────────────────────────────────────────┤
│ Room 1 (3 guests)                           │
│ [Deluxe King Room ▼]        $299/night      │
│                                             │
│ Room 2 (2 guests)                           │
│ [Standard Double ▼]         $199/night      │
│                                             │
│ Room 3 (2 guests)                           │
│ [Suite ▼]                   $499/night      │
│                                             │
│ Total: $997/night                           │
│           [Continue to Guest Details →]     │
└─────────────────────────────────────────────┘
```

### Step 3: Enter Guest Details
```
┌─────────────────────────────────────────────┐
│ Guest Details - Room 1 (3 guests)           │
├─────────────────────────────────────────────┤
│ Guest 1 [First Name] [Last Name] [Email]    │
│ Guest 2 [First Name] [Last Name] [Email]    │
│ Guest 3 [First Name] [Last Name] [Email]    │
│                                             │
│ [← Previous Room] [Next Room →]             │
└─────────────────────────────────────────────┘
```

### Step 4: Review & Checkout
```
┌─────────────────────────────────────────────┐
│ Review Your Booking                         │
├─────────────────────────────────────────────┤
│ Room 1: Deluxe King • $299                  │
│ └─ John Doe, Jane Doe, Bob Smith            │
│                                             │
│ Room 2: Standard Double • $199              │
│ └─ Alice Johnson, Charlie Brown             │
│                                             │
│ Room 3: Suite • $499                        │
│ └─ Eve Davis, Frank Miller                  │
├─────────────────────────────────────────────┤
│ Total: $997 × 3 nights = $2,991             │
│                                             │
│           [Complete Booking →]              │
└─────────────────────────────────────────────┘
```

## API Endpoints

### Create Multi-Room Booking
```typescript
POST /api/v1/bookings/hotel/multi-room

Request Body:
{
  "hotelId": "MCLONGHM",
  "hotelName": "Hotel Name",
  "checkInDate": "2025-01-15",
  "checkOutDate": "2025-01-18",
  "numberOfNights": 3,
  "isMultiRoom": true,
  "totalRooms": 3,
  "rooms": [
    {
      "roomNumber": 1,
      "offerId": "offer-123",
      "roomType": "Deluxe King Room",
      "bedType": "King",
      "price": 299,
      "currency": "USD",
      "guests": [
        { "firstName": "John", "lastName": "Doe", ... },
        { "firstName": "Jane", "lastName": "Doe", ... },
        { "firstName": "Bob", "lastName": "Smith", ... }
      ]
    },
    {
      "roomNumber": 2,
      "offerId": "offer-456",
      "roomType": "Standard Double",
      "bedType": "Double",
      "price": 199,
      "currency": "USD",
      "guests": [
        { "firstName": "Alice", "lastName": "Johnson", ... },
        { "firstName": "Charlie", "lastName": "Brown", ... }
      ]
    }
  ],
  "totalPrice": 2991,
  "currency": "USD",
  "isGroupBooking": false
}

Response:
{
  "success": true,
  "booking": {
    "id": "booking-xyz",
    "confirmationNumber": "BV-12345",
    "rooms": [...],
    "totalPrice": 2991
  }
}
```

## Migration Strategy

1. Keep existing single-room flow working
2. Add multi-room support as optional enhancement
3. Use `isMultiRoom` flag to route to appropriate logic
4. Backward compatible - existing bookings unaffected
