"use client";

import DocLink from "@/components/DocLink";
import StatusBadge from "@/components/StatusBadge";

interface RiskDistribution {
  critical: number;
  moderate: number;
  low: number;
}

interface RiskAssessment {
  docId: string;
  title: string;
  type: string;
  folder: string;
  filename: string;
  totalItems: number;
  itemLabel: string;
  initial: RiskDistribution;
  residual: RiskDistribution;
}

interface CoverageItem {
  label: string;
  percentage: number;
}

const riskAssessments: RiskAssessment[] = [
  {
    docId: "RA-0001",
    title: "Failure Mode and Effects Analysis (FMEA)",
    type: "FMEA",
    folder: "Risk Analysis",
    filename: "RA-0001.pdf",
    totalItems: 20,
    itemLabel: "failure modes",
    initial: { critical: 0, moderate: 8, low: 12 },
    residual: { critical: 0, moderate: 0, low: 20 },
  },
  {
    docId: "RA-2026-0003",
    title: "Software Release Risk Assessment",
    type: "Release",
    folder: "Risk Analysis",
    filename: "RA-2026-0003.pdf",
    totalItems: 18,
    itemLabel: "gaps",
    initial: { critical: 4, moderate: 14, low: 0 },
    residual: { critical: 0, moderate: 0, low: 18 },
  },
];

const coverageItems: CoverageItem[] = [
  { label: "URS \u2192 IQ/OQ", percentage: 100 },
  { label: "URS \u2192 FS", percentage: 97 },
  { label: "URS \u2192 DS", percentage: 47 },
  { label: "URS \u2192 RA", percentage: 65 },
];

function RiskBar({ distribution, total, label }: { distribution: RiskDistribution; total: number; label: string }) {
  const critPct = (distribution.critical / total) * 100;
  const modPct = (distribution.moderate / total) * 100;
  const lowPct = (distribution.low / total) * 100;

  return (
    <div>
      <p className="text-xs font-medium text-text-med uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex h-7 rounded-lg overflow-hidden bg-gray-100">
        {distribution.critical > 0 && (
          <div
            className="flex items-center justify-center text-xs font-semibold text-white"
            style={{ width: `${critPct}%`, backgroundColor: "#DC2626" }}
            title={`Critical: ${distribution.critical}`}
          >
            {distribution.critical}
          </div>
        )}
        {distribution.moderate > 0 && (
          <div
            className="flex items-center justify-center text-xs font-semibold text-white"
            style={{ width: `${modPct}%`, backgroundColor: "#D97706" }}
            title={`Moderate: ${distribution.moderate}`}
          >
            {distribution.moderate}
          </div>
        )}
        {distribution.low > 0 && (
          <div
            className="flex items-center justify-center text-xs font-semibold text-white"
            style={{ width: `${lowPct}%`, backgroundColor: "#5BA544" }}
            title={`Low: ${distribution.low}`}
          >
            {distribution.low}
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-1.5">
        <span className="flex items-center gap-1 text-xs text-text-med">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#DC2626" }} />
          Critical: {distribution.critical}
        </span>
        <span className="flex items-center gap-1 text-xs text-text-med">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#D97706" }} />
          Moderate: {distribution.moderate}
        </span>
        <span className="flex items-center gap-1 text-xs text-text-med">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#5BA544" }} />
          Low: {distribution.low}
        </span>
      </div>
    </div>
  );
}

function CoverageBar({ label, percentage }: CoverageItem) {
  const barColor =
    percentage >= 90 ? "bg-green" : percentage >= 60 ? "bg-amber-500" : "bg-accent";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-text-dark w-28 shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-text-dark w-12 text-right">{percentage}%</span>
    </div>
  );
}

export default function RiskPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-dark">Risk Summary</h2>
        <p className="text-sm text-text-med mt-1">
          Risk assessment distributions, deviation tracking, and traceability coverage.
        </p>
      </div>

      {/* Risk Assessment Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {riskAssessments.map((ra) => (
          <div key={ra.docId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <DocLink docId={ra.docId} folder={ra.folder} filename={ra.filename} />
                <h3 className="text-sm font-semibold text-text-dark mt-1">{ra.title}</h3>
                <p className="text-xs text-text-med mt-0.5">
                  {ra.totalItems} {ra.itemLabel} assessed
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-header-bg px-2.5 py-0.5 text-xs font-medium text-navy">
                {ra.type}
              </span>
            </div>

            <div className="space-y-5">
              <RiskBar distribution={ra.initial} total={ra.totalItems} label="Initial Risk" />
              <RiskBar distribution={ra.residual} total={ra.totalItems} label="Residual Risk" />
            </div>
          </div>
        ))}
      </div>

      {/* Deviation Tracker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-text-dark">Deviation Tracker</h3>
          <p className="text-xs text-text-med mt-0.5">
            Protocol deviations identified during qualification execution.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-header-bg">
                <th className="text-left px-4 py-3 font-semibold text-navy">Deviation ID</th>
                <th className="text-left px-4 py-3 font-semibold text-navy">Test Ref</th>
                <th className="text-center px-4 py-3 font-semibold text-navy">Severity</th>
                <th className="text-center px-4 py-3 font-semibold text-navy">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-navy">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-text-dark">DEV-001</td>
                <td className="px-4 py-3 text-text-med font-mono text-xs">OQ-10.5</td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status="Minor" />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status="Closed" />
                </td>
                <td className="px-4 py-3 text-text-dark text-sm max-w-md">
                  Alarm email not received due to email server config. Corrected and re-verified same session.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* RTM Coverage */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <DocLink docId="RTM-0001" folder="Traceability" filename="RTM-0001.pdf" />
            </div>
            <h3 className="text-base font-semibold text-text-dark mt-1">
              Requirements Traceability Matrix Coverage
            </h3>
            <p className="text-xs text-text-med mt-0.5">
              Traceability coverage from URS requirements to downstream deliverables.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {coverageItems.map((item) => (
            <CoverageBar key={item.label} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
