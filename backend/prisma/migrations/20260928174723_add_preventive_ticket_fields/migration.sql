-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'LEMBRETE_MANUTENCAO';
ALTER TYPE "NotificationType" ADD VALUE 'AGENDAMENTO';
ALTER TYPE "NotificationType" ADD VALUE 'TECNICO_ATRIBUIDO';
ALTER TYPE "NotificationType" ADD VALUE 'CHAMADO_CONCLUIDO';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "maintenanceReminderDays" INTEGER NOT NULL DEFAULT 7;

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "serviceTypeId" TEXT;

-- AlterTable
ALTER TABLE "ServiceType" ADD COLUMN     "maintenanceIntervalDays" INTEGER;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "isPreventiveMaintenance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maintenanceNextAt" TIMESTAMP(3),
ADD COLUMN     "maintenanceReturnDays" INTEGER;

-- CreateIndex
CREATE INDEX "NotificationLog_clientId_idx" ON "NotificationLog"("clientId");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
