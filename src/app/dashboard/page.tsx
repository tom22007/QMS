import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const [documents, actionItems, auditItems] = await Promise.all([
    prisma.document.findMany(),
    prisma.actionItem.findMany(),
    prisma.auditChecklistItem.findMany(),
  ]);

  // Signatures: 40% weight
  const signableDocs = documents.filter(
    (d) => d.signatureStatus !== "N/A" && d.signatureStatus !== "No tags"
  );
  const signedDocs = documents.filter((d) => d.signatureStatus === "Signed");
  const needsSigDocs = documents.filter((d) => d.signatureStatus === "Needs signature");
  const sigPct = signableDocs.length > 0 ? (signedDocs.length / signableDocs.length) * 100 : 0;

  // Actions: 30% weight
  const completedActions = actionItems.filter((a) => a.status === "Complete");
  const openActions = actionItems.filter((a) => a.status === "Open");
  const actionPct = actionItems.length > 0 ? (completedActions.length / actionItems.length) * 100 : 0;

  // Audit: 30% weight
  const checkedItems = auditItems.filter((a) => a.checked);
  const uncheckedItems = auditItems.filter((a) => !a.checked);
  const auditPct = auditItems.length > 0 ? (checkedItems.length / auditItems.length) * 100 : 0;

  const master = Math.round(sigPct * 0.4 + actionPct * 0.3 + auditPct * 0.3);

  // Build Next Steps: top priority tasks across all categories
  const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const nextSteps: { type: string; label: string; href: string; priority: string }[] = [];

  // High-priority open actions first
  const sortedActions = openActions
    .sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));
  for (const a of sortedActions.slice(0, 2)) {
    nextSteps.push({
      type: "action",
      label: a.description,
      href: "/dashboard/actions",
      priority: a.priority,
    });
  }

  // Unsigned docs
  for (const d of needsSigDocs.slice(0, 2)) {
    nextSteps.push({
      type: "signature",
      label: `Route ${d.docId} for e-signature`,
      href: "/dashboard/signatures",
      priority: "High",
    });
  }

  // Unchecked audit items
  for (const a of uncheckedItems.slice(0, 1)) {
    nextSteps.push({
      type: "audit",
      label: a.description,
      href: "/dashboard/audit",
      priority: "Medium",
    });
  }

  const typeIcons: Record<string, string> = {
    action: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    signature: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
    audit: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  };

  const priorityColors: Record<string, string> = {
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-green-50 text-green-700 border-green-200",
  };

  const breakdowns = [
    {
      label: "Signatures",
      pct: Math.round(sigPct),
      detail: `${signedDocs.length}/${signableDocs.length} signed`,
      weight: 40,
      weighted: Math.round(sigPct * 0.4 * 10) / 10,
      color: "bg-navy",
    },
    {
      label: "Action Items",
      pct: Math.round(actionPct),
      detail: `${completedActions.length}/${actionItems.length} complete`,
      weight: 30,
      weighted: Math.round(actionPct * 0.3 * 10) / 10,
      color: "bg-accent",
    },
    {
      label: "Audit Checklist",
      pct: Math.round(auditPct),
      detail: `${checkedItems.length}/${auditItems.length} checked`,
      weight: 30,
      weighted: Math.round(auditPct * 0.3 * 10) / 10,
      color: "bg-green",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-dark">Dashboard Overview</h2>
        <p className="text-sm text-text-med mt-1">
          Compliance status for Centron Presidio EMS — Helix GUI qualification
        </p>
      </div>

      {/* Master Compliance Score */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-8">
          {/* Circular progress */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="64" cy="64" r="56"
                fill="none"
                stroke={master >= 75 ? "#5BA544" : master >= 40 ? "#D97706" : "#D85A30"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(master / 100) * 351.86} 351.86`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-text-dark">{master}%</span>
              <span className="text-xs text-text-med">Compliance</span>
            </div>
          </div>

          {/* Breakdowns */}
          <div className="flex-1 space-y-4">
            {breakdowns.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text-dark">{b.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-med">{b.detail}</span>
                    <span className="text-sm font-semibold text-text-dark">{b.pct}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`${b.color} rounded-full h-2 transition-all`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                <p className="text-xs text-text-med/60 mt-0.5">
                  {b.weighted} of {b.weight} pts ({b.weight}% weight)
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-text-dark">What to Do Next</h3>
            <span className="text-xs text-text-med">Top priority tasks</span>
          </div>
          <div className="divide-y">
            {nextSteps.map((step, i) => (
              <Link
                key={i}
                href={step.href}
                className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center group-hover:bg-navy/10 transition-colors">
                  <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={typeIcons[step.type]} />
                  </svg>
                </div>
                <span className="flex-1 text-sm text-text-dark group-hover:text-navy transition-colors">{step.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${priorityColors[step.priority]}`}>
                  {step.priority}
                </span>
                <svg className="w-4 h-4 text-text-med/40 group-hover:text-navy transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Info panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-text-dark mb-4">System Information</h3>
          <dl className="space-y-3">
            {[
              ["System", "Centron Presidio EMS — Helix GUI"],
              ["Methodology", "GAMP 5 V-Model"],
              ["Software Category", "Category 4 — Configured Product"],
              ["Organization", "Rees Scientific Corporation"],
              ["Location", "1007 Whitehead Road Ext., Trenton, NJ 08638"],
            ].map(([label, value], i, arr) => (
              <div key={label} className={`flex justify-between ${i < arr.length - 1 ? "border-b border-gray-100 pb-2" : ""}`}>
                <dt className="text-sm text-text-med">{label}</dt>
                <dd className="text-sm font-medium text-text-dark">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-text-dark mb-4">Quick Stats</h3>
          <dl className="space-y-3">
            {[
              ["Total Documents", String(documents.length), "text-text-dark"],
              ["Signatures Complete", String(signedDocs.length), "text-green"],
              ["Awaiting Signature", String(needsSigDocs.length), "text-accent"],
              ["Open Action Items", String(openActions.length), "text-accent"],
              ["Audit Items Done", `${checkedItems.length}/${auditItems.length}`, "text-navy"],
            ].map(([label, value, color], i, arr) => (
              <div key={label} className={`flex justify-between ${i < arr.length - 1 ? "border-b border-gray-100 pb-2" : ""}`}>
                <dt className="text-sm text-text-med">{label}</dt>
                <dd className={`text-sm font-medium ${color}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
