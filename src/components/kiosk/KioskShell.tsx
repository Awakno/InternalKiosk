"use client";

import dynamic from "next/dynamic";

// next/dynamic's ssr:false can only be called from a Client Component (it
// throws if used directly in a Server Component) -- this file exists solely
// to be that boundary. KioskApp is never rendered on the server, so there is
// structurally no hydration-mismatch class of bug to worry about here.
const KioskApp = dynamic(() => import("./KioskApp"), {
  ssr: false,
  loading: () => <div className="kiosk-boot-placeholder" />,
});

export function KioskShell() {
  return <KioskApp />;
}
