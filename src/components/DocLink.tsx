"use client";

import Link from "next/link";

interface DocLinkProps {
  docId: string;
  folder: string;
  filename: string;
  className?: string;
}

export default function DocLink({ docId, folder, filename, className }: DocLinkProps) {
  const viewerUrl = `/dashboard/viewer?docId=${encodeURIComponent(docId)}&folder=${encodeURIComponent(folder)}&filename=${encodeURIComponent(filename)}`;
  return (
    <Link
      href={viewerUrl}
      className={className || "text-navy hover:text-navy-light font-medium underline decoration-navy/30 hover:decoration-navy"}
    >
      {docId}
    </Link>
  );
}
