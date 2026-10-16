CREATE TYPE "SubscriptionMode" AS ENUM ('READ_ONLY', 'FULL_BLOCK');

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "paidUntil" DATE NOT NULL,
    "graceDays" INTEGER NOT NULL DEFAULT 5,
    "monthlyValue" DECIMAL(10,2),
    "mode" "SubscriptionMode" NOT NULL DEFAULT 'READ_ONLY',
    "cancelledAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "method" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubscriptionPayment_externalId_key" ON "SubscriptionPayment"("externalId");
CREATE INDEX "SubscriptionPayment_subscriptionId_paidAt_idx" ON "SubscriptionPayment"("subscriptionId", "paidAt");

ALTER TABLE "SubscriptionPayment"
ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
