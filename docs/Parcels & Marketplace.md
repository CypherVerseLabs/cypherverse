Cypherverse Parcels & Marketplace
Overview
The Cypherverse parcel system provides the foundation for owning, reserving, buying, and listing virtual parcels.

The system is split between the Next.js frontend and the CyBuilder API backend.

┌──────────────────────────┐
│      Cypherverse UI      │
│                          │
│  ParcelPanel             │
│  ParcelLayer             │
│  useParcels()            │
│  useMarketplace()        │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   Marketplace Services   │
│                          │
│  marketplace.ts          │
│  useMarketplace.ts       │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│       authFetch()        │
│                          │
│ Authorization: Bearer    │
│ <JWT>                    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   CyBuilder API :5000    │
│                          │
│ Express                  │
│ Marketplace Router       │
│ Parcel Router            │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│    Parcel Store / DB     │
│                          │
│ Prisma / PostgreSQL      │
└──────────────────────────┘

The backend is authoritative for parcel ownership, reservation state, listings, and marketplace transactions.

1. Parcel System
The parcel system represents virtual land inside Cypherverse.

A parcel contains information such as:

Parcel ID
Estate ID
Coordinates
Name
Description
Status
Price
Ownership information
The frontend parcel state is responsible for displaying the current parcel data, while the backend determines the authoritative state.

Parcel statuses
The marketplace currently recognizes these primary statuses:

available
owned
reserved
for-sale

Available
The parcel is available for reservation.

The UI displays:

Reserve Parcel

Reserved
The parcel is currently reserved.

The UI should prevent another reservation from being created.

Owned
The parcel belongs to the current owner.

The UI displays:

List for Sale

For Sale
The parcel has an active marketplace listing.

The UI displays:

Buy Parcel

2. Parcel Panel
The primary parcel UI is:

src/parcels/ParcelPanel.tsx

The panel is responsible for displaying:

Parcel name
Parcel ID
Estate ID
Coordinates
Status
Price
Description
Marketplace action state
Marketplace errors
Buy button
Reserve button
List button
The panel does not directly communicate with the backend.

Instead:

ParcelPanel
    ↓
callback
    ↓
useMarketplace()
    ↓
marketplace service

This keeps UI state separate from backend communication.

3. Marketplace Architecture
Marketplace functionality is divided into two layers.

marketplace.ts
This file handles communication with the backend.

It provides:

useMarketplaceService()

It must not export a default marketplace object.

The reason is that the marketplace service requires:

useAuthContext()

and React hooks cannot be called from a normal module-level singleton.

The correct architecture is:

useMarketplace()
       ↓
useMarketplaceService()
       ↓
useAuthContext()
       ↓
authFetch()

Do not use:

import marketplace from "./marketplace";

because marketplace.ts no longer provides a default export.

4. Marketplace Barrel Export
The marketplace module exports are:

export {
  default as useMarketplace,
} from "./useMarketplace";

export {
  useMarketplaceService,
} from "./marketplace";

export type {
  MarketplaceAction,
  MarketplaceResult,
  MarketplaceSuccess,
  MarketplaceFailure,
  MarketplaceService,
} from "./types";

This keeps the public marketplace API centralized.

5. useMarketplace()
The marketplace React hook is:

src/marketplace/useMarketplace.ts

Its responsibilities are:

Track the parcel currently being processed
Track the current marketplace action
Track marketplace errors
Prevent duplicate marketplace operations
Call the authenticated marketplace service
Expose marketplace operations to UI components
The hook exposes:

actionParcelId
actionType
actionError

buyParcel()
reserveParcel()
listParcel()

clearAction()

6. Marketplace Actions
The supported marketplace actions are:

buy
reserve
list

The backend also supports:

release

for releasing reservations.

7. Buy Parcel
Frontend service endpoint:

POST /api/marketplace/parcels/:id/buy

The frontend calls:

marketplace.buyParcel(parcel)

The backend then calls:

buyParcel(
  parcelId,
  userId
)

The authenticated user is taken from:

req.user?.id

The client does not provide the owner/user ID manually.

This is important for security.

8. Reserve Parcel
Frontend service endpoint:

POST /api/marketplace/parcels/:id/reserve

The frontend calls:

marketplace.reserveParcel(parcel)

The backend route requires authentication:

router.post(
  "/parcels/:id/reserve",
  authenticateToken,
  async (...)
)

The backend obtains the authenticated user:

const userId =
  req.user?.id;

Then:

await reserveParcel(
  parcelId,
  userId
);

The backend remains responsible for deciding whether the parcel can actually be reserved.

9. Release Reservation
Backend endpoint:

POST /api/marketplace/parcels/:id/release

The backend calls:

releaseParcelReservation(
  parcelId,
  userId
);

This allows the reservation owner to release the reservation.

10. List Parcel
Frontend endpoint:

POST /api/marketplace/parcels/:id/list

Request body:

{
  "price": "19.99"
}

Prices intentionally remain strings.

For example:

"1"
"1.5"
"1.50"
"9999999999.99"

