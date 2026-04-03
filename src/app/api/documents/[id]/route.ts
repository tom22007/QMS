import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { draftStatus, signatureStatus, archived } = body;

    if (!draftStatus && !signatureStatus && archived === undefined) {
      return NextResponse.json(
        { error: "Provide draftStatus, signatureStatus, or archived to update" },
        { status: 400 },
      );
    }

    const existing = await prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const updateData: Record<string, string | boolean> = {};
    const username = (session.user as { username?: string }).username ?? session.user.name ?? "unknown";

    if (draftStatus) {
      updateData.draftStatus = draftStatus;
      await prisma.activityLog.create({
        data: {
          timestamp: new Date().toISOString(),
          username,
          action: `Updated draftStatus for document ${existing.docId}`,
          previousValue: existing.draftStatus,
          newValue: draftStatus,
        },
      });
    }

    if (signatureStatus) {
      updateData.signatureStatus = signatureStatus;
      await prisma.activityLog.create({
        data: {
          timestamp: new Date().toISOString(),
          username,
          action: `Updated signatureStatus for document ${existing.docId}`,
          previousValue: existing.signatureStatus,
          newValue: signatureStatus,
        },
      });
    }

    if (archived !== undefined) {
      updateData.archived = archived;
      await prisma.activityLog.create({
        data: {
          timestamp: new Date().toISOString(),
          username,
          action: `${archived ? "Archived" : "Restored"} document ${existing.docId}`,
          previousValue: String(existing.archived),
          newValue: String(archived),
        },
      });
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 },
    );
  }
}
