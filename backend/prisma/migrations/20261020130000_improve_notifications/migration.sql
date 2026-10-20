ALTER TABLE "NotificationLog"
ADD COLUMN "ticketId" TEXT,
ADD COLUMN "maintenanceDueAt" TIMESTAMP(3);

ALTER TABLE "NotificationLog"
ADD CONSTRAINT "NotificationLog_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "NotificationLog_resolution_createdAt_idx"
ON "NotificationLog"("resolution", "createdAt");

CREATE UNIQUE INDEX "NotificationLog_ticketId_maintenanceDueAt_key"
ON "NotificationLog"("ticketId", "maintenanceDueAt");
