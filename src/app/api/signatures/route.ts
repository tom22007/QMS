import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const signatures = await prisma.signature.findMany();
    return NextResponse.json(signatures);
  } catch (error) {
    console.error("Failed to fetch signatures:", error);
    return NextResponse.json(
      { error: "Failed to fetch signatures" },
      { status: 500 },
    );
  }
}
