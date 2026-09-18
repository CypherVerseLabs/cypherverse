1. Biggest issue: ParcelStatus doesn't match
Your frontend says:

export type ParcelStatus =
  | "available"
  | "owned"
  | "reserved"
  | "for_sale";

But the backend Prisma enum appears to use:

$Enums.ParcelStatus.for_sale

So your API/database likely produces:

"for_sale"

while the frontend expects:

"for_sale"

Pick one canonical value.

I strongly recommend using the backend/database value everywhere:

export type ParcelStatus =
  | "available"
  | "owned"
  | "reserved"
  | "for_sale";

Otherwise you'll eventually get bugs like:

parcel.status === "for_sale"

never matching the actual API response:

parcel.status === "for_sale"

2. release is missing from the frontend service
Your backend supports:

POST /api/marketplace/parcels/:id/release

and your types support:

type MarketplaceAction =
  | "buy"
  | "reserve"
  | "list"
  | "release";

But MarketplaceService only contains:

buyParcel()
reserveParcel()
listParcel()

There is no:

releaseParcel()

So the architecture is incomplete.

Add:

export interface MarketplaceService {
  buyParcel(
    parcel: Parcel
  ): Promise<MarketplaceResult>;

  reserveParcel(
    parcel: Parcel
  ): Promise<MarketplaceResult>;

  listParcel(
    parcel: Parcel,
    price: string
  ): Promise<MarketplaceResult>;

  releaseParcel(
    parcel: Parcel
  ): Promise<MarketplaceResult>;
}

And implement it in useMarketplaceService().

3. Your hook also needs releaseParcel
You currently have:

const buyParcel = ...
const reserveParcel = ...
const listParcel = ...

You should add the corresponding:

const releaseParcel = useCallback(
  async (
    parcel: Parcel
  ): Promise<MarketplaceResult> => {
    if (!parcel?.id) {
      const result: MarketplaceResult = {
        success: false,
        action: "release",
        error: "Parcel ID is required.",
      };

      setActionError(result.error);

      return result;
    }

    return runAction(
      parcel.id,
      "release",
      () =>
        marketplace.releaseParcel(parcel)
    );
  },
  [
    marketplace,
    runAction,
  ]
);

Then expose it:

return {
  actionParcelId,
  actionType,
  actionError,

  buyParcel,
  reserveParcel,
  listParcel,
  releaseParcel,

  clearAction,
};

4. ParcelActionType should probably include release
Currently:

export type ParcelActionType =
  | "buy"
  | "reserve"
  | "list";

But marketplace supports four actions.

Change to:

export type ParcelActionType =
  | "buy"
  | "reserve"
  | "list"
  | "release";

Otherwise you have two competing action types:

MarketplaceAction

and

ParcelActionType

where one knows about "release" and the other doesn't.

5. Your frontend Parcel type is missing important backend data
Your backend parcel contains things like:

blockchainAddress
tokenId

but frontend Parcel doesn't.

If the UI eventually needs blockchain/world ownership information, I'd add:

export interface Parcel {
  id: string;

  x: number;
  y: number;

  name?: string | null;
  description?: string | null;
  estateId?: string | null;

  status: ParcelStatus;

  price?: number | null;

  ownerId?: string | null;
  reservedBy?: string | null;

  blockchainAddress?: string | null;
  tokenId?: string | null;

  color?: string | null;

  metadata?: Record<string, unknown>;
}

More importantly, consider whether price should really be a number.

6. I would NOT use number for money
You correctly kept the listing input as:

price: string

That's good.

But your frontend Parcel says:

price?: number | null;

That can cause precision problems.

Since the backend uses Prisma Decimal, I'd make the API representation a string:

price?: string | null;

Then:

"1"
"1.50"
"9999999999.99"

remain exact.

This also matches what your marketplace endpoint already does:

price: listing.price.toString()

So I'd make the frontend consistent:

export interface Parcel {
  // ...

  price?: string | null;
}

