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
        completedAt: status === "Signed" ? new Date().toISOString() : null,
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

    // Cascading updates
    let cascaded = { documentSigned: false, documentUnsigned: false, actionsCompleted: 0, actionsReopened: 0 };

    // Reverse cascade: if unsigning, revert document and reopen auto-completed actions
    if (status !== "Signed") {
      const doc = await prisma.document.findFirst({
        where: { docId: existing.docId },
      });
      if (doc && doc.signatureStatus === "Signed") {
        await prisma.document.update({
          where: { id: doc.id },
          data: { signatureStatus: "In Progress" },
        });
        await prisma.activityLog.create({
          data: {
            timestamp: new Date().toISOString(),
            username: "system",
            action: `Auto-reverted ${existing.docId} signatureStatus to "In Progress" (signature removed)`,
            previousValue: "Signed",
            newValue: "In Progress",
          },
        });
        cascaded.documentUnsigned = true;

        // Reopen auto-completed signature-related actions
        const autoCompletedActions = await prisma.actionItem.findMany({
          where: {
            linkedDocId: existing.docId,
            status: "Complete",
            completedBy: "system",
            description: { contains: "signature" },
          },
        });
        for (const action of autoCompletedActions) {
          await prisma.actionItem.update({
            where: { id: action.id },
            data: { status: "Open", completedBy: null, completedAt: null },
          });
          await prisma.activityLog.create({
            data: {
              timestamp: new Date().toISOString(),
              username: "system",
              action: `Auto-reopened action "${action.description}" (signature removed from ${existing.docId})`,
              previousValue: "Complete",
              newValue: "Open",
            },
          });
          cascaded.actionsReopened++;
        }
      }
    }

    if (status === "Signed") {
      const allSigsForDoc = await prisma.signature.findMany({
        where: { docId: existing.docId },
      });
      const allSigned = allSigsForDoc.length > 0 && allSigsForDoc.every((s) => s.status === "Signed");

      if (allSigned) {
        const doc = await prisma.document.findFirst({
          where: { docId: existing.docId },
        });

        if (doc && doc.signatureStatus !== "Signed") {
          await prisma.document.update({
            where: { id: doc.id },
            data: { signatureStatus: "Signed" },
          });
          await prisma.activityLog.create({
            data: {
              timestamp: new Date().toISOString(),
              username: "system",
              action: `Auto-updated ${existing.docId} signatureStatus to "Signed" (all signers complete)`,
              previousValue: doc.signatureStatus,
              newValue: "Signed",
            },
          });
          cascaded.documentSigned = true;

          // Auto-complete related signature routing action items
          const relatedActions = await prisma.actionItem.findMany({
            where: {
              linkedDocId: existing.docId,
              status: "Open",
              description: { contains: "signature" },
            },
          });
          for (const action of relatedActions) {
            await prisma.actionItem.update({
              where: { id: action.id },
              data: {
                status: "Complete",
                completedBy: "system",
                completedAt: new Date().toISOString(),
              },
            });
            await prisma.activityLog.create({
              data: {
                timestamp: new Date().toISOString(),
                username: "system",
                action: `Auto-completed action "${action.description}" (all signatures for ${existing.docId} complete)`,
                previousValue: "Open",
                newValue: "Complete",
              },
            });
            cascaded.actionsCompleted++;
          }
        }
      }
    }

    return NextResponse.json({ ...updated, cascaded });
  } catch (error) {
    console.error("Failed to update signature:", error);
    return NextResponse.json(
      { error: "Failed to update signature" },
      { status: 500 },
    );
  }
}
