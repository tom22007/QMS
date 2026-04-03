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
    const actionId = parseInt(id, 10);
    if (isNaN(actionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.actionItem.findUnique({
      where: { id: actionId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Action item not found" },
        { status: 404 },
      );
    }

    const username = (session.user as { username?: string }).username ?? session.user.name ?? "unknown";

    const body = await request.json();
    const newStatus = body.status === "Open" ? "Open" : "Complete";

    const updated = await prisma.actionItem.update({
      where: { id: actionId },
      data: {
        status: newStatus,
        completedBy: newStatus === "Complete" ? username : null,
        completedAt: newStatus === "Complete" ? new Date().toISOString() : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        timestamp: new Date().toISOString(),
        username,
        action: `${newStatus === "Complete" ? "Completed" : "Reopened"} action item #${actionId}: ${existing.description}`,
        previousValue: existing.status,
        newValue: newStatus,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update action item:", error);
    return NextResponse.json(
      { error: "Failed to update action item" },
      { status: 500 },
    );
  }
}
