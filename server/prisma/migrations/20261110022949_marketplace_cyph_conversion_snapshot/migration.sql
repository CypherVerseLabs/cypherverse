-- AlterTable
ALTER TABLE "MarketplacePayment" ADD COLUMN     "conversionRate" DECIMAL(12,8),
ADD COLUMN     "sourceAmount" DECIMAL(12,2),
ADD COLUMN     "sourceCurrency" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(24,8);
