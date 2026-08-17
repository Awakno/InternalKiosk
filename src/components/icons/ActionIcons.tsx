// Icônes du tableau d'actions -- même convention que WeatherIcons.tsx
// (viewBox 0 0 64 64, fill="currentColor", couleur pilotée par le CSS
// parent plutôt que codée en dur dans le SVG).

export function LightBulbIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor">
      {on && (
        <g strokeLinecap="round" strokeWidth={2.6} opacity={0.85}>
          <line x1={32} y1={2} x2={32} y2={9} />
          <line x1={11.5} y1={11.5} x2={16.5} y2={16.5} />
          <line x1={52.5} y1={11.5} x2={47.5} y2={16.5} />
          <line x1={4} y1={30} x2={11} y2={30} />
          <line x1={60} y1={30} x2={53} y2={30} />
        </g>
      )}
      <path
        d="M32 10c-9.4 0-17 7.6-17 17 0 6.5 3.6 10.9 6.6 14.2 1.7 1.9 2.9 3.3 2.9 4.8v3h15v-3c0-1.5 1.2-2.9 2.9-4.8 3-3.3 6.6-7.7 6.6-14.2 0-9.4-7.6-17-17-17Z"
        strokeWidth={3}
        fill={on ? "currentColor" : "none"}
        fillOpacity={on ? 0.18 : 0}
      />
      <line x1={24.5} y1={53} x2={39.5} y2={53} strokeWidth={3} strokeLinecap="round" />
      <line x1={26} y1={59} x2={38} y2={59} strokeWidth={3} strokeLinecap="round" />
      <path d="M27 39c-2.6-2.4-4-5.1-4-8.5C23 24.7 27 20 32 20" strokeWidth={2.4} strokeLinecap="round" opacity={0.55} />
    </svg>
  );
}
