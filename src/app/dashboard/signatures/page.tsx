"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import DocLink from "@/components/DocLink";
import StatusBadge from "@/components/StatusBadge";
import { useCompliance } from "@/components/ComplianceContext";
import { useToast } from "@/components/ToastProvider";

interface Signature {
  id: number;
  docId: string;
  signerNumber: number;
  role: string;
  signerName: string;
  status: string;
  completedAt: string | null;
}

interface Document {
  id: number;
  docId: string;
  title: string;
  folder: string;
  filename: string;
  signatureStatus: string;
  signerCount: number;
}

const PRIORITY_GROUPS = {
  Now: ["VMP-0001", "URS-0001", "FS-0001", "ERES-0001", "SVR-IOQ-0163", "CRF-2026-0002"],
  Next: ["CS-0001", "PQ-0001", "IOQ-0163-A1"],
  After: [] as string[],
};

const ALREADY_SIGNED = ["IOQ-0163"];
const NO_SIGNATURE_REQUIRED = ["DS-0001", "RA-0001", "RA-2026-0003", "RTM-0001", "CCL-0001"];

export default function SignaturesPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const { data: compliance, refresh: refreshCompliance } = useCompliance();
  const { showToast } = useToast();

  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [sigRes, docRes] = await Promise.all([
        fetch("/api/signatures"),
        fetch("/api/documents"),
      ]);
      const sigData = await sigRes.json();
      const docData = await docRes.json();
      setSignatures(Array.isArray(sigData) ? sigData : sigData.signatures || []);
      setDocuments(Array.isArray(docData) ? docData : docData.documents || []);
    } catch (err) {
      console.error("Failed to fetch signature data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDoc = (docId: string) => documents.find((d) => d.docId === docId);
  const getSigners = (docId: string) =>
    signatures
      .filter((s) => s.docId === docId)
      .sort((a, b) => a.signerNumber - b.signerNumber);

  const handleMarkSigned = async (signatureId: number) => {
    setUpdating(signatureId);
    try {
      const res = await fetch(`/api/signatures/${signatureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Signed", completedAt: new Date().toISOString() }),
      });
      if (res.ok) {
        const result = await res.json();
        const cascadeMsg = result?.cascaded?.documentSigned
          ? " Document fully signed!"
          : "";
        await fetchData();
        const oldPct = compliance?.master ?? 0;
        const newData = await refreshCompliance();
        if (newData) {
          showToast(`Signature recorded.${cascadeMsg} Compliance: ${oldPct}% → ${newData.master}%`);
        }
      }
    } catch (err) {
      console.error("Failed to update signature:", err);
    } finally {
      setUpdating(null);
    }
  };

  const renderSignatureTable = (docIds: string[], groupLabel: string) => {
    if (docIds.length === 0) return null;

    const docsWithData = docIds.map((id) => ({
      docId: id,
      doc: getDoc(id),
      signers: getSigners(id),
    }));

    return (
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-text-med uppercase tracking-wider mb-3">
          {groupLabel}
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-header-bg">
                  <th className="text-left px-4 py-3 font-semibold text-navy">Doc ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Title</th>
                  <th className="text-center px-4 py-3 font-semibold text-navy">Signer 1</th>
                  <th className="text-center px-4 py-3 font-semibold text-navy">Signer 2</th>
                  <th className="text-center px-4 py-3 font-semibold text-navy">Signer 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docsWithData.map(({ docId, doc, signers }) => (
                  <tr key={docId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {doc ? (
                        <DocLink docId={doc.docId} folder={doc.folder} filename={doc.filename} />
                      ) : (
                        <span className="font-medium text-text-dark">{docId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-dark max-w-xs truncate">
                      {doc?.title || "\u2014"}
                    </td>
                    {[0, 1, 2].map((idx) => {
                      const signer = signers[idx];
                      if (!signer) {
                        return (
                          <td key={idx} className="px-4 py-3 text-center text-gray-300">
                            \u2014
                          </td>
                        );
                      }
                      const isUpdating = updating === signer.id;
                      return (
                        <td key={idx} className={`px-4 py-3 text-center ${isUpdating ? "opacity-50" : ""}`}>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium text-text-dark">{signer.signerName}</span>
                            <span className="text-xs text-text-med/60">{signer.role}</span>
                            <StatusBadge status={signer.status} />
                            {isAdmin && signer.status !== "Signed" && (
                              <button
                                onClick={() => handleMarkSigned(signer.id)}
                                disabled={isUpdating}
                                className="mt-1 text-xs px-2 py-0.5 rounded bg-green/10 text-green hover:bg-green/20 transition-colors font-medium disabled:opacity-50"
                              >
                                Mark Signed
                              </button>
                            )}
                            {signer.completedAt && (
                              <span className="text-xs text-text-med/50">
                                {new Date(signer.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-navy font-medium">Loading signatures...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-dark">Signature Tracker</h2>
        <p className="text-sm text-text-med mt-1">
          Track document signature routing and completion status across all qualification deliverables.
        </p>
      </div>

      {renderSignatureTable(PRIORITY_GROUPS.Now, "Sign Now \u2014 Immediate Priority")}
      {renderSignatureTable(PRIORITY_GROUPS.Next, "Sign Next \u2014 Upcoming")}
      {PRIORITY_GROUPS.After.length > 0 &&
        renderSignatureTable(PRIORITY_GROUPS.After, "Sign After \u2014 Future")}

      {/* Already Signed */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-text-med uppercase tracking-wider mb-3">
          Already Signed
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-header-bg">
                <th className="text-left px-4 py-3 font-semibold text-navy">Doc ID</th>
                <th className="text-left px-4 py-3 font-semibold text-navy">Title</th>
                <th className="text-center px-4 py-3 font-semibold text-navy">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ALREADY_SIGNED.map((docId) => {
                const doc = getDoc(docId);
                return (
                  <tr key={docId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      {doc ? (
                        <DocLink docId={doc.docId} folder={doc.folder} filename={doc.filename} />
                      ) : (
                        <span className="font-medium text-text-dark">{docId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-dark">{doc?.title || "\u2014"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-green font-medium text-sm">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        All Signed
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Signature Required */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-text-med uppercase tracking-wider mb-3">
          No Signature Required
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-header-bg">
                <th className="text-left px-4 py-3 font-semibold text-navy">Doc ID</th>
                <th className="text-left px-4 py-3 font-semibold text-navy">Title</th>
                <th className="text-center px-4 py-3 font-semibold text-navy">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {NO_SIGNATURE_REQUIRED.map((docId) => {
                const doc = getDoc(docId);
                return (
                  <tr key={docId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      {doc ? (
                        <DocLink docId={doc.docId} folder={doc.folder} filename={doc.filename} />
                      ) : (
                        <span className="font-medium text-text-dark">{docId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-dark">{doc?.title || "\u2014"}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status="Not required" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
