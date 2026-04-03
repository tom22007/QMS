import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const raw = fs.readFileSync(path.join(process.cwd(), "seed-data.json"), "utf-8");
  const data = JSON.parse(raw);

  // Users - always update password hash
  for (const u of data.users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { password: hashed, role: u.role, name: u.name, title: u.title },
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

  // Change Control Steps - clear and recreate
  await prisma.changeControlStep.deleteMany();
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

  // Implementation Actions - clear and recreate
  await prisma.implementationAction.deleteMany();
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

  // Signatures - clear and recreate
  await prisma.signature.deleteMany();
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

  // Audit Checklist - clear and recreate
  await prisma.auditChecklistItem.deleteMany();
  for (const ac of data.auditChecklist) {
    await prisma.auditChecklistItem.create({
      data: {
        description: ac.description,
        linkedDocId: ac.linkedDocId || null,
        checked: ac.checked,
      },
    });
  }

  // Key Dates - clear and recreate
  await prisma.keyDate.deleteMany();
  for (const kd of data.keyDates) {
    await prisma.keyDate.create({
      data: {
        milestone: kd.milestone,
        date: kd.date || null,
        status: kd.status,
      },
    });
  }

  // Governing SOPs - clear and recreate
  await prisma.governingSop.deleteMany();
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

  console.log("Seed complete — 5 users, 15 documents, 17 action items loaded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
