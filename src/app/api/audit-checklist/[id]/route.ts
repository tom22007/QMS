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
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.auditChecklistItem.findUnique({
      where: { id: itemId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Audit checklist item not found" },
        { status: 404 },
      );
    }

    const username = (session.user as { username?: string }).username ?? session.user.name ?? "unknown";
    const newChecked = !existing.checked;

    const updated = await prisma.auditChecklistItem.update({
      where: { id: itemId },
      data: {
        checked: newChecked,
        checkedBy: newChecked ? username : null,
        checkedAt: newChecked ? new Date().toISOString() : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        timestamp: new Date().toISOString(),
        username,
        action: `${newChecked ? "Checked" : "Unchecked"} audit checklist item: ${existing.description}`,
        previousValue: String(existing.checked),
        newValue: String(newChecked),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update audit checklist item:", error);
    return NextResponse.json(
      { error: "Failed to update audit checklist item" },
      { status: 500 },
    );
  }
}
