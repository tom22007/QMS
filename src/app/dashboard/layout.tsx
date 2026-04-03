"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ActivityLog from "@/components/ActivityLog";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-navy font-medium">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-text-dark">Centron Presidio EMS — Helix GUI</h1>
              <p className="text-xs text-text-med">GAMP 5 V-Model Software Qualification</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-med">Rees Scientific Corporation</p>
              <p className="text-xs text-text-med/60">1007 Whitehead Road Ext., Trenton, NJ 08638</p>
            </div>
          </div>
        </div>
        <div className="p-8">{children}</div>
      </main>
      {session.user?.role === "admin" && <ActivityLog />}
    </div>
  );
}
