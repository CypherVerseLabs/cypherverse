const TEST_SYSTEM_SELLER_EMAIL = "marketplace@cypherverse.test";

export type MarketplaceEnvironment = {
  NODE_ENV?: string;
  MARKETPLACE_SYSTEM_SELLER_EMAIL?: string;
};

/**
 * Resolve the system seller without allowing Production to fall back
 * to the TEST identity. The configured Production email must identify
 * an already-provisioned User; this helper never creates or mutates users.
 */
export function getPrimaryMarketplaceSellerEmail(
  env: MarketplaceEnvironment = process.env
): string {
  const configuredEmail = env.MARKETPLACE_SYSTEM_SELLER_EMAIL?.trim();

  if (env.NODE_ENV === "production") {
    if (!configuredEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail)) {
      throw new Error(
        "MARKETPLACE_SYSTEM_SELLER_EMAIL must identify an existing Production system seller."
      );
    }

    if (configuredEmail.toLowerCase().endsWith(".test")) {
      throw new Error(
        "The TEST marketplace seller identity cannot be used in Production."
      );
    }

    return configuredEmail;
  }

  return configuredEmail || TEST_SYSTEM_SELLER_EMAIL;
}
