"use client";

import { FeatureFlagsProvider } from "@/lib/useFeature";
import type { FeatureFlag } from "@/lib/feature-flags";

export default function AdminFlagsProvider({
  flags,
  children,
}: {
  flags: Partial<Record<FeatureFlag, boolean>>;
  children: React.ReactNode;
}) {
  return <FeatureFlagsProvider initial={flags}>{children}</FeatureFlagsProvider>;
}
