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

    const body = await request.json();
    const { type, status } = body;

    if (!type || !status) {
      return NextResponse.json(
        { error: "Provide type ('step' or 'action') and status" },
        { status: 400 },
      );
    }

    if (type !== "step" && type !== "action") {
      return NextResponse.json(
        { error: "type must be 'step' or 'action'" },
        { status: 400 },
      );
    }

    const username = (session.user as { username?: string }).username ?? session.user.name ?? "unknown";

    if (type === "step") {
      const existing = await prisma.changeControlStep.findUnique({
        where: { id: itemId },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Change control step not found" },
          { status: 404 },
        );
      }

      const updated = await prisma.changeControlStep.update({
        where: { id: itemId },
        data: { status },
      });

      await prisma.activityLog.create({
        data: {
          timestamp: new Date().toISOString(),
          username,
          action: `Updated change control step "${existing.stepName}" status`,
          previousValue: existing.status,
          newValue: status,
        },
      });

      return NextResponse.json(updated);
    }

    // type === "action"
    const existing = await prisma.implementationAction.findUnique({
      where: { id: itemId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Implementation action not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.implementationAction.update({
      where: { id: itemId },
      data: { status },
    });

    await prisma.activityLog.create({
      data: {
        timestamp: new Date().toISOString(),
        username,
        action: `Updated implementation action #${existing.actionNumber} status`,
        previousValue: existing.status,
        newValue: status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update change control item:", error);
    return NextResponse.json(
      { error: "Failed to update change control item" },
      { status: 500 },
    );
  }
}
