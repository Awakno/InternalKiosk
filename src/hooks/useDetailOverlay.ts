"use client";

import { useCallback, useState } from "react";

export function useDetailOverlay() {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const open = useCallback((id: string) => setActiveModuleId(id), []);
  const close = useCallback(() => setActiveModuleId(null), []);
  return { activeModuleId, isOpen: activeModuleId !== null, open, close };
}
