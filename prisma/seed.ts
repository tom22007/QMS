import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const raw = fs.readFileSync(path.join(__dirname, "..", "seed-data.json"), "utf-8");
  const data = JSON.parse(raw);

  // Users
  for (const u of data.users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, password: hashed, role: u.role, name: u.name, title: u.title },
    });
  }

  // Documents
  for (const d of data.documents) {
    await prisma.document.upsert({
      where: { docId: d.docId },
      update: {},
      create: {
        docId: d.docId,
        title: d.title,
        revision: d.revision,
        folder: d.folder,
        filename: d.filename,
        draftStatus: d.draftStatus,
        signatureStatus: d.signatureStatus,
        adobeSignTags: d.adobeSignTags,
        signerCount: d.signerCount,
        dateIssued: d.dateIssued || null,
        notes: d.notes || "",
      },
    });
  }

  // Action Items
  for (const a of data.actionItems) {
    await prisma.actionItem.upsert({
      where: { id: a.id },
      update: {},
      create: {
        priority: a.priority,
        description: a.description,
        owner: a.owner,
        linkedDocId: a.linkedDocId,
        status: a.status,
        category: a.category || "",
        completedBy: a.completedBy || null,
        completedAt: a.completedAt || null,
      },
    });
  }

  // Change Control Steps
  const cc = data.changeControl;
  for (const s of cc.steps) {
    await prisma.changeControlStep.create({
      data: {
        crfNumber: cc.crfNumber,
        stepNumber: s.stepNumber,
        stepName: s.stepName,
        description: s.description,
        status: s.status,
      },
    });
  }

  // Implementation Actions
  for (const ia of cc.implementationActions) {
    await prisma.implementationAction.create({
      data: {
        crfNumber: cc.crfNumber,
        actionNumber: ia.actionNumber,
        description: ia.description,
        owner: ia.owner,
        targetDate: ia.targetDate || null,
        status: ia.status,
      },
    });
  }

  // Signatures
  for (const sig of data.signatures) {
    await prisma.signature.create({
      data: {
        docId: sig.docId,
        signerNumber: sig.signerNumber,
        role: sig.role,
        signerName: sig.signerName,
        status: sig.status,
        completedAt: sig.completedAt || null,
      },
    });
  }

  // Audit Checklist
  for (const ac of data.auditChecklist) {
    await prisma.auditChecklistItem.create({
      data: {
        description: ac.description,
        linkedDocId: ac.linkedDocId || null,
        checked: ac.checked,
      },
    });
  }

  // Key Dates
  for (const kd of data.keyDates) {
    await prisma.keyDate.create({
      data: {
        milestone: kd.milestone,
        date: kd.date || null,
        status: kd.status,
      },
    });
  }

  // Governing SOPs
  for (const sop of data.governingSops) {
    await prisma.governingSop.create({
      data: {
        sopNumber: sop.sopNumber,
        title: sop.title,
        revision: sop.revision || null,
        effectiveDate: sop.effectiveDate || null,
        aligned: sop.aligned,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
