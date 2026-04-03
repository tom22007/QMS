"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

interface ComplianceData {
  master: number;
  signatures: { signed: number; signable: number; pct: number; weighted: number };
  actions: { complete: number; total: number; pct: number; weighted: number };
  audit: { checked: number; total: number; pct: number; weighted: number };
  sidebar: { openActions: number; needsSig: number; auditChecked: number; auditTotal: number };
}

interface ComplianceContextValue {
  data: ComplianceData | null;
  loading: boolean;
  refresh: () => Promise<ComplianceData | null>;
}

const ComplianceContext = createContext<ComplianceContextValue>({
  data: null,
  loading: true,
  refresh: async () => null,
});

export function useCompliance() {
  return useContext(ComplianceContext);
}

export function ComplianceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/compliance");
      if (res.ok) {
        const newData = await res.json();
        setData(newData);
        setLoading(false);
        return newData;
      }
    } catch {
      // ignore
    }
    setLoading(false);
    return null;
  }, []);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  return (
    <ComplianceContext.Provider value={{ data, loading, refresh }}>
      {children}
    </ComplianceContext.Provider>
  );
}
