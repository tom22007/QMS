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
    const signatureId = parseInt(id, 10);
    if (isNaN(signatureId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Provide a status to update" },
        { status: 400 },
      );
    }

    const existing = await prisma.signature.findUnique({
      where: { id: signatureId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Signature not found" },
        { status: 404 },
      );
    }

    const username = (session.user as { username?: string }).username ?? session.user.name ?? "unknown";

    const updated = await prisma.signature.update({
      where: { id: signatureId },
      data: {
        status,
        completedAt: status === "Signed" ? new Date().toISOString() : existing.completedAt,
      },
    });

    await prisma.activityLog.create({
      data: {
        timestamp: new Date().toISOString(),
        username,
        action: `Updated signature status for ${existing.signerName} on document ${existing.docId}`,
        previousValue: existing.status,
        newValue: status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update signature:", error);
    return NextResponse.json(
      { error: "Failed to update signature" },
      { status: 500 },
    );
  }
}
