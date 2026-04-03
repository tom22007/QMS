"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import StatusBadge from "@/components/StatusBadge";
import DocLink from "@/components/DocLink";

interface DocumentData {
  id: number;
  docId: string;
  title: string;
  revision: string;
  folder: string;
  filename: string;
  draftStatus: string;
  signatureStatus: string;
  archived: boolean;
}

const DRAFT_STATUS_OPTIONS = [
  "Draft",
  "Template",
  "Complete",
  "Executed",
  "Active",
  "Approved",
];

const SIGNATURE_STATUS_OPTIONS = [
  "Not required",
  "No tags",
  "Needs signature",
  "Routed",
  "Signed",
  "N/A",
];

export default function DocumentsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const url = showArchived ? "/api/documents?archived=true" : "/api/documents";
      const res = await fetch(url);
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleStatusChange = async (
    id: number,
    field: "draftStatus" | "signatureStatus",
    value: string
  ) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? updated : d))
        );
      }
    } catch (error) {
      console.error("Failed to update document:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleArchiveToggle = async (id: number, archive: boolean) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: archive }),
      });
      if (res.ok) {
        if (!showArchived && archive) {
          // Remove from view when archiving in active view
          setDocuments((prev) => prev.filter((d) => d.id !== id));
        } else {
          const updated = await res.json();
          setDocuments((prev) =>
            prev.map((d) => (d.id === id ? updated : d))
          );
        }
      }
    } catch (error) {
      console.error("Failed to update document:", error);
    } finally {
      setUpdating(null);
    }
  };

  const activeDocs = documents.filter((d) => !d.archived);
  const archivedDocs = documents.filter((d) => d.archived);
  const displayDocs = showArchived ? documents : activeDocs;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-navy font-medium">
          Loading documents...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-dark">Document Status</h2>
          <p className="text-sm text-text-med mt-1">
            Review and manage qualification document lifecycle
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              showArchived
                ? "bg-navy text-white"
                : "bg-gray-100 text-text-med hover:bg-gray-200"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {showArchived ? `Showing All (${archivedDocs.length} archived)` : `Show Archived (${archivedDocs.length})`}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-header-bg text-left">
                <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                  Doc ID
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                  Rev
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                  Folder
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                  Draft Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                  Signature Status
                </th>
                {isAdmin && (
                  <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">

                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayDocs.map((doc) => (
                <tr
                  key={doc.id}
                  className={`hover:bg-gray-50/50 ${
                    updating === doc.id ? "opacity-50" : ""
                  } ${doc.archived ? "bg-gray-50/70" : ""}`}
                >
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <DocLink
                        docId={doc.docId}
                        folder={doc.folder}
                        filename={doc.filename}
                      />
                      {doc.archived && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-text-med rounded font-medium">
                          ARCHIVED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-dark max-w-xs truncate">
                    {doc.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-med text-center">
                    {doc.revision}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-med whitespace-nowrap">
                    {doc.folder}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && !doc.archived ? (
                      <select
                        value={doc.draftStatus}
                        onChange={(e) =>
                          handleStatusChange(doc.id, "draftStatus", e.target.value)
                        }
                        disabled={updating === doc.id}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-text-dark focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40"
                      >
                        {DRAFT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={doc.draftStatus} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && !doc.archived ? (
                      <select
                        value={doc.signatureStatus}
                        onChange={(e) =>
                          handleStatusChange(
                            doc.id,
                            "signatureStatus",
                            e.target.value
                          )
                        }
                        disabled={updating === doc.id}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-text-dark focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40"
                      >
                        {SIGNATURE_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={doc.signatureStatus} />
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleArchiveToggle(doc.id, !doc.archived)}
                        disabled={updating === doc.id}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                          doc.archived
                            ? "text-green bg-green/10 hover:bg-green/20"
                            : "text-text-med bg-gray-100 hover:bg-gray-200"
                        }`}
                        title={doc.archived ? "Restore this document" : "Archive this document"}
                      >
                        {doc.archived ? "Restore" : "Archive"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {displayDocs.length === 0 && (
          <div className="px-6 py-10 text-center text-text-med text-sm">
            {showArchived ? "No documents found." : "No active documents found."}
          </div>
        )}
      </div>
    </div>
  );
}
