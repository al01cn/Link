/*
  Warnings:

  - The primary key for the `Admin` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ShortLink` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `VisitLog` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Admin" ("createdAt", "id", "isDefault", "password", "updatedAt", "username") SELECT "createdAt", "id", "isDefault", "password", "updatedAt", "username" FROM "Admin";
DROP TABLE "Admin";
ALTER TABLE "new_Admin" RENAME TO "Admin";
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");
CREATE TABLE "new_ShortLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "title" TEXT,
    "password" TEXT,
    "expiresAt" DATETIME,
    "requireConfirm" BOOLEAN NOT NULL DEFAULT false,
    "enableIntermediate" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShortLink" ("createdAt", "enableIntermediate", "expiresAt", "id", "originalUrl", "password", "path", "requireConfirm", "title", "updatedAt", "views") SELECT "createdAt", "enableIntermediate", "expiresAt", "id", "originalUrl", "password", "path", "requireConfirm", "title", "updatedAt", "views" FROM "ShortLink";
DROP TABLE "ShortLink";
ALTER TABLE "new_ShortLink" RENAME TO "ShortLink";
CREATE UNIQUE INDEX "ShortLink_path_key" ON "ShortLink"("path");
CREATE TABLE "new_VisitLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shortId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisitLog_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "ShortLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VisitLog" ("createdAt", "id", "ip", "referer", "shortId", "userAgent") SELECT "createdAt", "id", "ip", "referer", "shortId", "userAgent" FROM "VisitLog";
DROP TABLE "VisitLog";
ALTER TABLE "new_VisitLog" RENAME TO "VisitLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
