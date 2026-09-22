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
// Optional query parameters:
//
//   ?minX=-50
//   ?maxX=50
//   ?minY=-50
//   ?maxY=50
//
// Returns all parcels within the requested coordinate bounds.
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

        const parsed = Number(value);

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
       * SERIALIZE PARCELS
       * =====================================================
       *
       * Prisma Decimal values should be converted before
       * sending them to the browser.
       *
       * Project data is intentionally lightweight.
       * The full project scene should be loaded separately
       * through /api/projects/:id.
       */

      const serializedParcels =
        parcels.map(
          (parcel) => ({
            id: parcel.id,

            estateId:
              parcel.estateId,

            x: parcel.x,

            y: parcel.y,

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

            description:
              parcel.description,

            blockchainAddress:
              parcel.blockchainAddress,

            tokenId:
              parcel.tokenId,

            project:
              parcel.project
                ? {
                    id:
                      parcel.project.id,

                    name:
                      parcel.project.name,

                    description:
                      parcel.project.description,

                    template:
                      parcel.project.template,

                    slug:
                      parcel.project.slug,

                    publishedAt:
                      parcel.project.publishedAt,
                  }
                : null,
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