7. Your backend updateParcel() has a bug
This is important.

You define:

data: {
  status?: ParcelStatus;
  ownerId?: string | null;
  ...
}

but when building the Prisma update, you never actually include:

data.status

You have:

...(data.ownerId !== undefined
  ? {
      ownerId: data.ownerId,
    }
  : {}),

but no:

...(data.status !== undefined
  ? {
      status: data.status,
    }
  : {}),

So callers can pass:

updateParcel(id, {
  status: "owned"
});

and the status won't change.

Add:

...(data.status !== undefined
  ? {
      status: data.status,
    }
  : {}),

8. Reservation ownership needs more attention
This is probably the most important marketplace logic issue.

You create:

await tx.parcelReservation.create({
  data: {
    parcelId,
    userId,
    expiresAt,
  },
});

but when someone calls reserveParcel() you only check:

if (activeReservation) {
  throw new Error(
    "PARCEL_ALREADY_RESERVED"
  );
}

That means even the same user cannot re-reserve their own reservation.

That may be intentional, but usually you'd want one of these behaviors:

return the existing reservation;
extend the reservation;
reject it with a specific "ALREADY_RESERVED_BY_YOU" error.
I'd explicitly handle it.

9. There is a race-condition concern in reservations
You're doing:

findUnique(parcel)

then:

deleteMany(expired)

then:

findFirst(activeReservation)

then:

create(reservation)

Two requests could potentially reach the reservation creation logic concurrently.

A database-level constraint is much safer.

For example, depending on your Prisma schema, consider enforcing one active reservation per parcel, or redesigning reservation state so the parcel itself owns the reservation.

At minimum, the database should be the final protection against double reservation.

10. releaseParcelReservation() can release an expired reservation
You currently search:

