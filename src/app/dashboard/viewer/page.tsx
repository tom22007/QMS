"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const SHAREPOINT_BASE =
  "https://reesscientific0-my.sharepoint.com/personal/todonnell_reesscientific_com/Documents/Claude%20-%20Rees%20Software%20Validation%20Documents";

interface DocData {
  title: string;
  revision: string;
  notes: string;
  draftStatus: string;
  signatureStatus: string;
  folder: string;
  filename: string;
}

interface CommentData {
  id: number;
  docId: string;
  username: string;
  name: string;
  text: string;
  createdAt: string;
}

interface SignatureData {
  id: number;
  docId: string;
  signerName: string;
  role: string;
  status: string;
  completedAt: string | null;
}

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const currentUser = (session?.user as { username?: string })?.username ?? "";
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const docId = searchParams.get("docId") || "";
  const folder = searchParams.get("folder") || "";
  const filename = searchParams.get("filename") || "";

  const webViewUrl = `${SHAREPOINT_BASE}/${folder}/${encodeURIComponent(filename)}?web=1`;

  const [docData, setDocData] = useState<DocData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/comments?docId=${encodeURIComponent(docId)}`);
    if (res.ok) setComments(await res.json());
  }, [docId]);

  useEffect(() => {
    if (!docId) return;

    fetch("/api/documents")
      .then((r) => r.json())
      .then((docs: (DocData & { docId: string })[]) => {
        const doc = docs.find((d) => d.docId === docId);
        if (doc) setDocData(doc);
      });

    fetch("/api/signatures")
      .then((r) => r.json())
      .then((sigs: SignatureData[]) => {
        setSignatures(sigs.filter((s) => s.docId === docId));
      });

    fetchComments();
  }, [docId, fetchComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, text: newComment }),
      });
      if (res.ok) {
        setNewComment("");
        fetchComments();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: number) => {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) fetchComments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Final": case "Signed": return "bg-green/10 text-green";
      case "In Progress": case "Pending": return "bg-amber-100 text-amber-700";
      case "Draft": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-text-med";
    }
  };

  const fileExt = filename.split(".").pop()?.toLowerCase() || "";
  const fileIcon = fileExt === "pdf" ? "PDF" : fileExt === "xlsx" ? "XLS" : "DOC";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-text-med hover:text-navy transition-colors mb-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="text-2xl font-bold text-text-dark flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-navy/10 text-navy text-xs font-bold">
              {fileIcon}
            </span>
            {docId}
          </h2>
          {docData && (
            <p className="text-text-med mt-1">{docData.title}</p>
          )}
        </div>
        <a
          href={webViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-navy rounded-lg hover:bg-navy/90 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open in Office Online
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Document details + Signatures */}
        <div className="lg:col-span-1 space-y-6">
          {/* Document Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-dark uppercase tracking-wider">Document Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-med">Revision</span>
                <span className="font-medium text-text-dark">{docData?.revision ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-med">Folder</span>
                <span className="font-medium text-text-dark">{folder}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-med">File</span>
                <span className="font-medium text-text-dark text-xs truncate max-w-[180px]">{filename}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-text-med">Draft Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(docData?.draftStatus ?? "")}`}>
                  {docData?.draftStatus ?? "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-text-med">Signatures</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(docData?.signatureStatus ?? "")}`}>
                  {docData?.signatureStatus ?? "—"}
                </span>
              </div>
            </div>
            {docData?.notes && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-text-med">{docData.notes}</p>
              </div>
            )}
          </div>

          {/* Signature Status */}
          {signatures.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-text-dark uppercase tracking-wider">Signers</h3>
              <div className="space-y-2">
                {signatures.sort((a, b) => a.id - b.id).map((sig) => (
                  <div key={sig.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-text-dark">{sig.signerName}</span>
                      <span className="text-text-med text-xs ml-1.5">({sig.role})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sig.status)}`}>
                      {sig.status === "Signed" ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Signed
                        </span>
                      ) : sig.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — Comments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-text-dark uppercase tracking-wider">
                Comments
                <span className="ml-2 text-text-med font-normal normal-case">
                  ({comments.length})
                </span>
              </h3>
            </div>

            {/* Comment input */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-navy">
                    {(session?.user?.name ?? "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment about this document..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-text-dark placeholder:text-text-med/50 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleSubmitComment();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-med/50">
                      {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Enter to submit
                    </span>
                    <button
                      onClick={handleSubmitComment}
                      disabled={submitting || !newComment.trim()}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-navy rounded-lg hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? "Posting..." : "Comment"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comment list */}
            <div className="divide-y divide-gray-100">
              {comments.length === 0 ? (
                <div className="px-5 py-10 text-center text-text-med text-sm">
                  No comments yet. Be the first to add a note about this document.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors group">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-navy">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-dark">{c.name}</span>
                          <span className="text-xs text-text-med/60">
                            {new Date(c.createdAt).toLocaleDateString()} at{" "}
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {(c.username === currentUser || isAdmin) && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="ml-auto opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-all"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-text-dark mt-1 whitespace-pre-wrap">{c.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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
