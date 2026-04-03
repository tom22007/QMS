-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "docId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "draftStatus" TEXT NOT NULL DEFAULT 'Draft',
    "signatureStatus" TEXT NOT NULL DEFAULT 'Not required',
    "adobeSignTags" BOOLEAN NOT NULL DEFAULT false,
    "signerCount" INTEGER NOT NULL DEFAULT 0,
    "dateIssued" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "archived" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Document" ("adobeSignTags", "dateIssued", "docId", "draftStatus", "filename", "folder", "id", "notes", "revision", "signatureStatus", "signerCount", "title") SELECT "adobeSignTags", "dateIssued", "docId", "draftStatus", "filename", "folder", "id", "notes", "revision", "signatureStatus", "signerCount", "title" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE UNIQUE INDEX "Document_docId_key" ON "Document"("docId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