The reason is to avoid unnecessary JavaScript floating-point conversion before the value reaches the backend.

The backend validates the price before creating the listing.

11. Price Validation
The marketplace accepts positive prices with up to two decimal places.

Valid:

1
1.5
1.50
19.99
9999999999.99

Invalid:

0
-1
1.234
1e5
abc

Frontend validation exists for immediate UI feedback.

Backend validation remains authoritative.

Never rely exclusively on frontend validation.

12. Active Marketplace Listings
The backend exposes:

GET /api/marketplace/listings

The response contains active parcel listings.

Prices are converted to strings before being returned:

price:
  listing.price.toString()

The associated parcel price is also normalized:

price:
  listing.parcel.price
    ? listing.parcel.price.toString()
    : null

This keeps decimal values consistent between the database and frontend.

13. Authentication
Marketplace operations require authentication.

The frontend uses:

authFetch()

instead of plain:

fetch()

authFetch() is responsible for:

Checking for a JWT
Adding the authorization header
Sending credentials
Detecting expired authentication
Refreshing the token
Retrying the request
Clearing authentication state if refresh fails
The authorization header is:

Authorization: Bearer <JWT>

14. API URL Resolution
The frontend and backend run on different development servers.

Typical development setup:

Next.js frontend
http://localhost:3000

CyBuilder API
http://localhost:5000

Therefore API requests must reach port 5000.

The API base URL is:

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

authFetch() resolves relative API paths.

For example:

authFetch(
  "/api/marketplace/parcels/123/reserve"
)

becomes:

http://localhost:5000/api/marketplace/parcels/123/reserve

This prevents the browser from accidentally sending the request to:

http://localhost:3000/api/...

15. Authentication Request Flow
The normal request flow is:

authFetch()
      ↓
JWT exists?
      ↓
Add Authorization header
      ↓
fetch(API_URL + path)
      ↓
Response

If the API returns:

401 Unauthorized

then:

401
 ↓
refreshToken()
 ↓
new JWT
 ↓
retry request

If refreshing fails:

clearAuthState()
 ↓
Session expired.

16. Safe API Response Parsing
Marketplace requests use a response helper to prevent errors caused by HTML responses.

For example, if a frontend accidentally receives:

<!DOCTYPE html>
<html>
...

calling:

response.json()

could produce:

Unexpected token '<'

The marketplace service therefore checks the response content type first.

JSON responses are parsed normally.

Non-JSON responses are converted into an error object.

17. Backend Marketplace Router
The marketplace router currently exposes:

GET    /api/marketplace/listings

POST   /api/marketplace/parcels/:id/buy

POST   /api/marketplace/parcels/:id/reserve

POST   /api/marketplace/parcels/:id/list

POST   /api/marketplace/parcels/:id/release

Authenticated operations use:

authenticateToken

The active listings endpoint is currently public.

18. Backend Marketplace Errors
The backend translates business logic errors into HTTP responses.

Buy errors
PARCEL_NOT_FOR_SALE
ACTIVE_LISTING_NOT_FOUND
CANNOT_BUY_OWN_PARCEL

These become 409 Conflict responses.

Example:

{
  "error": "This parcel is not currently for sale."
}

Reservation errors
PARCEL_NOT_AVAILABLE
PARCEL_ALREADY_RESERVED

These become 409 Conflict responses.

Example:

{
  "error": "This parcel is already reserved."
}

Listing errors
PARCEL_NOT_OWNED
PARCEL_NOT_LISTABLE
INVALID_PARCEL_PRICE

These are translated into appropriate 403, 409, or 400 responses.

19. Frontend Marketplace Error Handling
The frontend preserves backend errors.

For example:

409

with:

{
  "error": "This parcel is already reserved."
}

becomes:

actionError:
  "This parcel is already reserved."

The ParcelPanel displays this to the user.

20. Marketplace Processing State
When an action starts:

actionParcelId = parcel.id
actionType = "reserve"

The UI can therefore display:

Reserving...

Only the parcel currently being processed is considered busy.

This prevents accidental duplicate operations.

21. Duplicate Operation Protection
useMarketplace() prevents another marketplace operation from starting while one is already running.

For example:

Reserve Parcel
      ↓
request running
      ↓
Reserve button disabled
      ↓
request completes

This protects against rapid double-clicks and duplicate requests.

22. Parcel Refreshing
The marketplace service does not become the permanent owner of parcel state.

After a successful marketplace operation, the parcel system should refresh its data from:

GET /api/parcels

This is important because the backend is authoritative.

For example:

Reserve
   ↓
POST /api/marketplace/parcels/:id/reserve
   ↓
Backend updates parcel
   ↓
GET /api/parcels
   ↓
Frontend receives updated parcel
   ↓
ParcelPanel rerenders

This prevents stale marketplace state from becoming the source of truth.

23. Current Development Server
The backend is started with:

yarn server

This runs:

nodemon --watch . --ext ts --exec tsx ./index.ts

The API runs on:

http://localhost:5000

Expected startup message:

CyBuilder server running on port 5000

24. Useful Server Routes
Current API routes include:

