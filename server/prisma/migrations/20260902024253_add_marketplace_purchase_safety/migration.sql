-- CreateEnum
CREATE TYPE "MarketplaceOrderStatus" AS ENUM ('PENDING', 'PAYMENT_PROCESSING', 'PAID', 'GRANTED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "MarketplacePaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MarketplacePaymentEnvironment" AS ENUM ('TEST');

-- CreateEnum
CREATE TYPE "MarketplaceEntitlementStatus" AS ENUM ('GRANTED');

-- CreateTable
CREATE TABLE "MarketplaceOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "listingId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "MarketplaceOrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplacePayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerTransactionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "MarketplacePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "environment" "MarketplacePaymentEnvironment" NOT NULL DEFAULT 'TEST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "MarketplacePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplacePaymentEvent" (
    "id" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MarketplacePaymentStatus" NOT NULL,
    "environment" "MarketplacePaymentEnvironment" NOT NULL DEFAULT 'TEST',
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "MarketplacePaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "MarketplaceEntitlementStatus" NOT NULL DEFAULT 'GRANTED',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceIdempotencyKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "orderId" TEXT,
    "responseStatus" INTEGER,
    "responseJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceIdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketplaceOrder_userId_idx" ON "MarketplaceOrder"("userId");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_productId_idx" ON "MarketplaceOrder"("productId");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_listingId_idx" ON "MarketplaceOrder"("listingId");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_status_idx" ON "MarketplaceOrder"("status");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_createdAt_idx" ON "MarketplaceOrder"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplacePayment_providerTransactionId_key" ON "MarketplacePayment"("providerTransactionId");

-- CreateIndex
CREATE INDEX "MarketplacePayment_orderId_idx" ON "MarketplacePayment"("orderId");

-- CreateIndex
CREATE INDEX "MarketplacePayment_userId_idx" ON "MarketplacePayment"("userId");

-- CreateIndex
CREATE INDEX "MarketplacePayment_status_idx" ON "MarketplacePayment"("status");

-- CreateIndex
CREATE INDEX "MarketplacePayment_environment_idx" ON "MarketplacePayment"("environment");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplacePaymentEvent_providerEventId_key" ON "MarketplacePaymentEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "MarketplacePaymentEvent_providerTransactionId_idx" ON "MarketplacePaymentEvent"("providerTransactionId");

-- CreateIndex
CREATE INDEX "MarketplacePaymentEvent_orderId_idx" ON "MarketplacePaymentEvent"("orderId");

-- CreateIndex
CREATE INDEX "MarketplacePaymentEvent_userId_idx" ON "MarketplacePaymentEvent"("userId");

-- CreateIndex
CREATE INDEX "MarketplacePaymentEvent_processed_idx" ON "MarketplacePaymentEvent"("processed");

-- CreateIndex
CREATE INDEX "MarketplacePaymentEvent_createdAt_idx" ON "MarketplacePaymentEvent"("createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceEntitlement_userId_idx" ON "MarketplaceEntitlement"("userId");

-- CreateIndex
CREATE INDEX "MarketplaceEntitlement_productId_idx" ON "MarketplaceEntitlement"("productId");

-- CreateIndex
CREATE INDEX "MarketplaceEntitlement_orderId_idx" ON "MarketplaceEntitlement"("orderId");

-- CreateIndex
CREATE INDEX "MarketplaceEntitlement_status_idx" ON "MarketplaceEntitlement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceEntitlement_userId_productId_key" ON "MarketplaceEntitlement"("userId", "productId");

-- CreateIndex
CREATE INDEX "MarketplaceIdempotencyKey_userId_idx" ON "MarketplaceIdempotencyKey"("userId");

-- CreateIndex
CREATE INDEX "MarketplaceIdempotencyKey_orderId_idx" ON "MarketplaceIdempotencyKey"("orderId");

-- CreateIndex
CREATE INDEX "MarketplaceIdempotencyKey_createdAt_idx" ON "MarketplaceIdempotencyKey"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceIdempotencyKey_userId_operation_key_key" ON "MarketplaceIdempotencyKey"("userId", "operation", "key");

-- AddForeignKey
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Parcel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ParcelListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePayment" ADD CONSTRAINT "MarketplacePayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketplaceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePayment" ADD CONSTRAINT "MarketplacePayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePaymentEvent" ADD CONSTRAINT "MarketplacePaymentEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketplaceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePaymentEvent" ADD CONSTRAINT "MarketplacePaymentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePaymentEvent" ADD CONSTRAINT "MarketplacePaymentEvent_providerTransactionId_fkey" FOREIGN KEY ("providerTransactionId") REFERENCES "MarketplacePayment"("providerTransactionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceEntitlement" ADD CONSTRAINT "MarketplaceEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceEntitlement" ADD CONSTRAINT "MarketplaceEntitlement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Parcel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceEntitlement" ADD CONSTRAINT "MarketplaceEntitlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketplaceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceIdempotencyKey" ADD CONSTRAINT "MarketplaceIdempotencyKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceIdempotencyKey" ADD CONSTRAINT "MarketplaceIdempotencyKey_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketplaceOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
