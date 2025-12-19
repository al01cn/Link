/*
  Warnings:

  - You are about to drop the column `message` on the `Log` table. All the data in the column will be lost.
  - Made the column `messageKey` on table `Log` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "category" TEXT NOT NULL DEFAULT 'general',
    "messageKey" TEXT NOT NULL,
    "messageParams" TEXT,
    "details" TEXT,
    "stackTrace" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "requestId" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "username" TEXT,
    "action" TEXT,
    "resource" TEXT,
    "method" TEXT,
    "endpoint" TEXT,
    "statusCode" INTEGER,
    "responseTime" INTEGER,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Log" ("createdAt", "details", "id", "ip", "messageKey", "messageParams", "type", "userAgent") SELECT "createdAt", "details", "id", "ip", "messageKey", "messageParams", "type", "userAgent" FROM "Log";
DROP TABLE "Log";
ALTER TABLE "new_Log" RENAME TO "Log";
CREATE INDEX "Log_type_createdAt_idx" ON "Log"("type", "createdAt");
CREATE INDEX "Log_level_createdAt_idx" ON "Log"("level", "createdAt");
CREATE INDEX "Log_category_createdAt_idx" ON "Log"("category", "createdAt");
CREATE INDEX "Log_riskLevel_createdAt_idx" ON "Log"("riskLevel", "createdAt");
CREATE INDEX "Log_ip_createdAt_idx" ON "Log"("ip", "createdAt");
CREATE INDEX "Log_userId_createdAt_idx" ON "Log"("userId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
