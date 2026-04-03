import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [documents, actionItems, auditItems] = await Promise.all([
      prisma.document.findMany({ where: { archived: false } }),
      prisma.actionItem.findMany(),
      prisma.auditChecklistItem.findMany(),
    ]);

    // Signatures: 40% weight
    const signableDocs = documents.filter(
      (d) => d.signatureStatus !== "N/A" && d.signatureStatus !== "No tags"
    );
    const signedDocs = documents.filter((d) => d.signatureStatus === "Signed");
    const sigPct = signableDocs.length > 0 ? (signedDocs.length / signableDocs.length) * 100 : 0;

    // Actions: 30% weight
    const completedActions = actionItems.filter((a) => a.status === "Complete");
    const actionPct = actionItems.length > 0 ? (completedActions.length / actionItems.length) * 100 : 0;

    // Audit: 30% weight
    const checkedItems = auditItems.filter((a) => a.checked);
    const auditPct = auditItems.length > 0 ? (checkedItems.length / auditItems.length) * 100 : 0;

    const master = Math.round(sigPct * 0.4 + actionPct * 0.3 + auditPct * 0.3);

    const needsSigDocs = documents.filter((d) => d.signatureStatus === "Needs signature");
    const openActions = actionItems.filter((a) => a.status === "Open");

    return NextResponse.json({
      master,
      signatures: {
        signed: signedDocs.length,
        signable: signableDocs.length,
        pct: Math.round(sigPct),
        weighted: Math.round(sigPct * 0.4 * 10) / 10,
      },
      actions: {
        complete: completedActions.length,
        total: actionItems.length,
        pct: Math.round(actionPct),
        weighted: Math.round(actionPct * 0.3 * 10) / 10,
      },
      audit: {
        checked: checkedItems.length,
        total: auditItems.length,
        pct: Math.round(auditPct),
        weighted: Math.round(auditPct * 0.3 * 10) / 10,
      },
      sidebar: {
        openActions: openActions.length,
        needsSig: needsSigDocs.length,
        auditChecked: checkedItems.length,
        auditTotal: auditItems.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to compute compliance" }, { status: 500 });
  }
}
