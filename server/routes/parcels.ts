import {
  Router,
  Response,
} from "express";

import {
  authenticateToken,
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";

import {
  getParcels,
  getParcelById,
  getParcelsByOwnerId,
} from "../stores/parcelStore.js";

const router = Router();

// =========================================================
// GET /api/parcels
// =========================================================
//
// World parcel endpoint.
//
// Optional query parameters:
//
//   ?minX=0
//   ?maxX=2384
//   ?minY=0
//   ?maxY=2384
//
// The world can contain 22,500 parcels.
//
// This endpoint intentionally returns lightweight parcel
// data. Detailed owner/listing/project information should
// be loaded when an individual parcel is selected.
//
// =========================================================

router.get(
  "/",
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      /**
       * =====================================================
       * PARSE COORDINATE BOUNDS
       * =====================================================
       */

      const parseNumber = (
        value: unknown
      ): number | undefined => {
        if (
          typeof value !== "string" &&
          typeof value !== "number"
        ) {
          return undefined;
        }

        const parsed =
          Number(value);

        return Number.isFinite(parsed)
          ? parsed
          : undefined;
      };

      const minX =
        parseNumber(
          req.query.minX
        );

      const maxX =
        parseNumber(
          req.query.maxX
        );

      const minY =
        parseNumber(
          req.query.minY
        );

      const maxY =
        parseNumber(
          req.query.maxY
        );

      /**
       * =====================================================
       * VALIDATE BOUNDS
       * =====================================================
       */

      if (
        minX !== undefined &&
        maxX !== undefined &&
        minX > maxX
      ) {
        return res.status(400).json({
          error:
            "minX cannot be greater than maxX",
        });
      }

      if (
        minY !== undefined &&
        maxY !== undefined &&
        minY > maxY
      ) {
        return res.status(400).json({
          error:
            "minY cannot be greater than maxY",
        });
      }

      /**
       * =====================================================
       * LOAD PARCELS
       * =====================================================
       *
       * getParcels() performs the coordinate filtering
       * inside Prisma/database.
       */

      const parcels =
        await getParcels({
          minX,
          maxX,
          minY,
          maxY,
        });

      /**
       * =====================================================
       * LIGHTWEIGHT WORLD RESPONSE
       * =====================================================
       *
       * Do not send owner objects, listings, or full project
       * data for every parcel.
       *
       * The world only needs enough information to draw and
       * identify parcels.
       */

      const serializedParcels =
        parcels.map(
          (parcel) => ({
            id:
              parcel.id,

            estateId:
              parcel.estateId,

            x:
              parcel.x,

            y:
              parcel.y,

            status:
              parcel.status,

            ownerId:
              parcel.ownerId,

            price:
              parcel.price !== null
                ? Number(
                    parcel.price
                  )
                : null,

            name:
              parcel.name,
          })
        );

      /**
       * =====================================================
       * RESPONSE
       * =====================================================
       */

      return res.status(200).json({
        parcels:
          serializedParcels,

        count:
          serializedParcels.length,
      });

    } catch (error) {
      console.error(
        "Get parcels error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to load parcels",
      });
    }
  }
);

// =========================================================
// GET /api/parcels/owned
// =========================================================

router.get(
  "/owned",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const parcels =
        await getParcelsByOwnerId(
          req.user.id
        );

      return res.status(200).json({
        parcels,
      });

    } catch (error) {
      console.error(
        "Get owned parcels error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to load owned parcels",
      });
    }
  }
);

// =========================================================
// GET /api/parcels/:id
// =========================================================

router.get(
  "/:id",
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const parcelId =
        req.params.id;

      if (!parcelId) {
        return res.status(400).json({
          error:
            "Parcel ID is required",
        });
      }

      const parcel =
        await getParcelById(
          parcelId
        );

      if (!parcel) {
        return res.status(404).json({
          error:
            "Parcel not found",
        });
      }

      return res.status(200).json({
        parcel,
      });

    } catch (error) {
      console.error(
        "Get parcel error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to load parcel",
      });
    }
  }
);

// =========================================================
// EXPORT
// =========================================================

export default router;