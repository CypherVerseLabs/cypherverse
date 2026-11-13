import type { NextFunction, Request, Response } from "express";

export type PaymentSimulationEnvironment = {
  NODE_ENV?: string;
  ENABLE_TEST_PAYMENT_SIMULATION?: string;
};

/**
 * Test-only payment creation and simulation must be explicitly enabled.
 * Production is denied regardless of the opt-in flag.
 */
export function isTestPaymentSimulationEnabled(
  env: PaymentSimulationEnvironment = process.env
): boolean {
  return (
    env.NODE_ENV !== "production" &&
    env.ENABLE_TEST_PAYMENT_SIMULATION === "true"
  );
}

export function requireTestPaymentSimulation(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isTestPaymentSimulationEnabled()) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  next();
}
