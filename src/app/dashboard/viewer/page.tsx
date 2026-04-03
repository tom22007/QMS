"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { getSharePointUrl } from "@/lib/sharepoint";

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const docId = searchParams.get("docId") || "";
  const folder = searchParams.get("folder") || "";
  const filename = searchParams.get("filename") || "";

  const sharepointUrl = getSharePointUrl(folder, filename);
  // Office Online embed: works for OneDrive/SharePoint files when user is authenticated
  const embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(sharepointUrl)}`;
  // Direct web view (opens in Office Online if user is logged into SharePoint)
  const webViewUrl = `${sharepointUrl}?web=1`;

  const [iframeError, setIframeError] = useState(false);
  const [docData, setDocData] = useState<{ title: string; revision: string; notes: string } | null>(null);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((docs: { docId: string; title: string; revision: string; notes: string }[]) => {
        const doc = docs.find((d) => d.docId === docId);
        if (doc) setDocData({ title: doc.title, revision: doc.revision, notes: doc.notes });
      });
  }, [docId]);

  return (
    <div className="flex flex-col h-[calc(100vh-73px)] -m-8">
      {/* Viewer header */}
      <div className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-text-med hover:text-navy transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-navy text-sm">{docId}</span>
            {docData && (
              <>
                <span className="text-text-med text-sm">—</span>
                <span className="text-text-dark text-sm truncate">{docData.title}</span>
                <span className="text-xs text-text-med bg-gray-100 px-1.5 py-0.5 rounded">Rev {docData.revision}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={webViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-navy bg-navy/5 rounded-lg hover:bg-navy/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in SharePoint
          </a>
          <a
            href={sharepointUrl}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-med bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>
      </div>

      {/* Document viewer */}
      {!iframeError ? (
        <div className="flex-1 bg-gray-100">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            title={`Viewing ${docId}`}
            onError={() => setIframeError(true)}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <FallbackView
            docId={docId}
            docData={docData}
            webViewUrl={webViewUrl}
            sharepointUrl={sharepointUrl}
          />
        </div>
      )}
    </div>
  );
}

function FallbackView({
  docId,
  docData,
  webViewUrl,
  sharepointUrl,
}: {
  docId: string;
  docData: { title: string; revision: string; notes: string } | null;
  webViewUrl: string;
  sharepointUrl: string;
}) {
  return (
    <div className="text-center max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 bg-navy/5 rounded-2xl flex items-center justify-center">
        <svg className="w-8 h-8 text-navy/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-dark mb-1">{docId}</h3>
      {docData && (
        <p className="text-sm text-text-med mb-1">{docData.title} — Rev {docData.revision}</p>
      )}
      {docData?.notes && (
        <p className="text-xs text-text-med/60 mb-6 px-4">{docData.notes}</p>
      )}
      <p className="text-sm text-text-med mb-6">
        This document is stored in SharePoint. Sign in to your Microsoft account to view it inline, or use the links below.
      </p>
      <div className="flex flex-col gap-3">
        <a
          href={webViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-navy text-white rounded-lg font-medium text-sm hover:bg-navy-light transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open in Office Online
        </a>
        <a
          href={sharepointUrl}
          download
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 text-text-dark rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download from SharePoint
        </a>
      </div>
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-navy font-medium">Loading document...</div>
      </div>
    }>
      <ViewerContent />
    </Suspense>
  );
}