GET    /
GET    /health

POST   /auth/nonce
POST   /auth/verify
POST   /auth/refresh
GET    /auth/me
POST   /auth/profile
POST   /auth/logout

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/publish

GET    /api/marketplace/listings

POST   /api/marketplace/parcels/:id/buy
POST   /api/marketplace/parcels/:id/reserve
POST   /api/marketplace/parcels/:id/list
POST   /api/marketplace/parcels/:id/release

POST   /api/ai

25. Testing the Marketplace
Before testing marketplace actions, make sure:

1. Backend is running on port 5000.
2. Frontend is running.
3. NEXT_PUBLIC_API_URL points to the backend.
4. User is authenticated.
5. Parcel data loads successfully.
6. Marketplace routes are mounted.

Start backend:

yarn server

Then watch the server console.

A reservation should produce something similar to:

API MARKETPLACE REQUEST:
POST /api/marketplace/parcels/<parcel-id>/reserve

A successful reservation should return an HTTP 200.

A business-rule failure should normally return 409.

An authentication problem should return 401.

An unexpected backend failure should return 500.

26. Debugging Checklist
If Reserve Parcel does nothing:

Check the browser console
Look for:

[Marketplace]

errors.

Check the backend console
Look for:

POST /api/marketplace/parcels/:id/reserve

If the request never reaches the backend
Check:

authFetch()
NEXT_PUBLIC_API_URL

If the request reaches the backend with 401
Check:

JWT
authenticateToken
refreshToken

If the request returns 409
The backend rejected the marketplace action because the parcel state does not permit it.

If the request returns 500
Inspect the backend parcelStore implementation.

If the request succeeds but the UI does not change
Check:

useParcels()
GET /api/parcels
ParcelLayer
ParcelPanel

The parcel data may not be refreshing after the marketplace operation.

27. Important Architectural Rules
Rule 1 — Backend owns marketplace state
Do not determine ownership or reservation validity solely from the frontend.

The backend decides.

Rule 2 — Do not use a module-level authenticated marketplace singleton
Do not do:

const marketplace = {
  ...
};

if that object requires useAuthContext().

Use:

useMarketplaceService()

inside React.

Rule 3 — Use authFetch() for authenticated marketplace operations
Use:

authFetch(...)

instead of:

fetch(...)

for:

buy
reserve
list
release

Rule 4 — Keep prices as strings
Do not unnecessarily convert prices to JavaScript numbers.

Prefer:

"19.99"

over:

19.99

when sending decimal currency values to the API.

Rule 5 — Keep parcel state in the parcel system
Marketplace operations return updated information, but useParcels() remains responsible for the application's parcel collection/state.

Rule 6 — Do not duplicate marketplace business logic in the UI
ParcelPanel should trigger actions.

It should not decide whether a parcel is actually purchasable or reservable beyond presentation logic.

28. Current Architecture Summary
                    ┌─────────────────┐
                    │   ParcelPanel   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │useMarketplace() │
                    └────────┬────────┘
                             │
                             ▼
                 ┌────────────────────────┐
                 │useMarketplaceService() │
                 └────────────┬───────────┘
                              │
                              ▼
                       ┌────────────┐
                       │ authFetch  │
                       └─────┬──────┘
                             │
                    Authorization: JWT
                             │
                             ▼
                    ┌─────────────────┐
                    │ CyBuilder API   │
                    │   :5000         │
                    └────────┬────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Marketplace Router  │
                  └──────────┬──────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  parcelStore    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ PostgreSQL/DB   │
                    └─────────────────┘

The key principle is:

UI displays state.
Hooks manage client state.
Services communicate with the API.
Auth handles authentication.
The backend enforces marketplace rules.
The database remains authoritative.

29. Files Involved
The main frontend files are:

src/parcels/types.ts
src/parcels/ParcelPanel.tsx
src/parcels/ParcelLayer.tsx
src/parcels/useParcels.ts

src/marketplace/types.ts
src/marketplace/marketplace.ts
src/marketplace/useMarketplace.ts
src/marketplace/index.ts

src/ideas/context/AuthContext.tsx

The main backend files are:

server/index.ts
server/routes/marketplaceRouter.ts
server/routes/parcelRouter.ts
server/middleware/authMiddleware.ts
server/stores/parcelStore.ts

Exact paths may vary depending on the current project structure.

30. Next Testing Goal
The first complete marketplace test should be:

Authenticated User
        ↓
Select available parcel
        ↓
Click "Reserve Parcel"
        ↓
POST /api/marketplace/parcels/:id/reserve
        ↓
authenticateToken
        ↓
reserveParcel(parcelId, userId)
        ↓
Database update
        ↓
200 response
        ↓
Refresh /api/parcels
        ↓
Parcel becomes reserved
        ↓
ParcelPanel displays "Reserved"

After reservation works, test:

Release reservation
        ↓
List owned parcel
        ↓
View active listing
        ↓
Purchase listed parcel
        ↓
Verify ownership changes
        ↓
Verify listing is no longer active

That sequence gives us an end-to-end test of the marketplace lifecycle.