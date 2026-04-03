"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import StatusBadge from "@/components/StatusBadge";
import DocLink from "@/components/DocLink";

interface ChangeControlStep {
  id: number;
  crfNumber: string;
  stepNumber: number;
  stepName: string;
  description: string;
  status: string;
}

interface ImplementationAction {
  id: number;
  crfNumber: string;
  actionNumber: number;
  description: string;
  owner: string;
  targetDate: string | null;
  status: string;
}

interface ChangeControlMeta {
  crfNumber: string;
  title: string;
  changeType: string;
  priority: string;
  initiatedBy: string;
  dateInitiated: string;
}

interface ChangeControlData {
  steps: ChangeControlStep[];
  implementationActions: ImplementationAction[];
  meta: ChangeControlMeta;
}

const STEP_STATUS_OPTIONS = ["Complete", "In progress", "Needs signature", "Pending"];
const ACTION_STATUS_OPTIONS = ["Complete", "In progress", "Pending"];

const stepCircleStyle = (status: string) => {
  switch (status) {
    case "Complete":
      return "bg-green text-white";
    case "In progress":
      return "bg-blue-500 text-white";
    case "Needs signature":
      return "bg-accent text-white";
    default:
      return "bg-gray-200 text-text-med";
  }
};

export default function ChangeControlPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const [data, setData] = useState<ChangeControlData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/change-control");
      const json = await res.json();
      setData({
        steps: json.steps || [],
        implementationActions: json.implementationActions || [],
        meta: json.meta || {
          crfNumber: "CRF-2026-0002",
          title: "Helix GUI Initial Software Release and SSO Authentication Addition",
          changeType: "Engineering: Software (SOP-0083 \u00A77.2.1.3)",
          priority: "Major (SOP-0083 \u00A77.3.3)",
          initiatedBy: "T. O'Donnell",
          dateInitiated: "2026-04-02",
        },
      });
    } catch (err) {
      console.error("Failed to fetch change control data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStepStatusChange = async (stepId: number, newStatus: string) => {
    try {
      await fetch(`/api/change-control/steps/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to update step:", err);
    }
  };

  const handleActionStatusToggle = async (actionId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "Complete" ? "Pending" : "Complete";
    try {
      await fetch(`/api/change-control/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to update action:", err);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-navy font-medium">Loading change control...</div>
      </div>
    );
  }

  const { meta } = data;
  const steps = [...data.steps].sort((a, b) => a.stepNumber - b.stepNumber);
  const actions = [...data.implementationActions].sort((a, b) => a.actionNumber - b.actionNumber);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-dark">Change Control</h2>
        <p className="text-sm text-text-med mt-1">
          Track the change request workflow and implementation actions.
        </p>
      </div>

      {/* CRF Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <DocLink docId={meta.crfNumber} folder="Change Control" filename="CRF-2026-0002.pdf" />
              <StatusBadge status="Active" size="md" />
            </div>
            <h3 className="text-lg font-semibold text-text-dark mt-2">
              {meta.title}
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-xs font-medium text-text-med uppercase tracking-wider">Type</p>
            <p className="text-sm text-text-dark mt-0.5">
              Engineering: Software
              <span className="text-text-med text-xs block">SOP-0083 &sect;7.2.1.3</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-med uppercase tracking-wider">Priority</p>
            <p className="text-sm text-text-dark mt-0.5 font-medium">Major</p>
            <span className="text-text-med text-xs">SOP-0083 &sect;7.3.3</span>
          </div>
          <div>
            <p className="text-xs font-medium text-text-med uppercase tracking-wider">Initiated By</p>
            <p className="text-sm text-text-dark mt-0.5">T. O&apos;Donnell</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-med uppercase tracking-wider">Date</p>
            <p className="text-sm text-text-dark mt-0.5">{meta.dateInitiated}</p>
          </div>
        </div>
      </div>

      {/* Workflow Stepper */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-text-dark mb-6">Change Control Workflow</h3>
        <div className="relative">
          <div className="flex items-start justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex-1 relative flex flex-col items-center">
                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-0.5 ${
                      step.status === "Complete" ? "bg-green" : "bg-gray-200"
                    }`}
                  />
                )}

                {/* Step circle */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${stepCircleStyle(step.status)}`}
                >
                  {step.status === "Complete" ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step.stepNumber
                  )}
                </div>

                {/* Step info */}
                <div className="mt-3 text-center px-2">
                  <p className="text-xs font-semibold text-text-dark">{step.stepName}</p>
                  <p className="text-xs text-text-med mt-0.5 leading-tight">{step.description}</p>
                  <div className="mt-2">
                    <StatusBadge status={step.status} />
                  </div>

                  {isAdmin && (
                    <select
                      value={step.status}
                      onChange={(e) => handleStepStatusChange(step.id, e.target.value)}
                      className="mt-2 text-xs border border-gray-200 rounded px-1.5 py-1 text-text-dark bg-white focus:outline-none focus:ring-1 focus:ring-navy/30"
                    >
                      {STEP_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Implementation Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-text-dark">Implementation Actions</h3>
          <p className="text-xs text-text-med mt-0.5">
            Tasks required to complete the change request.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-header-bg">
                <th className="text-left px-4 py-3 font-semibold text-navy w-12">#</th>
                <th className="text-left px-4 py-3 font-semibold text-navy">Description</th>
                <th className="text-left px-4 py-3 font-semibold text-navy w-32">Owner</th>
                <th className="text-left px-4 py-3 font-semibold text-navy w-28">Target Date</th>
                <th className="text-center px-4 py-3 font-semibold text-navy w-32">Status</th>
                {isAdmin && (
                  <th className="text-center px-4 py-3 font-semibold text-navy w-20">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {actions.map((action) => (
                <tr key={action.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-text-med font-mono text-xs">{action.actionNumber}</td>
                  <td className="px-4 py-3 text-text-dark">{action.description}</td>
                  <td className="px-4 py-3 text-text-med">{action.owner}</td>
                  <td className="px-4 py-3 text-text-med text-sm">{action.targetDate || "\u2014"}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={action.status} />
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleActionStatusToggle(action.id, action.status)}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                          action.status === "Complete"
                            ? "bg-gray-100 text-text-med hover:bg-gray-200"
                            : "bg-green/10 text-green hover:bg-green/20"
                        }`}
                      >
                        {action.status === "Complete" ? "Undo" : "Done"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {actions.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-text-med">
                    No implementation actions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
