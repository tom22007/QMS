import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const docId = request.nextUrl.searchParams.get("docId");
    if (!docId) {
      return NextResponse.json({ error: "docId required" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { docId },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId, text } = await request.json();
    if (!docId || !text?.trim()) {
      return NextResponse.json({ error: "docId and text required" }, { status: 400 });
    }

    const username = (session.user as { username?: string }).username ?? "unknown";
    const name = session.user.name ?? username;

    const comment = await prisma.comment.create({
      data: {
        docId,
        username,
        name,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
