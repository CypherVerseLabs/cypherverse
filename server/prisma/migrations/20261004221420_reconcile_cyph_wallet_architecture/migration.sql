/*
  Warnings:

  - You are about to drop the `CyphAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CyphLedgerEntry` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sellerId` to the `MarketplaceOrder` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `currency` on the `MarketplacePayment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CyphTransactionType" AS ENUM ('ISSUANCE', 'TRANSFER', 'BURN', 'MARKETPLACE_PAYMENT', 'MARKETPLACE_REFUND', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CyphTransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "CyphIssuanceReason" AS ENUM ('STRIPE_PURCHASE', 'PROMOTIONAL', 'REWARD', 'ADMIN_GRANT', 'GENESIS');

-- CreateEnum
CREATE TYPE "CyphBurnReason" AS ENUM ('ADMIN_BURN', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "CyphAccount" DROP CONSTRAINT "CyphAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "CyphLedgerEntry" DROP CONSTRAINT "CyphLedgerEntry_accountId_fkey";

-- DropForeignKey
ALTER TABLE "CyphLedgerEntry" DROP CONSTRAINT "CyphLedgerEntry_userId_fkey";

-- DropIndex
DROP INDEX "Project_parcelId_idx";

-- AlterTable
ALTER TABLE "MarketplaceOrder" ADD COLUMN     "sellerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MarketplacePayment" ALTER COLUMN "externalTransactionId" DROP NOT NULL,
DROP COLUMN "currency",
ADD COLUMN     "currency" "MarketplaceCurrency" NOT NULL,
ALTER COLUMN "method" DROP DEFAULT;

-- DropTable
DROP TABLE "CyphAccount";

-- DropTable
DROP TABLE "CyphLedgerEntry";

-- CreateTable
CREATE TABLE "MarketplaceCYPHPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceCYPHPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CyphSupply" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "totalIssued" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "totalBurned" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "circulatingSupply" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CyphSupply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CyphWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "blockchainAddress" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CyphWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CyphTransaction" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "blockchainTxHash" TEXT,
    "fromWalletId" TEXT,
    "toWalletId" TEXT,
    "amount" DECIMAL(36,18) NOT NULL,
    "type" "CyphTransactionType" NOT NULL,
    "status" "CyphTransactionStatus" NOT NULL DEFAULT 'CONFIRMED',
    "referenceType" TEXT,
    "referenceId" TEXT,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "CyphTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CyphIssuance" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "reason" "CyphIssuanceReason" NOT NULL,
    "externalReferenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyphIssuance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CyphBurn" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "reason" "CyphBurnReason" NOT NULL,
    "externalReferenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyphBurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CyphTransfer" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "fromWalletId" TEXT NOT NULL,
    "toWalletId" TEXT NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyphTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceCYPHPayment_transactionId_key" ON "MarketplaceCYPHPayment"("transactionId");

-- CreateIndex
CREATE INDEX "MarketplaceCYPHPayment_walletId_idx" ON "MarketplaceCYPHPayment"("walletId");

-- CreateIndex
CREATE INDEX "MarketplaceCYPHPayment_createdAt_idx" ON "MarketplaceCYPHPayment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceCYPHPayment_orderId_key" ON "MarketplaceCYPHPayment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CyphWallet_userId_key" ON "CyphWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CyphWallet_blockchainAddress_key" ON "CyphWallet"("blockchainAddress");

-- CreateIndex
CREATE INDEX "CyphWallet_active_idx" ON "CyphWallet"("active");

-- CreateIndex
CREATE UNIQUE INDEX "CyphTransaction_transactionId_key" ON "CyphTransaction"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "CyphTransaction_blockchainTxHash_key" ON "CyphTransaction"("blockchainTxHash");

-- CreateIndex
CREATE UNIQUE INDEX "CyphTransaction_idempotencyKey_key" ON "CyphTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CyphTransaction_fromWalletId_idx" ON "CyphTransaction"("fromWalletId");

-- CreateIndex
CREATE INDEX "CyphTransaction_toWalletId_idx" ON "CyphTransaction"("toWalletId");

-- CreateIndex
CREATE INDEX "CyphTransaction_type_idx" ON "CyphTransaction"("type");

-- CreateIndex
CREATE INDEX "CyphTransaction_status_idx" ON "CyphTransaction"("status");

-- CreateIndex
CREATE INDEX "CyphTransaction_referenceType_referenceId_idx" ON "CyphTransaction"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "CyphTransaction_createdAt_idx" ON "CyphTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CyphIssuance_transactionId_key" ON "CyphIssuance"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "CyphIssuance_externalReferenceId_key" ON "CyphIssuance"("externalReferenceId");

-- CreateIndex
CREATE INDEX "CyphIssuance_walletId_idx" ON "CyphIssuance"("walletId");

-- CreateIndex
CREATE INDEX "CyphIssuance_reason_idx" ON "CyphIssuance"("reason");

-- CreateIndex
CREATE INDEX "CyphIssuance_createdAt_idx" ON "CyphIssuance"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CyphBurn_transactionId_key" ON "CyphBurn"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "CyphBurn_externalReferenceId_key" ON "CyphBurn"("externalReferenceId");

-- CreateIndex
CREATE INDEX "CyphBurn_walletId_idx" ON "CyphBurn"("walletId");

-- CreateIndex
CREATE INDEX "CyphBurn_reason_idx" ON "CyphBurn"("reason");

-- CreateIndex
CREATE INDEX "CyphBurn_createdAt_idx" ON "CyphBurn"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CyphTransfer_transactionId_key" ON "CyphTransfer"("transactionId");

-- CreateIndex
CREATE INDEX "CyphTransfer_fromWalletId_idx" ON "CyphTransfer"("fromWalletId");

-- CreateIndex
CREATE INDEX "CyphTransfer_toWalletId_idx" ON "CyphTransfer"("toWalletId");

-- CreateIndex
CREATE INDEX "CyphTransfer_createdAt_idx" ON "CyphTransfer"("createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_sellerId_idx" ON "MarketplaceOrder"("sellerId");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_currency_idx" ON "MarketplaceOrder"("currency");

-- AddForeignKey
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCYPHPayment" ADD CONSTRAINT "MarketplaceCYPHPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketplaceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCYPHPayment" ADD CONSTRAINT "MarketplaceCYPHPayment_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CyphWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCYPHPayment" ADD CONSTRAINT "MarketplaceCYPHPayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "CyphTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyphWallet" ADD CONSTRAINT "CyphWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyphTransaction" ADD CONSTRAINT "CyphTransaction_fromWalletId_fkey" FOREIGN KEY ("fromWalletId") REFERENCES "CyphWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyphTransaction" ADD CONSTRAINT "CyphTransaction_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "CyphWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyphIssuance" ADD CONSTRAINT "CyphIssuance_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CyphWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyphIssuance" ADD CONSTRAINT "CyphIssuance_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "CyphTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyphBurn" ADD CONSTRAINT "CyphBurn_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CyphWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyphBurn" ADD CONSTRAINT "CyphBurn_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "CyphTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyphTransfer" ADD CONSTRAINT "CyphTransfer_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "CyphTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyphTransfer" ADD CONSTRAINT "CyphTransfer_fromWalletId_fkey" FOREIGN KEY ("fromWalletId") REFERENCES "CyphWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyphTransfer" ADD CONSTRAINT "CyphTransfer_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "CyphWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "MarketplacePaymentEvent_providerTransactionId_idx" RENAME TO "MarketplacePaymentEvent_externalTransactionId_idx";
