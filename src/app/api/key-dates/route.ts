import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const dates = await prisma.keyDate.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json(dates);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch key dates" }, { status: 500 });
  }
}
