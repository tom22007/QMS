import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface DocRecord {
  signatureStatus: string;
}

interface ActionRecord {
  status: string;
}

export async function GET() {
  try {
    const documents: DocRecord[] = await prisma.document.findMany();
    const actionItems: ActionRecord[] = await prisma.actionItem.findMany();

    const totalDocs = documents.length;
    const signedCount = documents.filter(
      (d: DocRecord) => d.signatureStatus === "Signed",
    ).length;
    const needsSigCount = documents.filter(
      (d: DocRecord) => d.signatureStatus === "Needs signature",
    ).length;
    const naCount = documents.filter(
      (d: DocRecord) => d.signatureStatus === "N/A" || d.signatureStatus === "No tags",
    ).length;

    const signableDocs = documents.filter(
      (d: DocRecord) => d.signatureStatus !== "N/A" && d.signatureStatus !== "No tags",
    );
    const overallCompliance =
      signableDocs.length > 0
        ? Math.round((signedCount / signableDocs.length) * 100)
        : 0;

    const openActions = actionItems.filter((a: ActionRecord) => a.status === "Open").length;

    return NextResponse.json({
      overallCompliance,
      totalDocs,
      signedCount,
      needsSigCount,
      naCount,
      openActions,
    });
  } catch (error) {
    console.error("Failed to calculate metrics:", error);
    return NextResponse.json(
      { error: "Failed to calculate metrics" },
      { status: 500 },
    );
  }
}
