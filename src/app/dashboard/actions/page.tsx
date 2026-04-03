"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import StatusBadge from "@/components/StatusBadge";
import DocLink from "@/components/DocLink";
import { useCompliance } from "@/components/ComplianceContext";
import { useToast } from "@/components/ToastProvider";

interface ActionItem {
  id: number;
  priority: string;
  description: string;
  owner: string;
  linkedDocId: string;
  status: string;
  category: string;
  completedBy: string | null;
  completedAt: string | null;
}

interface DocumentData {
  id: number;
  docId: string;
  title: string;
  folder: string;
  filename: string;
}

export default function ActionsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const { data: compliance, refresh: refreshCompliance } = useCompliance();
  const { showToast } = useToast();

  const [actions, setActions] = useState<ActionItem[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [actionsRes, docsRes] = await Promise.all([
        fetch("/api/actions"),
        fetch("/api/documents"),
      ]);
      const actionsData = await actionsRes.json();
      const docsData = await docsRes.json();
      setActions(actionsData);
      setDocuments(docsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDocData = (linkedDocId: string): DocumentData | undefined => {
    return documents.find((d) => d.docId === linkedDocId);
  };

  const handleToggle = async (id: number, newStatus: "Complete" | "Open") => {
    setCompleting(id);
    try {
      const res = await fetch(`/api/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActions((prev) =>
          prev.map((a) => (a.id === id ? updated : a))
        );
        const oldPct = compliance?.master ?? 0;
        const newData = await refreshCompliance();
        if (newData) {
          const label = newStatus === "Complete" ? "Action completed" : "Action reopened";
          showToast(`${label}. Compliance: ${oldPct}% → ${newData.master}%`);
        }
      }
    } catch (error) {
      console.error("Failed to update action:", error);
    } finally {
      setCompleting(null);
    }
  };

  const openActions = actions.filter((a) => a.status !== "Complete");
  const completedActions = actions.filter((a) => a.status === "Complete");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-navy font-medium">
          Loading action items...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-dark">Action Items</h2>
        <p className="text-sm text-text-med mt-1">
          Track and manage outstanding qualification tasks
        </p>
      </div>

      {/* Open Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-text-dark">
            Open Items
            <span className="ml-2 text-sm font-normal text-text-med">
              ({openActions.length})
            </span>
          </h3>
        </div>
        {openActions.length === 0 ? (
          <div className="px-6 py-10 text-center text-text-med text-sm">
            No open action items. All tasks are complete.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-header-bg text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {openActions.map((action) => {
                  const doc = getDocData(action.linkedDocId);
                  return (
                    <tr key={action.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <StatusBadge status={action.priority} />
                      </td>
                      <td className="px-4 py-3 text-sm text-text-dark max-w-md">
                        {action.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-med whitespace-nowrap">
                        {action.owner}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {doc ? (
                          <DocLink
                            docId={doc.docId}
                            folder={doc.folder}
                            filename={doc.filename}
                          />
                        ) : (
                          <span className="text-text-med">{action.linkedDocId}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={action.status} />
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggle(action.id, "Complete")}
                            disabled={completing === action.id}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green rounded-lg hover:bg-green/90 disabled:opacity-50 transition-colors"
                          >
                            {completing === action.id
                              ? "Saving..."
                              : "Mark Complete"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completed Actions */}
      {completedActions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-text-dark">
              Recently Completed
              <span className="ml-2 text-sm font-normal text-text-med">
                ({completedActions.length})
              </span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-header-bg text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-xs font-semibold text-text-dark uppercase tracking-wider">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {completedActions.map((action) => {
                  const doc = getDocData(action.linkedDocId);
                  return (
                    <tr key={action.id} className="opacity-70 hover:opacity-100 transition-opacity">
                      <td className="px-4 py-3">
                        <StatusBadge status={action.priority} />
                      </td>
                      <td className="px-4 py-3 text-sm text-text-dark max-w-md line-through">
                        {action.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-med whitespace-nowrap line-through">
                        {action.owner}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {doc ? (
                          <DocLink
                            docId={doc.docId}
                            folder={doc.folder}
                            filename={doc.filename}
                          />
                        ) : (
                          <span className="text-text-med">{action.linkedDocId}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={action.status} />
                        {action.completedBy && (
                          <p className="text-xs text-text-med mt-1">
                            by {action.completedBy}
                            {action.completedAt && ` on ${new Date(action.completedAt).toLocaleDateString()}`}
                          </p>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggle(action.id, "Open")}
                            disabled={completing === action.id}
                            className="px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 rounded-lg hover:bg-accent/20 disabled:opacity-50 transition-colors"
                          >
                            {completing === action.id ? "Saving..." : "Undo"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
