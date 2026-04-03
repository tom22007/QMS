"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";

interface ChecklistItem {
  id: number;
  description: string;
  linkedDocId: string | null;
  checked: boolean;
  checkedBy: string | null;
  checkedAt: string | null;
}

interface KeyDate {
  id: number;
  milestone: string;
  date: string | null;
  status: string;
}

interface Sop {
  id: number;
  sopNumber: string;
  title: string;
  revision: string | null;
  effectiveDate: string | null;
  aligned: boolean;
}

interface Doc {
  id: number;
  docId: string;
  folder: string;
  filename: string;
}

const SHAREPOINT_BASE =
  "https://reesscientific0-my.sharepoint.com/personal/todonnell_reesscientific_com/Documents/Claude%20-%20Rees%20Software%20Validation%20Documents/";

export default function AuditPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [keyDates, setKeyDates] = useState<KeyDate[]>([]);
  const [sops, setSops] = useState<Sop[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/audit-checklist").then((r) => r.json()),
      fetch("/api/key-dates").then((r) => r.json()),
      fetch("/api/governing-sops").then((r) => r.json()),
      fetch("/api/documents").then((r) => r.json()),
    ]).then(([cl, kd, s, d]) => {
      setChecklist(cl);
      setKeyDates(kd);
      setSops(s);
      setDocs(d);
      setLoading(false);
    });
  }, []);

  async function toggleCheck(item: ChecklistItem) {
    if (!isAdmin) return;
    const res = await fetch(`/api/audit-checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !item.checked }),
    });
    if (res.ok) {
      const updated = await res.json();
      setChecklist((prev) => prev.map((c) => (c.id === item.id ? updated : c)));
    }
  }

  function getDocLink(docId: string | null) {
    if (!docId) return null;
    const doc = docs.find((d) => d.docId === docId);
    if (!doc) return docId;
    const url = `${SHAREPOINT_BASE}${doc.folder}/${encodeURIComponent(doc.filename)}`;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-navy-light underline decoration-navy/30">
        {docId}
      </a>
    );
  }

  const checkedCount = checklist.filter((c) => c.checked).length;
  const totalCount = checklist.length;
  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  if (loading) {
    return <div className="animate-pulse text-text-med">Loading audit data...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-text-dark">Audit Readiness</h2>
        <p className="text-sm text-text-med mt-1">FDA / EU Annex 11 audit preparation checklist</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-text-dark">Readiness Score</h3>
          <span className="text-2xl font-bold text-navy">{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className="bg-green rounded-full h-3 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-text-med mt-2">{checkedCount} of {totalCount} items complete</p>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-text-dark">Audit Checklist</h3>
        </div>
        <div className="divide-y">
          {checklist.map((item) => (
            <div key={item.id} className="px-6 py-3 flex items-start gap-3 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleCheck(item)}
                disabled={!isAdmin}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green focus:ring-green cursor-pointer disabled:cursor-default accent-green"
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${item.checked ? "line-through text-text-med/60" : "text-text-dark"}`}>
                  {item.description}
                </p>
                <div className="flex gap-3 mt-1">
                  {item.linkedDocId && (
                    <span className="text-xs text-text-med">Doc: {getDocLink(item.linkedDocId)}</span>
                  )}
                  {item.checkedBy && (
                    <span className="text-xs text-text-med/60">
                      by {item.checkedBy} on {new Date(item.checkedAt!).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Dates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-text-dark">Key Dates</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-header-bg text-left">
              <th className="px-6 py-3 font-semibold text-text-dark">Milestone</th>
              <th className="px-6 py-3 font-semibold text-text-dark">Date</th>
              <th className="px-6 py-3 font-semibold text-text-dark">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {keyDates.map((kd) => (
              <tr key={kd.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-text-dark">{kd.milestone}</td>
                <td className="px-6 py-3 text-text-med">{kd.date || "TBD"}</td>
                <td className="px-6 py-3"><StatusBadge status={kd.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Governing SOPs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-text-dark">Governing SOPs</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-header-bg text-left">
              <th className="px-6 py-3 font-semibold text-text-dark">SOP #</th>
              <th className="px-6 py-3 font-semibold text-text-dark">Title</th>
              <th className="px-6 py-3 font-semibold text-text-dark">Revision</th>
              <th className="px-6 py-3 font-semibold text-text-dark">Effective Date</th>
              <th className="px-6 py-3 font-semibold text-text-dark">Aligned</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sops.map((sop) => (
              <tr key={sop.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-navy">{sop.sopNumber}</td>
                <td className="px-6 py-3 text-text-dark">{sop.title}</td>
                <td className="px-6 py-3 text-text-med">{sop.revision || "—"}</td>
                <td className="px-6 py-3 text-text-med">{sop.effectiveDate || "—"}</td>
                <td className="px-6 py-3">
                  {sop.aligned ? (
                    <span className="text-green font-medium">Yes</span>
                  ) : (
                    <span className="text-accent font-medium">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
