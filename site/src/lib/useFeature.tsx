"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  FEATURE_FLAG_COOKIE,
  parseOverrideCookie,
  type FeatureFlag,
} from "./feature-flags";

type Snapshot = Partial<Record<FeatureFlag, boolean>>;

const FeatureFlagsContext = createContext<Snapshot>({});

export function FeatureFlagsProvider({
  initial,
  children,
}: {
  initial: Snapshot;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot>(initial);

  useEffect(() => {
    // Layer client-side cookie overrides on top of the SSR snapshot.
    if (typeof document === "undefined") return;
    const match = document.cookie.split("; ").find((c) => c.startsWith(`${FEATURE_FLAG_COOKIE}=`));
    if (!match) return;
    try {
      const raw = decodeURIComponent(match.slice(FEATURE_FLAG_COOKIE.length + 1));
      const overrides = parseOverrideCookie(raw);
      if (Object.keys(overrides).length === 0) return;
      setSnapshot((prev) => ({ ...prev, ...(overrides as Snapshot) }));
    } catch {
      /* ignore */
    }
  }, []);

  return <FeatureFlagsContext.Provider value={snapshot}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeature(name: FeatureFlag): boolean {
  const ctx = useContext(FeatureFlagsContext);
  return Boolean(ctx[name]);
}
