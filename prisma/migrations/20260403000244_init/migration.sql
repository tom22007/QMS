-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "Document" (
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
    "notes" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "priority" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "linkedDocId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "category" TEXT NOT NULL DEFAULT '',
    "completedBy" TEXT,
    "completedAt" TEXT
);

-- CreateTable
CREATE TABLE "ChangeControlStep" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "crfNumber" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending'
);

-- CreateTable
CREATE TABLE "ImplementationAction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "crfNumber" TEXT NOT NULL,
    "actionNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "targetDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending'
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "docId" TEXT NOT NULL,
    "signerNumber" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "completedAt" TEXT
);

-- CreateTable
CREATE TABLE "AuditChecklistItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "linkedDocId" TEXT,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checkedBy" TEXT,
    "checkedAt" TEXT
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValue" TEXT NOT NULL DEFAULT '',
    "newValue" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "KeyDate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "milestone" TEXT NOT NULL,
    "date" TEXT,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GoverningSop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sopNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "revision" TEXT,
    "effectiveDate" TEXT,
    "aligned" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Document_docId_key" ON "Document"("docId");
