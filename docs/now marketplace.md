Cypherverse Marketplace
Overview
The Cypherverse marketplace provides authenticated parcel marketplace operations.

The current implementation uses a server-authoritative order and test-payment flow.

The frontend does not determine the purchase price, ownership, or payment success.

The backend remains authoritative.

Current Marketplace Flow
The purchase flow is:

User clicks Buy
      ↓
useMarketplace()
      ↓
useMarketplaceService()
      ↓
POST /api/marketplace/orders
      ↓
createParcelOrderController
      ↓
createParcelOrder()
      ↓
MarketplaceOrder created
      ↓
Create payment
      ↓
Test payment confirmation
      ↓
Backend completes payment
      ↓
Ownership / entitlement processing

The important distinction is:

Creating an order is not the same as completing a purchase.

Frontend
Marketplace Types
src/.../marketplace/types.ts
Defines:

MarketplaceAction
MarketplacePurchaseOptions
MarketplacePurchase
MarketplaceOrder
MarketplaceSuccess
MarketplaceFailure
MarketplaceResult
MarketplaceService
The marketplace currently supports:

"buy"
"reserve"
"list"
"release"

Payment mode is currently:

"test"

Marketplace Hook
useMarketplace.ts
The hook provides the React state layer.

Responsibilities:

Track the active parcel
Track the active marketplace action
Track marketplace errors
Prevent duplicate browser operations
Generate idempotency keys
Call the authenticated marketplace service
The hook does not determine whether a purchase succeeded.

The backend remains authoritative.

Buy
buyParcel(parcel, options?)

The hook generates an idempotency key when one is not supplied.

Example:

parcel-buy-<parcelId>-<random-id>

The request is then sent through the marketplace service.

Marketplace Service
marketplace.ts
The service uses:

useAuthContext()

and:

authFetch()

All marketplace operations requiring authentication therefore use the application's authenticated request mechanism.

Create Marketplace Order
The frontend buy operation now calls:

POST /api/marketplace/orders

It does not call:

POST /api/marketplace/parcels/:id/buy

The request body is:

{
  "parcelId": "..."
}

The idempotency key is sent as:

Idempotency-Key: <unique-key>

The client does not send the price.

The backend determines the authoritative price from the active listing.

Backend
Authoritative Marketplace Routes
server/routes/marketplaceRoutes.ts
This is the authoritative marketplace API route file.

It provides:

Orders
POST /api/marketplace/orders
GET  /api/marketplace/orders
GET  /api/marketplace/orders/:orderId
POST /api/marketplace/orders/:orderId/cancel

Payments
POST /api/marketplace/orders/:orderId/payment
GET  /api/marketplace/payments/:paymentId

Test Payments
POST /api/marketplace/test/payments/:paymentId/confirm
POST /api/marketplace/test/payments/:paymentId/fail
POST /api/marketplace/test/payments/:paymentId/cancel

All routes in this router require authentication.

Marketplace Controllers
server/controllers/marketplaceController.ts
Controllers handle:

Authentication validation
Request parsing
Calling marketplace services
HTTP responses
Marketplace error mapping
The controller does not accept a client-supplied purchase price.

Create Order Controller
Endpoint:

POST /api/marketplace/orders

Body:

{
  "parcelId": "..."
}

Header:

Idempotency-Key: unique-client-key

The authenticated user is obtained from:

req.user?.id

The client does not provide userId.

The controller passes:

userId
parcelId
listingId
idempotencyKey

to the order service.

Marketplace Order Service
server/services/marketplaceOrderService.ts
This is the main server-authoritative order layer.

It determines:

Buyer
Parcel
Active listing
Listing owner
Price
Currency
Quantity
Order status
The client cannot override the authoritative price.

Marketplace Store
server/stores/marketplaceStore.ts
The marketplace store creates and retrieves marketplace orders.

The store creates an order using the active database listing price.

Conceptually:

Client
  ↓
parcelId
  ↓
Database
  ↓
Active listing
  ↓
Authoritative listing.price
  ↓
MarketplaceOrder.amount

The store does not:

Accept price from the client
Accept userId from the request body
Transfer parcel ownership
Mark the order paid
Grant an entitlement
Those operations belong to the later payment/completion flow.

Order Creation Rules
An order can only be created when:

The user is authenticated.
The parcel exists.
The parcel is currently for_sale.
The buyer does not already own the parcel.
An active listing exists.
The listing belongs to the parcel's owner.
The listing price is valid.
A conflicting pending/processing order does not already exist.
Authoritative Pricing
The client never sends the purchase price.

For a purchase:

Frontend
  ↓
parcelId only
  ↓
Backend
  ↓
Active listing
  ↓
listing.price
  ↓
MarketplaceOrder.amount

This prevents a malicious client from changing the purchase amount.

Idempotency
Purchases use an idempotency key.

Example:

parcel-buy-abc123-550e8400-e29b-41d4-a716-446655440000

The key protects against repeated purchase attempts caused by:

