import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const items = await prisma.auditChecklistItem.findMany();
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch audit checklist items:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit checklist items" },
      { status: 500 },
    );
  }
}
