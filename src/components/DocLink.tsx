"use client";

import { getSharePointUrl } from "@/lib/sharepoint";

interface DocLinkProps {
  docId: string;
  folder: string;
  filename: string;
  className?: string;
}

export default function DocLink({ docId, folder, filename, className }: DocLinkProps) {
  const url = getSharePointUrl(folder, filename);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className || "text-navy hover:text-navy-light font-medium underline decoration-navy/30 hover:decoration-navy"}
    >
      {docId}
    </a>
  );
}
