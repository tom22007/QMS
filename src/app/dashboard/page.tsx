import { prisma } from "@/lib/db";
import MetricCard from "@/components/MetricCard";

export default async function DashboardPage() {
  const documents = await prisma.document.findMany();
  const actionItems = await prisma.actionItem.findMany();

  const totalDocs = documents.length;

  const signableDocs = documents.filter(
    (d) => d.signatureStatus !== "N/A" && d.signatureStatus !== "No tags"
  );
  const signedDocs = documents.filter((d) => d.signatureStatus === "Signed");
  const needsSigDocs = documents.filter(
    (d) => d.signatureStatus === "Needs signature"
  );
  const naDocs = documents.filter(
    (d) => d.signatureStatus === "N/A" || d.signatureStatus === "No tags"
  );

  const compliancePct =
    signableDocs.length > 0
      ? Math.round((signedDocs.length / signableDocs.length) * 100)
      : 0;

  const openActions = actionItems.filter((a) => a.status === "Open");

  const activeDocs = documents.filter((d) => d.draftStatus === "Active" || d.draftStatus === "Approved" || d.draftStatus === "Executed");
  const draftDocs = documents.filter((d) => d.draftStatus === "Draft" || d.draftStatus === "Template");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-dark">Dashboard Overview</h2>
        <p className="text-sm text-text-med mt-1">
          Compliance status for Centron Presidio EMS — Helix GUI qualification
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Overall Compliance"
          value={`${compliancePct}%`}
          subtitle={`${signedDocs.length} of ${signableDocs.length} signable docs signed`}
          color="green"
        />
        <MetricCard
          title="Documents"
          value={totalDocs}
          subtitle={`${signedDocs.length} signed / ${needsSigDocs.length} needs sig / ${naDocs.length} N/A`}
          color="navy"
        />
        <MetricCard
          title="Signatures Needed"
          value={needsSigDocs.length}
          subtitle={needsSigDocs.length > 0 ? "Action required" : "All current"}
          color="accent"
        />
        <MetricCard
          title="Open Actions"
          value={openActions.length}
          subtitle={openActions.length > 0 ? `${openActions.length} items need attention` : "No open items"}
          color={openActions.length > 0 ? "accent" : "green"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-text-dark mb-4">System Information</h3>
          <dl className="space-y-3">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-text-med">System</dt>
              <dd className="text-sm font-medium text-text-dark">
                Centron Presidio EMS — Helix GUI
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-text-med">Methodology</dt>
              <dd className="text-sm font-medium text-text-dark">
                GAMP 5 V-Model
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-text-med">Software Category</dt>
              <dd className="text-sm font-medium text-text-dark">
                Category 4 — Configured Product
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-text-med">Organization</dt>
              <dd className="text-sm font-medium text-text-dark">
                Rees Scientific Corporation
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-text-med">Location</dt>
              <dd className="text-sm font-medium text-text-dark">
                1007 Whitehead Road Ext., Trenton, NJ 08638
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-text-dark mb-4">Document Summary</h3>
          <dl className="space-y-3">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-text-med">Active / Approved / Executed</dt>
              <dd className="text-sm font-medium text-green">{activeDocs.length}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-text-med">Draft / Template</dt>
              <dd className="text-sm font-medium text-text-dark">{draftDocs.length}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-text-med">Signatures Complete</dt>
              <dd className="text-sm font-medium text-green">{signedDocs.length}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-text-med">Awaiting Signature</dt>
              <dd className="text-sm font-medium text-accent">{needsSigDocs.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-text-med">Total Documents</dt>
              <dd className="text-sm font-medium text-text-dark">{totalDocs}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
