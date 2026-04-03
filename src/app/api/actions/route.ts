import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const actions = await prisma.actionItem.findMany();
    return NextResponse.json(actions);
  } catch (error) {
    console.error("Failed to fetch action items:", error);
    return NextResponse.json(
      { error: "Failed to fetch action items" },
      { status: 500 },
    );
  }
}
