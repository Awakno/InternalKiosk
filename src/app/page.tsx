import { KioskShell } from "@/components/kiosk/KioskShell";

// Server Component, deliberately minimal: the kiosk is a 100% client-driven
// display (touch gestures, a live clock, an ambient color that's a function
// of Date.now() and sun position) with zero SEO/content value from SSR.
// KioskShell loads the real app with ssr:false so there is nothing here
// for the server to render and nothing that could ever mismatch on hydrate.
export default function Page() {
  return <KioskShell />;
}
