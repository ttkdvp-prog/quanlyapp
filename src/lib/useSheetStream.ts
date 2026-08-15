import { useEffect, useRef, useState } from "react";
import { api, parseApp } from "./apiClient";
import type { ParsedApp } from "../types";

interface StreamState {
  rows: ParsedApp[];
  version: number;
  status: "idle" | "polling" | "error";
  error: string | null;
}

export function useSheetStream(
  table: string,
  initialRows: ParsedApp[],
  opts: { intervalMs?: number } = {}
) {
  const { intervalMs = 30_000 } = opts;
  const [state, setState] = useState<StreamState>({
    rows: initialRows,
    version: 0,
    status: "idle",
    error: null,
  });
  const versionRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initial rows from query
  useEffect(() => {
    setState((s) => ({ ...s, rows: initialRows }));
  }, [initialRows]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      setState((s) => ({ ...s, status: "polling" }));
      try {
        const env = await api.stream<ParsedApp>(table, versionRef.current);
        if (cancelled) return;
        if (env.data && env.data.length > 0) {
          setState((s) => {
            const map = new Map(s.rows.map((r) => [r.id, r]));
            for (const row of env.data) {
              const parsed = parseApp(row as any);
              if (parsed.deleted === true || String(parsed.deleted).toUpperCase() === "TRUE") {
                map.delete(parsed.id);
              } else {
                map.set(parsed.id, parsed);
              }
            }
            return { ...s, rows: Array.from(map.values()), status: "idle" };
          });
        } else {
          setState((s) => ({ ...s, status: "idle" }));
        }
        if (env.version) versionRef.current = env.version;
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            status: "error",
            error: err instanceof Error ? err.message : "Poll error",
          }));
        }
      }

      if (!cancelled) {
        const delay = document.hidden ? intervalMs * 3 : intervalMs;
        timerRef.current = setTimeout(poll, delay);
      }
    }

    timerRef.current = setTimeout(poll, intervalMs);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [table, intervalMs]);

  return state;
}
