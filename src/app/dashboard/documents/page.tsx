"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch("/api/documents");
        const data = await res.json();
        setDocuments(data);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

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
      <div>
        <h2 className="text-2xl font-bold text-text-dark">Document Status</h2>
        <p className="text-sm text-text-med mt-1">
          Review and manage qualification document lifecycle
        </p>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className={`hover:bg-gray-50/50 ${
                    updating === doc.id ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <DocLink
                      docId={doc.docId}
                      folder={doc.folder}
                      filename={doc.filename}
                    />
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
                    {isAdmin ? (
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
                    {isAdmin ? (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {documents.length === 0 && (
          <div className="px-6 py-10 text-center text-text-med text-sm">
            No documents found.
          </div>
        )}
      </div>
    </div>
  );
}