const reservation =
  await tx.parcelReservation.findFirst({
    where: {
      parcelId,
      userId,
    },

without:

expiresAt: {
  gt: new Date(),
}

Your comment says:

If the reservation has expired, it is also removed.

That's okay, but then you need to be careful about the parcel's current status.

Imagine:

reservation expires;
parcel still says reserved;
another process reserves it / changes state;
old user calls release.
Your function could potentially change the parcel back to:

available

even though its state has changed.

The state transition should be conditional on the parcel still being reserved.

11. You don't currently have a reservation expiration mechanism
This is subtle.

You delete expired reservations only when:

reserveParcel()

is called.

So after 15 minutes, the database can still contain:

parcel.status = reserved
reservation.expiresAt = yesterday

until another operation cleans it up.

You need either:

Option A — lazy expiration
Whenever reading a parcel, determine:

reservation.expiresAt <= now

and treat it as available.

Option B — cleanup job
Periodically:

delete expired reservations
update reserved parcels -> available

For a marketplace, I'd eventually implement a cleanup job.

12. Your GET /listings doesn't require authentication
You have:

router.get(
  "/listings",
  async (...)

while the other marketplace operations use:

authenticateToken

That may actually be correct if marketplace listings are publicly browsable.

If listings are supposed to be public, keep it.

If the marketplace is authenticated-only, add:

authenticateToken,

The important thing is to make that an intentional decision.

13. GET /listings doesn't need AuthenticatedRequest
You're doing:

async (
  _req: AuthenticatedRequest,
  res: Response
)

but the route isn't authenticated.

I'd use:

async (
  _req: Request,
  res: Response
)

and import:

import {
  Router,
  Request,
  Response,
} from "express";

This makes the contract clearer.

14. Your MarketplaceSuccess.listing is too loose
You have:

listing?: unknown;

That means the frontend loses all type safety.

I'd define an actual listing type.

For example:

export interface MarketplaceListing {
  id: string;
  parcelId: string;
  sellerId: string;
  price: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

Then:

export type MarketplaceSuccess = {
  success: true;
  action: MarketplaceAction;
  parcel?: Parcel;
  listing?: MarketplaceListing;
};

If your Prisma model has different fields, mirror the actual API response.

15. Your service response doesn't match your backend completely
For buy:

Backend returns:

{
  success: true,
  action: "buy",
  parcel
}

Your frontend allows:

listing?: unknown;

but buy doesn't return the listing.

That's fine because it's optional.

For reserve, same.

For list, backend returns:

{
  success: true,
  action: "list",
  listing
}

but your frontend service returns:

listing: data?.listing

without converting/normalizing anything.

That's okay if your backend is the canonical API serializer, but I'd explicitly type the API response.

16. You have a duplicated price validation layer
You validate price in:

useMarketplace().listParcel()

and again in:

useMarketplaceService().listParcel()

That's not necessarily wrong, but it is duplicated.

I'd keep validation in one shared function:

export function normalizeMarketplacePrice(
  value: string
): string {
  const price = value.trim();

  if (
    !/^\d+(\.\d{1,2})?$/.test(price) ||
    Number(price) <= 0
  ) {
    throw new Error(
      "Listing price must be a positive amount with at most two decimal places."
    );
  }

  return price;
}

Then both layers can use it.

The backend must still validate independently.

17. One architectural change I'd strongly recommend
Right now you have:

Parcel
   ↓
Marketplace hook
   ↓
Marketplace service
   ↓
API

That's good.

But don't put marketplace state into Parcel itself beyond the authoritative state:

status
price
ownerId

Things like:

actionParcelId
actionType
actionError

should stay in useMarketplace().

You've already mostly done this correctly.

18. Your server/index.ts is mostly wired correctly
This part is good:

app.use(
  "/api/marketplace",
  marketplaceRouter
);

combined with:

router.post(
  "/parcels/:id/buy",

produces:

POST /api/marketplace/parcels/:id/buy

which matches the frontend:

/api/marketplace/parcels/${parcel.id}/buy

Same for:

POST /api/marketplace/parcels/:id/reserve
POST /api/marketplace/parcels/:id/list
POST /api/marketplace/parcels/:id/release
GET  /api/marketplace/listings

So the route mounting itself looks correct.

19. One thing I would add: releaseParcel all the way through
Your current architecture should ultimately look like:

                    useMarketplace()
                           │
          ┌────────────────┼────────────────┐
          │                │                │
        buy()          reserve()          list()
          │                │                │
          └────────────────┼────────────────┘
                           │
                    runAction()
                           │
                useMarketplaceService()
                           │
        ┌──────────┬───────┼────────┬──────────┐
        ↓          ↓       ↓        ↓
      buy       reserve   list    release
        │          │       │        │
        └──────────┴───────┴────────┘
                           │
                       authFetch
                           │
                           ↓
                 /api/marketplace/*

And all four actions should be represented consistently in:

MarketplaceAction
ParcelActionType
MarketplaceService
useMarketplaceService()
useMarketplace()
ParcelLayerProps
backend routes
backend store

20. One more thing: your pasted files appear concatenated
You have what look like separate files pasted together:

// marketplace.ts

then:

import {
  useCallback,
  useState,
} from "react";

then later:

import type {
  Parcel,
} from "../parcels/types";

etc.

If these are literally in the same file, that's a problem. They should be separated approximately as:

src/
  marketplace/
    index.ts
    marketplace.ts
    useMarketplace.ts
    types.ts

  parcels/
    types.ts

Your index.ts then stays:

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

That's a clean public API.

What I'd fix now
In priority order:

Fix for-sale vs for_sale.
Add releaseParcel to the frontend.
Add "release" to ParcelActionType.
Fix updateParcel() so status actually updates.
Change marketplace money values to strings on the frontend.
Create a typed MarketplaceListing instead of unknown.
Harden reservation concurrency/expiration.
Decide intentionally whether listings are public.
Separate the files if the pasted code is actually one file.
The most immediate bug is the status mismatch. The most obvious missing feature is release. The most important backend concern is reservation concurrency/expiration.



