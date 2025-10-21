# Bridge Card Complete Test Implementation Documentation

## Table of Contents
1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Cardholder Management](#cardholder-management)
4. [Card Operations](#card-operations)
5. [Transaction Management](#transaction-management)
6. [Webhook Events](#webhook-events)
7. [Complete Code Examples](#complete-code-examples)
8. [Error Handling](#error-handling)
9. [Rate Limits](#rate-limits)
10. [Testing Checklist](#testing-checklist)

---

## Getting Started

### 1. Create Account
Register at: https://bridgecard.cards/register

### 2. Get API Keys
1. Login to dashboard: https://bridgecard.co/dashboard
2. Navigate to **API Keys** tab
3. Copy your **Sandbox Keys**:
   - **Access Token** (starts with `at_test_`)
   - **Secret Key** (starts with `sk_test_`)

### 3. API Base URLs

**Sandbox (Testing):**
```
https://issuecards.api.bridgecard.co/v1/issuing/sandbox
```

**Production (Live):**
```
https://issuecards.api.bridgecard.co/v1/issuing
```

### 4. Supported Countries
- Nigeria 🇳🇬
- Ghana 🇬🇭
- Uganda 🇺🇬
- Kenya 🇰🇪

---

## Authentication

All API requests require authentication using Bearer token in headers:

```bash
--header 'token: Bearer at_test_YOUR_ACCESS_TOKEN'
--header 'Content-Type: application/json'
```

---

## Cardholder Management

### Register Cardholder (Synchronous)

**Endpoint:** `POST /cardholder/register_cardholder_synchronously`

**Description:** Registers and verifies cardholder in real-time (~45 seconds response time)

**Request:**
```bash
curl --location --request POST 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cardholder/register_cardholder_synchronously' \
--header 'token: Bearer at_test_YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
  "first_name": "John",
  "last_name": "Doe",
  "address": {
    "address": "9 Jibowu Street",
    "city": "Aba North",
    "state": "Abia",
    "country": "Nigeria",
    "postal_code": "1000242",
    "house_no": "13"
  },
  "phone": "08122277789",
  "email_address": "[email protected]",
  "identity": {
    "id_type": "NIGERIAN_BVN_VERIFICATION",
    "bvn": "22222222222222",
    "selfie_image": "https://example.com/selfie.jpg"
  },
  "meta_data": {
    "user_id": "your_internal_user_id_123"
  }
}'
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "cardholder created successfully.",
  "data": {
    "cardholder_id": "e416a9a188af40b78b8afd740e835d699"
  }
}
```

**Response (Error - Invalid BVN):**
```json
{
  "message": "Invalid BVN, a valid BVN is 12 digits long"
}
```

### Register Cardholder (Asynchronous - Recommended)

**Endpoint:** `POST /cardholder/register_cardholder`

**Description:** Registers cardholder and sends webhook when verification completes (1-24 hours for manual review cases)

**Request:** Same as synchronous

**Response:**
```json
{
  "status": "success",
  "message": "cardholder created successfully, you'll receive a webhook event when this user's identity has been verified.",
  "data": {
    "cardholder_id": "e416a9a188af40b78b8afd740e835d699"
  }
}
```

### Identity Object by Country

#### Nigeria
```json
{
  "id_type": "NIGERIAN_BVN_VERIFICATION",
  "bvn": "22222222222222",
  "selfie_image": "https://example.com/selfie.jpg"
}
```

OR with other ID types:
```json
{
  "id_type": "NIGERIAN_NIN",
  "id_no": "32747711121",
  "id_image": "https://example.com/id.jpg",
  "bvn": "22222222222222"
}
```

**Other Nigerian ID types:** `NIGERIAN_INTERNATIONAL_PASSPORT`, `NIGERIAN_PVC`, `NIGERIAN_DRIVERS_LICENSE`

#### Ghana
```json
{
  "id_type": "GHANIAN_GHANA_CARD",
  "id_no": "32747711121",
  "id_image": "https://example.com/id.jpg",
  "selfie_image": "https://example.com/selfie.jpg"
}
```

**Other Ghanaian ID types:** `GHANIAN_SSNIT`, `GHANIAN_VOTERS_ID`, `GHANIAN_DRIVERS_LICENSE`, `GHANIAN_INTERNATIONAL_PASSPORT`

#### Uganda
```json
{
  "id_type": "UGANDA_NATIONAL_ID",
  "id_no": "32747711121",
  "first_name": "John",
  "last_name": "Doe",
  "middle_name": "Middle",
  "date_of_birth": "1990-12-02",
  "gender": "male",
  "selfie_image": "https://example.com/selfie.jpg"
}
```

**Other Ugandan ID types:** `UGANDA_VOTERS_ID`, `UGANDA_PASSPORT`, `UGANDA_DRIVERS_LICENSE`

#### Kenya
```json
{
  "id_type": "KENYAN_VOTERS_ID",
  "id_no": "32747711121",
  "first_name": "John",
  "last_name": "Doe",
  "middle_name": "Middle",
  "date_of_birth": "1990-12-02",
  "gender": "male",
  "selfie_image": "https://example.com/selfie.jpg"
}
```

### Get Cardholder Details

**Endpoint:** `GET /cardholder/get_cardholder`

```bash
curl --location --request GET 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cardholder/get_cardholder?cardholder_id=e416a9a188af40b78b8afd740e835d68' \
--header 'token: Bearer at_test_YOUR_TOKEN'
```

**Response:**
```json
{
  "status": "success",
  "message": "cardholder details fetched successfully.",
  "data": {
    "cardholder_id": "d0658fedf8284207866d961e83fa",
    "first_name": "John",
    "last_name": "Doe",
    "email_address": "[email protected]",
    "phone": "2348189691071",
    "is_active": true,
    "is_id_verified": true,
    "address": {
      "address": "9 Jibowu Street",
      "city": "Aba North",
      "state": "Abia",
      "country": "nigeria",
      "postal_code": "1000242",
      "house_no": "13"
    },
    "identity_details": {
      "blacklisted": false,
      "date_of_birth": "1999-02-04",
      "gender": "Male",
      "id_no": "22222222222",
      "id_type": "NIGERIAN_NIN"
    },
    "meta_data": {"user_id": "your_internal_user_id_123"}
  }
}
```

### Delete Cardholder

**Endpoint:** `DELETE /cardholder/delete_cardholder/{cardholder_id}`

```bash
curl --location --request DELETE 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cardholder/delete_cardholder/e416a9a188af40b78b8afd740e835d68' \
--header 'token: Bearer at_test_YOUR_TOKEN'
```

---

## Card Operations

### STEP 1: Fund Your Sandbox Wallet (Required First)

**Endpoint:** `PATCH /issuing_wallet/fund_issuing_wallet`

```bash
curl --location --request PATCH 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/issuing_wallet/fund_issuing_wallet' \
--header 'token: Bearer at_test_YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
  "amount": "10000000",
  "currency": "USD"
}'
```

### STEP 2: Encrypt Card PIN

Before creating a card, you must encrypt the 4-digit PIN using AES-256 encryption.

#### Python
```bash
pip install aes-everywhere
```

```python
from AesEverywhere import aes256

pin = "1234"  # 4 digit PIN
secret_key = "sk_test_YOUR_SECRET_KEY"

encrypted_pin = aes256.encrypt(pin, secret_key)
encrypted_pin = encrypted_pin.decode()
print(encrypted_pin)
```

#### Node.js
```bash
npm install aes-everywhere
```

```javascript
const AES256 = require('aes-everywhere');

const pin = "1234";
const secretKey = "sk_test_YOUR_SECRET_KEY";

const encrypted = AES256.encrypt(pin, secretKey);
console.log(encrypted);
```

#### PHP
```bash
composer require mervick/aes-everywhere
```

```php
<?php
require 'vendor/mervick/aes-everywhere/php/src/AES256.php';
use mervick\aesEverywhere\AES256;

$pin = "1234";
$secretKey = "sk_test_YOUR_SECRET_KEY";

$encrypted = AES256::encrypt($pin, $secretKey);
echo $encrypted;
?>
```

#### Go
```go
import "github.com/mervick/aes-everywhere/go/aes256"

pin := "1234"
secretKey := "sk_test_YOUR_SECRET_KEY"

encrypted := aes256.Encrypt(pin, secretKey)
fmt.Println(encrypted)
```

### STEP 3: Create Virtual Card

**Endpoint:** `POST /cards/create_card`

**Card Limits:**
- **$5,000 limit:** Use `"card_limit": "500000"` (requires minimum $3 funding)
- **$10,000 limit:** Use `"card_limit": "1000000"` (requires minimum $4 funding)

```bash
curl --location --request POST 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/create_card' \
--header 'token: Bearer at_test_YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
  "cardholder_id": "e416a9a188af40b78b8afd740e835d699",
  "card_type": "virtual",
  "card_brand": "Mastercard",
  "card_currency": "USD",
  "card_limit": "500000",
  "funding_amount": "300",
  "pin": "U2FsdGVkX1+encrypted_pin_here",
  "transaction_reference": "unique_ref_001",
  "meta_data": {
    "user_id": "your_internal_user_id_123"
  }
}'
```

**Parameters:**
- `cardholder_id` (required): Verified cardholder ID
- `card_type` (required): `"virtual"` or `"physical"`
- `card_brand` (required): `"Mastercard"`
- `card_currency` (required): `"USD"`
- `card_limit` (required): `"500000"` ($5k) or `"1000000"` ($10k)
- `funding_amount` (required): Amount in cents (minimum 300 for $5k, 400 for $10k)
- `pin` (required): AES-256 encrypted 4-digit PIN
- `transaction_reference` (optional): Your unique transaction ID
- `meta_data` (optional): Custom data object

**Response:**
```json
{
  "status": "success",
  "message": "The Mastercard USD card was created successfully",
  "data": {
    "card_id": "216ef11a58bf468baeb9cdbb94765865",
    "currency": "USD"
  }
}
```

### Create Physical Card

Same as virtual card but use `"card_type": "physical"` and requires activation after delivery.

### Activate Physical Card

**Endpoint:** `POST /cards/activate_physical_card`

```bash
curl --location --request POST 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/activate_physical_card' \
--header 'token: Bearer at_test_YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
  "cardholder_id": "e416a9a188af40b78b8afd740e835d699",
  "card_type": "physical",
  "card_brand": "Mastercard",
  "card_currency": "USD",
  "card_token_number": "1234567890123",
  "meta_data": {}
}'
```

### Get Card Details

**Endpoint:** `GET /cards/get_card_details`

**Two endpoints available:**

1. **Non-sensitive endpoint** (for listing cards, showing last 4 digits):
```
https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/get_card_details?card_id=CARD_ID
```

2. **Sensitive endpoint** (when user needs full card details for payment):
```
https://issuecards-api-bridgecard-co.relay.evervault.com/v1/issuing/sandbox/cards/get_card_details?card_id=CARD_ID
```

**Request:**
```bash
curl --location --request GET 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/get_card_details?card_id=216ef11a58bf468baeb9cdbb94765865' \
--header 'token: Bearer at_test_YOUR_TOKEN'
```

**Response:**
```json
{
  "status": "success",
  "message": "Card details was fetched successfully",
  "data": {
    "card_id": "216ef11a58bf468baeb9cdbb947",
    "card_number": "ev:RFVC:encrypted_card_number",
    "cvv": "ev:RFVC:encrypted_cvv",
    "expiry_month": "ev:RFVC:encrypted_month",
    "expiry_year": "ev:RFVC:encrypted_year",
    "card_name": "John Doe",
    "card_type": "virtual",
    "brand": "Mastercard",
    "card_currency": "USD",
    "last_4": "8649",
    "is_active": true,
    "is_deleted": false,
    "balance": "900",
    "available_balance": "600",
    "book_balance": "900",
    "blocked_due_to_fraud": false,
    "pin_3ds_activated": true,
    "cardholder_id": "d0658fedf8284207866d961e4a7083fa",
    "billing_address": {
      "billing_address1": "256 Chapman Road STE 105-4",
      "billing_city": "Newark",
      "billing_country": "US",
      "billing_zip_code": "19702",
      "state": "Delaware",
      "state_code": "DE"
    },
    "meta_data": {
      "user_id": "your_internal_user_id_123"
    }
  }
}
```

**Balance Explanation:**
- `balance`: Total amount on card (includes maintenance fee held)
- `book_balance`: Same as balance
- `available_balance`: Amount user can spend/withdraw (balance minus maintenance fee)

### Get Card Balance

**Endpoint:** `GET /cards/get_card_balance`

```bash
curl --location --request GET 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/get_card_balance?card_id=216ef11a58bf468baeb9cdbb94765865' \
--header 'token: Bearer at_test_YOUR_TOKEN'
```

**Response:**
```json
{
  "status": "success",
  "message": "Card balance was fetched successfully",
  "data": {
    "card_id": "216ef11a58bf468baeb9cdbb94765865",
    "balance": "900",
    "settled_available_balance": "800",
    "settled_book_balance": "900"
  }
}
```

### Fund Card

**Endpoint:** `PATCH /cards/fund_card_asynchronously`

**Rate Limit:** Once every 5 minutes per card

```bash
curl --location --request PATCH 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/fund_card_asynchronously' \
--header 'token: Bearer at_test_YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
  "card_id": "216ef11a58bf468baeb9cdbb94765865",
  "amount": "10000",
  "transaction_reference": "unique_fund_ref_002",
  "currency": "USD"
}'
```

**Parameters:**
- `amount`: Amount in cents (10000 = $100)
- `transaction_reference`: Must be unique
- Maximum balance per card: $5,000 or $10,000 (depending on card limit)

**Response:**
```json
{
  "status": "success",
  "message": "Card funding in progress",
  "data": {
    "card_id": "216ef11a58bf468baeb9cdbb94765865",
    "transaction_reference": "unique_fund_ref_002"
  }
}
```

**Note:** Listen to `card_credit_event.successful` webhook for confirmation

### Unload Card (Withdraw Funds)

**Endpoint:** `PATCH /cards/unload_card_asynchronously`

**Rate Limit:** Once every 5 minutes per card

```bash
curl --location --request PATCH 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/unload_card_asynchronously' \
--header 'token: Bearer at_test_YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
  "card_id": "216ef11a58bf468baeb9cdbb94765865",
  "amount": "5000",
  "transaction_reference": "unique_unload_ref_003",
  "currency": "USD"
}'
```

**Response:**
```json
{
  "status": "success",
  "message": "Card unloading in progress",
  "data": {
    "card_id": "216ef11a58bf468baeb9cdbb94765865",
    "transaction_reference": "unique_unload_ref_003"
  }
}
```

**Note:** Listen to `card_unload_event.successful` webhook for confirmation

### Freeze Card

**Endpoint:** `PATCH /cards/freeze_card`

```bash
curl --location --request PATCH 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/freeze_card?card_id=216ef11a58bf468baeb9cdbb94765865' \
--header 'token: Bearer at_test_YOUR_TOKEN'
```

**Response:**
```json
{
  "status": "success",
  "message": "This card has been frozen successfully",
  "data": {
    "card_id": "216ef11a58bf468baeb9cdbb94765865"
  }
}
```

### Unfreeze Card

**Endpoint:** `PATCH /cards/unfreeze_card`

```bash
curl --location --request PATCH 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/unfreeze_card?card_id=216ef11a58bf468baeb9cdbb94765865' \
--header 'token: Bearer at_test_YOUR_TOKEN'
```

### Update Card PIN

**Endpoint:** `POST /cards/update_card_pin`

```bash
curl --location --request POST 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/update_card_pin' \
--header 'token: Bearer at_test_YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
  "card_id": "216ef11a58bf468baeb9cdbb94765865",
  "card_pin": "U2FsdGVkX1+new_encrypted_pin"
}'
```

### Get All Cardholder Cards

**Endpoint:** `GET /cards/get_all_cardholder_cards`

```bash
curl --location --request GET 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/get_all_cardholder_cards?cardholder_id=d0658fedf82861e4a7083fa' \
--header 'token: Bearer at_test_YOUR_TOKEN'
```

**Response:**
```json
{
  "status": "success",
  "message": "All the cards for this cardholder have been fetched successfully",
  "data": {
    "cards": [
      {
        "card_id": "5334986c13c4026a9c160eabc49",
        "card_name": "John Doe",
        "card_type": "virtual",
        "brand": "Mastercard",
        "last_4": "8623",
        "is_active": true
      }
    ],
    "total": 1
  }
}
```

### Delete Card

**Endpoint:** `DELETE /cards/delete_card/{card_id}`

**⚠️ Important:** Unload all funds before deleting!

```bash
curl --location --request DELETE 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/delete_card/216ef11a58bf468baeb9cdbb94765865' \
--header 'token: Bearer at_test_YOUR_TOKEN'
```

---

## Transaction Management

### Mock Debit Transaction (Sandbox Only)

**Endpoint:** `PATCH /cards/mock_debit_transaction`

Simulates a purchase transaction for testing.

```bash
curl --location --request PATCH 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/mock_debit_transaction' \
--header 'token: Bearer at_test_YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
  "card_id": "216ef11a58bf468baeb9cdbb94765865"
}'
```

**Response:**
```json
{
  "status": "success",
  "message": "Debit transaction was done Successfully",
  "data": {
    "card_id": "216ef11a58bf468baeb9cdbb94765865",
    "transaction_reference": "auto_generated_ref"
  }
}
```

### Get Card Transactions

**Endpoint:** `GET /cards/get_card_transactions`

**Rate Limit:** Once every 3 seconds per card per page

```bash
curl --location --request GET 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/get_card_transactions?card_id=216ef11a58bf468baeb9cdbb94765865&page=1' \
--header 'token: Bearer at_test_YOUR_TOKEN'
```

**Optional Query Parameters:**
- `page` (required): Page number (20 transactions per page)
- `start_date` (optional): Format `2023-03-01 12:10:00`
- `end_date` (optional): Format `2023-03-01 12:10:00`

**Response:**
```json
{
  "status": "success",
  "message": "Card transaction history was fetched successfully",
  "data": {
    "transactions": [
      {
        "amount": "100",
        "card_transaction_type": "DEBIT",
        "description": "Apple Inc. US",
        "currency": "USD",
        "client_transaction_reference": "5c3598c8152446ba8093d058d8b59a1e",
        "bridgecard_transaction_reference": "7832a4d6371e4643aba4aa1f3c7030ab",
        "transaction_date": "2022-08-08 02:48:15",
        "transaction_timestamp": 1659923295,
        "merchant_category_code": "123478",
        "enriched_data": {
          "is_recurring": true,
          "merchant_city": "California",
          "merchant_code": "123478",
          "merchant_logo": "https://logos.ntropy.com/apple.com",
          "merchant_name": "Apple",
          "merchant_website": "apple.com",
          "transaction_category": "Others",
          "transaction_group": "Other Outgoing Transactions"
        }
      },
      {
        "amount": "1000",
        "card_transaction_type": "CREDIT",
        "description": "Virtual dollar card funding",
        "currency": "USD",
        "client_transaction_reference": "0906c4b453a745b8abbcf8b77b846ddd",
        "transaction_date": "2022-08-08 02:17:14"
      }
    ],
    "meta": {
      "total": 2,
      "pages": 1,
      "previous": null,
      "next": "https://api.bridgecard.co/v1/issuing/cards/sandbox/get_card_transactions?card_id=216ef11a58bf468baeb9cdbb94765865&page=2"
    }
  }
}
```

### Get Transaction by ID

**Endpoint:** `GET /cards/get_card_transaction_by_id`

```bash
curl --location --request GET 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/get_card_transaction_by_id?card_id=216ef11a58bf468baeb9cdbb94765865&client_transaction_reference=unique_ref_001' \
--header 'token: Bearer at_test_YOUR_TOKEN'
```

### Get Transaction Status

**Endpoint:** `GET /cards/get_card_transaction_status`

Use this to check if a funding/unloading transaction is complete.

```bash
curl --location --request GET 'https://issuecards.api.bridgecard.co/v1/issuing/sandbox/cards/get_card_transaction_status?card_id=216ef11a58bf468baeb9cdbb94765865&client_transaction_reference=unique_fund_ref_002' \
--header 'token: Bearer at_test_YOUR_TOKEN'
```

**Response:**
```json
{
  "status": "success",
  "message": "Transaction status fetched successfully",
  "data": {
    "transaction_status": "SUCCESSFUL"
  }
}
```

**Status Values:** `PENDING`, `SUCCESSFUL`, `FAILED`

---

## Webhook Events

Configure webhook URL in your dashboard to receive real-time notifications.

### Webhook Authentication

Each webhook includes a signature for verification. Verify webhooks on your server before processing.

### Available Events

#### 1. Cardholder Verification Successful
```json
{
  "event": "cardholder_verification.successful",
  "data": {
    "cardholder_id": "859505050505",
    "email_address": "[email protected]",
    "first_name": "John",
    "last_name": "Doe",
    "issuing_app_id": "9ujinoncpsni3943198393939930ke",
    "livemode": false
  }
}
```

#### 2. Cardholder Verification Failed
```json
{
  "event": "cardholder_verification.failed",
  "data": {
    "cardholder_id": "859505050505",
    "issuing_app_id": "9ujinoncpsni3943198393939930ke",
    "livemode": false,
    "reason": "The user failed our second stage KYC verification"
  }
}
```

#### 3. Cardholder Verification Manual Review
```json
{
  "event": "cardholder_verification.manual_review",
  "data": {
    "cardholder_id": "859505050505",
    "issuing_app_id": "9ujinoncpsni3943198393939930ke",
    "livemode": false
  }
}
```

#### 4. Card Creation Successful
```json
{
  "event": "card_creation_event.successful",
  "data": {
    "card_id": "859505050505",
    "cardholder_id": "859505050505",
    "currency": "USD",
    "issuing_app_id": "9ujinoncpsni3943198393939930ke",
    "livemode": false
  }
}
```

#### 5. Card Creation Failed
```json
{
  "event": "card_creation_event.failed",
  "data": {
    "card_id": "859505050505",
    "cardholder_id": "859505050505",
    "currency": "USD",
    "issuing_app_id": "9ujinoncpsni3943198393939930ke",
    "livemode": true,
    "reason": "The user failed our second stage KYC verification"
  }
}
```

#### 6. Card Credit (Funding) Successful
```json
{
  "event": "card_credit_event.successful",
  "data": {
    "card_id": "859505050505",
    "cardholder_id": "859505050505",
    "amount": "100",
    "currency": "USD",
    "transaction_reference": "859505050505",
    "card_transaction_type": "CREDIT",
    "transaction_date": "2022-09-28 23:10:45",
    "transaction_timestamp": 1664406645,
    "settled_available_balance": "500",
    "settled_book_balance": "400"
  }
}
```

#### 7. Card Credit Failed
```json
{
  "event": "card_credit_event.failed",
  "data": {
    "card_id": "859505050505",
    "cardholder_id": "859505050505",
    "amount": "100",
    "currency": "USD",
    "transaction_reference": "859505050505",
    "reason": "Insufficient balance in your issuing wallet"
  }
}
```

#### 8. Card Debit (Purchase) Successful
```json
{
  "event": "card_debit_event.successful",
  "data": {
    "card_id": "859505050505",
    "cardholder_id": "859505050505",
    "amount": "100",
    "description": "Amazon US",
    "currency": "USD",
    "transaction_reference": "859505050505",
    "card_transaction_type": "DEBIT",
    "merchant_category_code": "12345",
    "transaction_date": "2022-09-28 23:10:45",
    "transaction_timestamp": 1664406645,
    "settled_available_balance": "500",
    "settled_book_balance": "400"
  }
}
```

#### 9. Card Debit Declined
```json
{
  "event": "card_debit_event.declined",
  "data": {
    "card_id": "06246484994004040404efcf",
    "cardholder_id": "06246484994004040404efcf",
    "amount": "100",
    "currency": "USD",
    "decline_reason": "Insufficient balance to pay the merchant charge",
    "description": "Amazon US",
    "merchant_category_code": "12345",
    "transaction_date": "2022-09-28 23:10:45"
  }
}
```

#### 10. Card Unload Successful
```json
{
  "event": "card_unload_event.successful",
  "data": {
    "card_id": "859505050505",
    "cardholder_id": "859505050505",
    "amount": "100",
    "currency": "USD",
    "transaction_reference": "859505050505",
    "transaction_date": "2022-09-28 23:10:45"
  }
}
```

#### 11. Card Reversal (Refund)
```json
{
  "event": "card_reversal_event.successful",
  "data": {
    "card_id": "a303fb8b7a0e476fbc910671ca952b74",
    "cardholder_id": "9b78a44ccdf848fd860f75fd5c117d9d",
    "amount": "100",
    "currency": "USD",
    "transaction_reference": "22597F3D-A7A5-4C9B-B9DF-B7D918EE8241_REVERSAL",
    "transaction_date": "2022-09-28 23:10:45",
    "card_transaction_type": "CREDIT"
  }
}
```

#### 12. Card Delete Notification (Warning)
```json
{
  "event": "card_delete_event.notification",
  "data": {
    "card_id": "859505050505",
    "cardholder_id": "859505050505",
    "currency": "USD",
    "potential_delete_date": "2022-09-28 23:10:45",
    "livemode": true
  }
}
```

#### 13. Card Deleted
```json
{
  "event": "card_delete_event.successful",
  "data": {
    "card_id": "859505050505",
    "cardholder_id": "859505050505",
    "currency": "USD",
    "livemode": true
  }
}
```

---

## Complete Code Examples

### Python Full Implementation

```python
import requests
import json
from AesEverywhere import aes256

class BridgeCardClient:
    def __init__(self, access_token, secret_key, sandbox=True):
        self.access_token = access_token
        self.secret_key = secret_key
        self.base_url = "https://issuecards.api.bridgecard.co/v1/issuing"
        if sandbox:
            self.base_url += "/sandbox"
        
        self.headers = {
            'token': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
    
    def encrypt_pin(self, pin):
        """Encrypt 4-digit PIN using AES-256"""
        encrypted = aes256.encrypt(pin, self.secret_key)
        return encrypted.decode()
    
    def register_cardholder(self, first_name, last_name, email, phone, address, identity, meta_data=None):
        """Register a new cardholder"""
        url = f"{self.base_url}/cardholder/register_cardholder_synchronously"
        
        payload = {
            "first_name": first_name,
            "last_name": last_name,
            "email_address": email,
            "phone": phone,
            "address": address,
            "identity": identity,
            "meta_data": meta_data or {}
        }
        
        response = requests.post(url, headers=self.headers, data=json.dumps(payload))
        return response.json()
    
    def create_card(self, cardholder_id, card_limit="500000", funding_amount="300", pin="1234", meta_data=None):
        """Create a virtual USD card"""
        url = f"{self.base_url}/cards/create_card"
        
        encrypted_pin = self.encrypt_pin(pin)
        
        payload = {
            "cardholder_id": cardholder_id,
            "card_type": "virtual",
            "card_brand": "Mastercard",
            "card_currency": "USD",
            "card_limit": card_limit,
            "funding_amount": funding_amount,
            "pin": encrypted_pin,
            "transaction_reference": f"create_{cardholder_id}_{int(time.time())}",
            "meta_data": meta_data or {}
        }
        
        response = requests.post(url, headers=self.headers, data=json.dumps(payload))
        return response.json()
    
    def get_card_details(self, card_id):
        """Get card details"""
        url = f"{self.base_url}/cards/get_card_details?card_id={card_id}"
        response = requests.get(url, headers=self.headers)
        return response.json()
    
    def fund_card(self, card_id, amount, transaction_reference=None):
        """Fund a card (amount in cents)"""
        url = f"{self.base_url}/cards/fund_card_asynchronously"
        
        payload = {
            "card_id": card_id,
            "amount": str(amount),
            "currency": "USD",
            "transaction_reference": transaction_reference or f"fund_{card_id}_{int(time.time())}"
        }
        
        response = requests.patch(url, headers=self.headers, data=json.dumps(payload))
        return response.json()
    
    def get_transactions(self, card_id, page=1, start_date=None, end_date=None):
        """Get card transactions"""
        url = f"{self.base_url}/cards/get_card_transactions?card_id={card_id}&page={page}"
        
        if start_date:
            url += f"&start_date={start_date}"
        if end_date:
            url += f"&end_date={end_date}"
        
        response = requests.get(url, headers=self.headers)
        return response.json()
    
    def freeze_card(self, card_id):
        """Freeze a card"""
        url = f"{self.base_url}/cards/freeze_card?card_id={card_id}"
        response = requests.patch(url, headers=self.headers)
        return response.json()
    
    def unfreeze_card(self, card_id):
        """Unfreeze a card"""
        url = f"{self.base_url}/cards/unfreeze_card?card_id={card_id}"
        response = requests.patch(url, headers=self.headers)
        return response.json()


# Usage Example
if __name__ == "__main__":
    import time
    
    # Initialize client
    client = BridgeCardClient(
        access_token="at_test_YOUR_TOKEN",
        secret_key="sk_test_YOUR_SECRET",
        sandbox=True
    )
    
    # 1. Register cardholder
    print("Registering cardholder...")
    cardholder_response = client.register_cardholder(
        first_name="John",
        last_name="Doe",
        email="[email protected]",
        phone="08122277789",
        address={
            "address": "9 Jibowu Street",
            "city": "Aba North",
            "state": "Abia",
            "country": "Nigeria",
            "postal_code": "1000242",
            "house_no": "13"
        },
        identity={
            "id_type": "NIGERIAN_BVN_VERIFICATION",
            "bvn": "22222222222222",
            "selfie_image": "https://example.com/selfie.jpg"
        },
        meta_data={"user_id": "test_user_001"}
    )
    
    if cardholder_response['status'] == 'success':
        cardholder_id = cardholder_response['data']['cardholder_id']
        print(f"✓ Cardholder created: {cardholder_id}")
        
        # 2. Create card
        print("\nCreating card...")
        card_response = client.create_card(
            cardholder_id=cardholder_id,
            card_limit="500000",  # $5,000 limit
            funding_amount="300",  # $3
            pin="1234"
        )
        
        if card_response['status'] == 'success':
            card_id = card_response['data']['card_id']
            print(f"✓ Card created: {card_id}")
            
            # 3. Get card details
            print("\nFetching card details...")
            card_details = client.get_card_details(card_id)
            print(f"✓ Card last 4: {card_details['data']['last_4']}")
            print(f"✓ Balance: ${int(card_details['data']['balance'])/100}")
            
            # 4. Fund card
            print("\nFunding card with $50...")
            fund_response = client.fund_card(card_id, 5000)  # $50
            print(f"✓ Funding initiated: {fund_response['message']}")
            
            # 5. Get transactions
            print("\nFetching transactions...")
            time.sleep(2)  # Wait a bit for transaction to process
            transactions = client.get_transactions(card_id)
            print(f"✓ Found {transactions['data']['meta']['total']} transactions")
            
        else:
            print(f"✗ Card creation failed: {card_response.get('message')}")
    else:
        print(f"✗ Cardholder registration failed: {cardholder_response.get('message')}")
```

### Node.js Full Implementation

```javascript
const axios = require('axios');
const AES256 = require('aes-everywhere');

class BridgeCardClient {
  constructor(accessToken, secretKey, sandbox = true) {
    this.accessToken = accessToken;
    this.secretKey = secretKey;
    this.baseUrl = 'https://issuecards.api.bridgecard.co/v1/issuing';
    if (sandbox) {
      this.baseUrl += '/sandbox';
    }
    
    this.headers = {
      'token': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }
  
  encryptPin(pin) {
    return AES256.encrypt(pin, this.secretKey);
  }
  
  async registerCardholder(data) {
    const url = `${this.baseUrl}/cardholder/register_cardholder_synchronously`;
    
    try {
      const response = await axios.post(url, data, { headers: this.headers });
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }
  
  async createCard(cardholderId, cardLimit = '500000', fundingAmount = '300', pin = '1234', metaData = {}) {
    const url = `${this.baseUrl}/cards/create_card`;
    
    const encryptedPin = this.encryptPin(pin);
    
    const payload = {
      cardholder_id: cardholderId,
      card_type: 'virtual',
      card_brand: 'Mastercard',
      card_currency: 'USD',
      card_limit: cardLimit,
      funding_amount: fundingAmount,
      pin: encryptedPin,
      transaction_reference: `create_${cardholderId}_${Date.now()}`,
      meta_data: metaData
    };
    
    try {
      const response = await axios.post(url, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }
  
  async getCardDetails(cardId) {
    const url = `${this.baseUrl}/cards/get_card_details?card_id=${cardId}`;
    
    try {
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }
  
  async fundCard(cardId, amount, transactionReference = null) {
    const url = `${this.baseUrl}/cards/fund_card_asynchronously`;
    
    const payload = {
      card_id: cardId,
      amount: amount.toString(),
      currency: 'USD',
      transaction_reference: transactionReference || `fund_${cardId}_${Date.now()}`
    };
    
    try {
      const response = await axios.patch(url, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }
  
  async getTransactions(cardId, page = 1) {
    const url = `${this.baseUrl}/cards/get_card_transactions?card_id=${cardId}&page=${page}`;
    
    try {
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }
}

// Usage Example
(async () => {
  const client = new BridgeCardClient(
    'at_test_YOUR_TOKEN',
    'sk_test_YOUR_SECRET',
    true
  );
  
  // 1. Register cardholder
  console.log('Registering cardholder...');
  const cardholderData = {
    first_name: 'John',
    last_name: 'Doe',
    email_address: '[email protected]',
    phone: '08122277789',
    address: {
      address: '9 Jibowu Street',
      city: 'Aba North',
      state: 'Abia',
      country: 'Nigeria',
      postal_code: '1000242',
      house_no: '13'
    },
    identity: {
      id_type: 'NIGERIAN_BVN_VERIFICATION',
      bvn: '22222222222222',
      selfie_image: 'https://example.com/selfie.jpg'
    },
    meta_data: { user_id: 'test_user_001' }
  };
  
  const cardholderResponse = await client.registerCardholder(cardholderData);
  
  if (cardholderResponse.status === 'success') {
    const cardholderId = cardholderResponse.data.cardholder_id;
    console.log(`✓ Cardholder created: ${cardholderId}`);
    
    // 2. Create card
    console.log('\nCreating card...');
    const cardResponse = await client.createCard(cardholderId);
    
    if (cardResponse.status === 'success') {
      const cardId = cardResponse.data.card_id;
      console.log(`✓ Card created: ${cardId}`);
      
      // 3. Get card details
      console.log('\nFetching card details...');
      const cardDetails = await client.getCardDetails(cardId);
      console.log(`✓ Card last 4: ${cardDetails.data.last_4}`);
      console.log(`✓ Balance: $${parseInt(cardDetails.data.balance) / 100}`);
    }
  }
})();
```

---

## Error Handling

### Common Error Codes

| HTTP Code | Error Type | Description | Solution |
|-----------|------------|-------------|----------|
| 200 | Success | Request successful | - |
| 201 | Created | Resource created successfully | - |
| 202 | Accepted | Request accepted, processing async | Listen to webhook |
| 400 | Bad Request | Invalid parameters or data | Check request payload |
| 401 | Unauthorized | Invalid or missing token | Verify API key |
| 403 | Forbidden | Account setup incomplete | Contact support |
| 420 | Rate Limited | Too many requests | Wait and retry |
| 451 | Blacklisted | User/account blacklisted | Contact support |
| 504 | Gateway Timeout | Request timeout or server error | Retry request |

### Common Error Messages

#### Cardholder Errors
```json
{"message": "Invalid firstname, a valid name should have a minimum of 3 letters"}
{"message": "Invalid BVN, a valid BVN is 12 digits long"}
{"message": "A cardholder already exists with this BVN"}
{"message": "Invalid cardholder ID, there's no cardholder with this ID."}
{"message": "This cardholder has not had their ID verified yet and so cannot be issued a card."}
```

#### Card Errors
```json
{"message": "Please top up your USD issuing wallet, you have insufficient balance"}
{"message": "This card can only hold a maximum balance of 5000 USD at a time."}
{"message": "Invalid card ID, there's no card with this ID."}
{"message": "This card type is currently unavailable, but we're working on it."}
```

#### Transaction Errors
```json
{"message": "This transaction reference exists please enter another reference"}
{"message": "You can only fund a card once every 5 minutes, please try again later."}
{"message": "This card doesn't have enough funds to sufficient balance to perform this operation"}
```

### Error Handling Best Practices

```python
def safe_api_call(func):
    """Decorator for handling API errors"""
    def wrapper(*args, **kwargs):
        try:
            response = func(*args, **kwargs)
            
            if response.get('status') == 'success':
                return response
            else:
                # Handle API error
                error_message = response.get('message', 'Unknown error')
                print(f"API Error: {error_message}")
                return None
                
        except requests.exceptions.ConnectionError:
            print("Connection error. Please check your internet.")
            return None
        except requests.exceptions.Timeout:
            print("Request timeout. Please try again.")
            return None
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return None
    
    return wrapper
```

---

## Rate Limits

| Endpoint | Rate Limit | Per |
|----------|------------|-----|
| `register_cardholder` | 1 request | Per cardholder per minute |
| `get_card_details` | 1 request | Per card per 3 seconds |
| `get_card_balance` | 1 request | Per card per 3 seconds |
| `get_card_transactions` | 1 request | Per card per page per 3 seconds |
| `fund_card` | 1 request | Per card per 5 minutes |
| `unload_card` | 1 request | Per card per 5 minutes |

---

## Testing Checklist

### Phase 1: Setup
- [ ] Create Bridge Card account
- [ ] Get sandbox API keys (access token & secret key)
- [ ] Install required encryption library
- [ ] Set up development environment

### Phase 2: Wallet & Cardholder
- [ ] Fund sandbox issuing wallet ($100,000 test funds)
- [ ] Test cardholder registration (synchronous)
- [ ] Test cardholder registration (asynchronous)
- [ ] Get cardholder details
- [ ] Test with different identity types (Nigeria, Ghana, etc.)

### Phase 3: Card Creation
- [ ] Encrypt card PIN successfully
- [ ] Create virtual card with $5,000 limit
- [ ] Create virtual card with $10,000 limit
- [ ] Get card details (non-sensitive endpoint)
- [ ] Get card details (sensitive endpoint for full card data)
- [ ] Verify card balance

### Phase 4: Card Operations
- [ ] Fund card with $50
- [ ] Check transaction status (verify funding successful)
- [ ] Mock debit transaction (sandbox only)
- [ ] Get card transactions (page 1)
- [ ] Get card balance
- [ ] Freeze card
- [ ] Verify card is frozen (is_active = false)
- [ ] Unfreeze card
- [ ] Update card PIN
- [ ] Unload $20 from card
- [ ] Get all cards for cardholder

### Phase 5: Webhooks
- [ ] Set up webhook endpoint on your server
- [ ] Configure webhook URL in dashboard
- [ ] Test cardholder verification webhook
- [ ] Test card creation webhook
- [ ] Test card credit webhook
- [ ] Test card debit webhook
- [ ] Test card decline webhook
- [ ] Implement webhook signature verification

### Phase 6: Error Handling
- [ ] Test with invalid cardholder ID
- [ ] Test with insufficient wallet balance
- [ ] Test rate limiting (multiple rapid requests)
- [ ] Test with duplicate transaction reference
- [ ] Test funding card beyond maximum limit
- [ ] Test unloading more than available balance

### Phase 7: Edge Cases
- [ ] Test with minimum funding amount ($3 for $5k card)
- [ ] Test card with no transactions (3-month inactivity)
- [ ] Test 15 consecutive declined transactions
- [ ] Test card deletion
- [ ] Test getting transactions with date filters
- [ ] Test pagination for transaction history

### Phase 8: Production Readiness
- [ ] Switch to production API keys
- [ ] Update base URL to production
- [ ] Test with real KYC documents
- [ ] Implement proper error logging
- [ ] Set up monitoring and alerts
- [ ] Secure API keys in environment variables
- [ ] Implement retry logic for failed requests
- [ ] Test webhook payload verification

---

## Additional Resources

### Helper Functions

#### Generate Unique Transaction Reference
```python
import uuid
import time

def generate_transaction_ref(prefix="txn"):
    """Generate unique transaction reference"""
    timestamp = int(time.time())
    unique_id = str(uuid.uuid4())[:8]
    return f"{prefix}_{timestamp}_{unique_id}"
```

#### Validate Card Amount
```python
def validate_card_amount(amount_cents, card_limit):
    """Validate funding amount doesn't exceed card limit"""
    max_balance = 500000 if card_limit == "500000" else 1000000
    
    if amount_cents > max_balance:
        return False, f"Amount exceeds maximum card balance of ${max_balance/100}"
    
    return True, "Valid amount"
```

#### Parse Transaction Date
```python
from datetime import datetime

def parse_transaction_date(date_string):
    """Parse transaction date from Bridge Card format"""
    # Format: "2022-09-28 23:10:45"
    return datetime.strptime(date_string, "%Y-%m-%d %H:%M:%S")
```

### Postman Collection

Import this into Postman for quick testing:

```json
{
  "info": {
    "name": "Bridge Card API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://issuecards.api.bridgecard.co/v1/issuing/sandbox"
    },
    {
      "key": "access_token",
      "value": "at_test_YOUR_TOKEN"
    }
  ]
}
```

---

## Important Notes

1. **Card Deletion Policy:**
   - Cards with 3 months of inactivity are automatically deleted
   - Cards with 15 consecutive declined transactions (insufficient balance) are deleted
   - You receive webhook notification before deletion

2. **Maintenance Fee:**
   - Minimum funding ($3 or $4) is held for monthly maintenance
   - This is included in `balance` but not in `available_balance`

3. **Card Limits:**
   - $5,000 cards can hold maximum $5,000
   - $10,000 cards can hold maximum $10,000
   - Cannot fund beyond these limits

4. **Transaction Timing:**
   - All timestamps are in GMT timezone
   - Convert to your timezone as needed

5. **Security:**
   - Never store full card details on your server (unless PCI-DSS certified)
   - Always use encrypted PIN
   - Verify webhook signatures
   - Keep API keys secure

---

## Support

- **Documentation:** https://docs.bridgecard.co/
- **Dashboard:** https://bridgecard.co/dashboard
- **Register:** https://bridgecard.cards/register
- **Contact:** Use your dedicated support channel in dashboard

---

## Quick Start Commands

```bash
# Python Setup
pip install requests aes-everywhere

# Node.js Setup
npm install axios aes-everywhere

# PHP Setup
composer require guzzlehttp/guzzle mervick/aes-everywhere

# Test API Connection
curl https://issuecards.api.bridgecard.co/v1/issuing/sandbox/health
```

---

**Last Updated:** October 2025  
**API Version:** v1  
**Document Version:** 1.0.0