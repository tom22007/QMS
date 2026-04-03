import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const steps = await prisma.changeControlStep.findMany({
      orderBy: { stepNumber: "asc" },
    });
    const implementationActions = await prisma.implementationAction.findMany({
      orderBy: { actionNumber: "asc" },
    });

    return NextResponse.json({
      steps,
      implementationActions,
      meta: {
        crfNumber: "CRF-2026-0002",
        title: "Helix GUI Initial Software Release and SSO Authentication Addition",
        changeType: "Engineering: Software (SOP-0083 §7.2.1.3)",
        priority: "Major (SOP-0083 §7.3.3)",
        initiatedBy: "T. O'Donnell",
        dateInitiated: "2026-04-02",
      },
    });
  } catch (error) {
    console.error("Failed to fetch change control data:", error);
    return NextResponse.json(
      { error: "Failed to fetch change control data" },
      { status: 500 },
    );
  }
}
