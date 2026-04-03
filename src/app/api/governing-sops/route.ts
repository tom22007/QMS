import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const sops = await prisma.governingSop.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json(sops);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch SOPs" }, { status: 500 });
  }
}
