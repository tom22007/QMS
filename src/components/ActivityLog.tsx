"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  id: number;
  timestamp: string;
  username: string;
  action: string;
  previousValue: string;
  newValue: string;
}

export default function ActivityLog() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/activity-log")
        .then((r) => r.json())
        .then(setLogs);
    }
  }, [open]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="bg-navy text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-navy-light transition-colors"
      >
        {open ? "Close" : "Activity Log"}
      </button>
      {open && (
        <div className="absolute bottom-12 right-0 w-96 max-h-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-semibold text-sm text-text-dark">Activity Log</h3>
          </div>
          <div className="overflow-y-auto max-h-80 p-2">
            {logs.length === 0 ? (
              <p className="text-center text-text-med text-sm py-8">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="px-3 py-2 bg-gray-50 rounded-lg text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-text-dark">{log.username}</span>
                      <span className="text-text-med">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-text-med mt-0.5">{log.action}</p>
                    {log.previousValue && (
                      <p className="text-text-med/60 mt-0.5">
                        {log.previousValue} → {log.newValue}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
