export function JoursNav({ count, currentDay }: { count: number; currentDay: number }) {
  return (
    <nav id="jours">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={i === currentDay ? "actif" : ""} />
      ))}
    </nav>
  );
}