Double clicks
Network retries
Browser retry behavior
Repeated requests
The frontend generates the key.

The backend is responsible for enforcing idempotency.

Payment Flow
Order creation currently does not complete payment.

After an order is created:

POST /api/marketplace/orders/:orderId/payment

creates the payment record.

The backend determines the payment amount from the order.

The client does not provide the payment amount.

Test Payment Flow
The current milestone uses test payments.

Successful test payment:

POST /api/marketplace/test/payments/:paymentId/confirm

Failed test payment:

POST /api/marketplace/test/payments/:paymentId/fail

Cancelled test payment:

POST /api/marketplace/test/payments/:paymentId/cancel

These routes are intended for the test/sandbox environment.

They should not be exposed as production payment controls.

Important Security Rules
The frontend must never be treated as authoritative for:

User identity
Parcel ownership
Listing ownership
Purchase price
Payment success
Entitlement status
The backend determines these values.

The authenticated user comes from:

req.user?.id

The purchase amount comes from the database listing/order.

Error Handling
Marketplace errors use structured error codes.

Examples:

PARCEL_NOT_FOUND
PARCEL_NOT_FOR_SALE
ACTIVE_LISTING_NOT_FOUND
CANNOT_BUY_OWN_PARCEL
INVALID_LISTING_PRICE
ORDER_NOT_FOUND
ORDER_CANCELLED
ORDER_ALREADY_PAID
PAYMENT_NOT_FOUND
PAYMENT_ALREADY_PAID
PAYMENT_AMOUNT_MISMATCH

The controller maps these errors to appropriate HTTP status codes.

Typical marketplace responses include:

400  Invalid request
401  Authentication required
403  Resource not owned
404  Resource not found
409  Marketplace state conflict
500  Unexpected server error

Duplicate Legacy Buy Route
The older route:

POST /api/marketplace/parcels/:id/buy

was identified as a duplicate purchase endpoint.

The authoritative purchase API is now:

POST /api/marketplace/orders

The newer order/payment architecture should be used for marketplace purchases.

TypeScript Verification
After marketplace changes, verify the server with:

npx tsc --noEmit

A successful result with no output means TypeScript compilation passed.

Example:

PS C:\...\server> npx tsc --noEmit
PS C:\...\server>

Current Testing Checklist
1. Start the server
npm run dev

2. Start the frontend
Use the project's normal frontend development command.

3. Authenticate
Make sure the user is logged in.

4. Find a listed parcel
The parcel must:

exist
↓
be for_sale
↓
have an active listing
↓
belong to another user

5. Click Buy
The frontend should send:

POST /api/marketplace/orders

with:

{
  "parcelId": "..."
}

and:

Idempotency-Key: ...

6. Verify the order
The response should contain:

{
  "order": {
    "id": "...",
    "userId": "...",
    "productId": "...",
    "listingId": "...",
    "quantity": 1,
    "amount": "...",
    "currency": "USD",
    "status": "PENDING",
    "createdAt": "...",
    "updatedAt": "..."
  }
}

7. Verify ownership has NOT changed yet
Creating the order alone should not transfer the parcel.

8. Create the test payment
Use:

POST /api/marketplace/orders/:orderId/payment

9. Confirm the test payment
Use:

POST /api/marketplace/test/payments/:paymentId/confirm

10. Verify the final marketplace state
After successful payment processing, verify that the backend completes the intended purchase/entitlement flow.

Current Architecture
                         FRONTEND
                            │
                            ▼
                   useMarketplace()
                            │
                            ▼
                 useMarketplaceService()
                            │
                            ▼
                  authFetch("/api/...")
                            │
                            ▼
                         SERVER
                            │
                            ▼
              marketplaceRoutes.ts
                            │
                            ▼
            marketplaceController.ts
                            │
                            ▼
        marketplaceOrderService.ts
                            │
                            ▼
                  marketplaceStore.ts
                            │
                            ▼
                         Prisma
                            │
                            ▼
                       DATABASE

Payment continues through the marketplace payment service and test-payment controllers.

Current Milestone
The marketplace currently has the foundation required to test:

Authentication
Parcel listing
Parcel reservation
Reservation release
Server-authoritative order creation
Authoritative marketplace pricing
Idempotency
Marketplace payment creation
Test payment success
Test payment failure
Test payment cancellation
Order retrieval
Order cancellation
The immediate goal is testing the existing implementation, not adding another architectural layer.

Final Purchase Principle
The marketplace follows this rule:

CLIENT REQUEST
      ↓
"Buy this parcel"
      ↓
SERVER VALIDATES
      ↓
SERVER READS LISTING PRICE
      ↓
SERVER CREATES ORDER
      ↓
SERVER CREATES PAYMENT
      ↓
TEST PAYMENT PROCESSES
      ↓
SERVER DETERMINES SUCCESS
      ↓
SERVER COMPLETES PURCHASE

The browser requests the purchase.
The server decides the purchase.