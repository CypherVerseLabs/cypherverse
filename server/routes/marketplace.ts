import {
  Router,
  Response,
} from "express";

import {
  authenticateToken,
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";


import {
  reserveParcel,
  createParcelListing,
  releaseParcelReservation,
  getActiveParcelListings,
} from "../stores/parcelStore.js";



const router = Router();



/**
 * =========================================================
 * CREATE MARKETPLACE ORDER
 * =========================================================
 *
 * POST /api/marketplace/parcels/:id/buy
 *
 * IMPORTANT:
 * This endpoint creates the server-authoritative order.
 *
 * It does NOT directly transfer parcel ownership.
 * Ownership should only be granted after successful
 * payment processing.
 */




/**
 * =========================================================
 * RESERVE PARCEL
 * =========================================================
 *
 * POST /api/marketplace/parcels/:id/reserve
 */

router.post(
  "/parcels/:id/reserve",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const parcelId =
      req.params.id;

    const userId =
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!parcelId) {
      return res.status(400).json({
        error:
          "Parcel ID is required",
      });
    }

    try {
      const parcel =
        await reserveParcel(
          parcelId,
          userId
        );

      if (!parcel) {
        return res.status(404).json({
          error:
            "Parcel not found",
        });
      }

      return res.status(200).json({
        success: true,
        action: "reserve",
        parcel,
      });

    } catch (error) {
      console.error(
        "Reserve parcel error:",
        error
      );

      if (
        error instanceof Error
      ) {
        switch (
          error.message
        ) {
          case "PARCEL_NOT_AVAILABLE":
            return res.status(409).json({
              error:
                "This parcel is not currently available for reservation.",
            });

          case "PARCEL_ALREADY_RESERVED":
            return res.status(409).json({
              error:
                "This parcel is already reserved.",
            });
        }
      }

      return res.status(500).json({
        error:
          "Failed to reserve parcel",
      });
    }
  }
);


/**
 * =========================================================
 * LIST PARCEL
 * =========================================================
 *
 * POST /api/marketplace/parcels/:id/list
 *
 * Body:
 *
 * {
 *   "price": "19.99"
 * }
 */

router.post(
  "/parcels/:id/list",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const parcelId =
      req.params.id;

    const sellerId =
      req.user?.id;

    if (!sellerId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!parcelId) {
      return res.status(400).json({
        error:
          "Parcel ID is required",
      });
    }

    const rawPrice =
      req.body?.price;

    if (
      rawPrice === undefined ||
      rawPrice === null
    ) {
      return res.status(400).json({
        error:
          "Listing price is required",
      });
    }

    if (
      typeof rawPrice !==
        "string" &&
      typeof rawPrice !==
        "number"
    ) {
      return res.status(400).json({
        error:
          "Listing price must be a number or decimal string",
      });
    }

    const price =
      String(rawPrice).trim();

    /*
     * Decimal(12,2) validation.
     *
     * Allows:
     * 1
     * 1.5
     * 1.50
     * 9999999999.99
     *
     * Rejects:
     * 0
     * negative values
     * more than two decimals
     * scientific notation
     */

    if (
      !/^\d+(\.\d{1,2})?$/.test(
        price
      )
    ) {
      return res.status(400).json({
        error:
          "Listing price must be a positive amount with at most two decimal places.",
      });
    }

    if (
      Number(price) <= 0
    ) {
      return res.status(400).json({
        error:
          "Listing price must be greater than zero.",
      });
    }

    try {
      const listing =
        await createParcelListing(
          parcelId,
          sellerId,
          price
        );

      if (!listing) {
        return res.status(404).json({
          error:
            "Parcel not found",
        });
      }

      return res.status(200).json({
        success: true,
        action: "list",
        listing: {
          ...listing,

          price:
            listing.price.toString(),
        },
      });

    } catch (error) {
      console.error(
        "List parcel error:",
        error
      );

      if (
        error instanceof Error
      ) {
        switch (
          error.message
        ) {
          case "PARCEL_NOT_OWNED":
            return res.status(403).json({
              error:
                "You do not own this parcel.",
            });

          case "PARCEL_NOT_LISTABLE":
            return res.status(409).json({
              error:
                "This parcel cannot currently be listed.",
            });

          case "INVALID_PARCEL_PRICE":
            return res.status(400).json({
              error:
                "Invalid parcel price.",
            });
        }
      }

      return res.status(500).json({
        error:
          "Failed to list parcel",
      });
    }
  }
);


/**
 * =========================================================
 * RELEASE RESERVATION
 * =========================================================
 *
 * POST /api/marketplace/parcels/:id/release
 */

router.post(
  "/parcels/:id/release",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const parcelId =
      req.params.id;

    const userId =
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!parcelId) {
      return res.status(400).json({
        error:
          "Parcel ID is required",
      });
    }

    try {
      const parcel =
        await releaseParcelReservation(
          parcelId,
          userId
        );

      if (!parcel) {
        return res.status(404).json({
          error:
            "Reservation not found",
        });
      }

      return res.status(200).json({
        success: true,
        action: "release",
        parcel,
      });

    } catch (error) {
      console.error(
        "Release reservation error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to release reservation",
      });
    }
  }
);


/**
 * =========================================================
 * ACTIVE LISTINGS
 * =========================================================
 *
 * GET /api/marketplace/listings
 */

router.get(
  "/listings",
  async (
    _req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const listings =
        await getActiveParcelListings();

      return res.status(200).json({
  listings: listings.map(
    (listing) => ({
      ...listing,

      price:
        listing.price.toString(),

      parcel: {
        ...listing.parcel,

        price:
          listing.parcel.price !== null
            ? listing.parcel.price.toString()
            : null,
      },
    })
  ),
});


    } catch (error) {
      console.error(
        "Get marketplace listings error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to load marketplace listings",
      });
    }
  }
);


export default router;
