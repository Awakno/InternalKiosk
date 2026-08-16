// Les pastilles ne sont plus de simples témoins : sur un écran tactile,
// atteindre le jour 4 en quatre balayages successifs est pénible alors que
// la cible directe est déjà affichée. La pastille reste visuellement fine,
// c'est sa zone tactile qui est élargie (cf. #jours button::after).
export function JoursNav({ count, currentDay, onSelect }: { count: number; currentDay: number; onSelect: (n: number) => void }) {
  return (
    <nav id="jours">
      {Array.from({ length: count }, (_, i) => (
        <button key={i} type="button" aria-label={i === 0 ? "Aujourd'hui" : `Jour +${i}`} aria-current={i === currentDay} onClick={() => onSelect(i)}>
          <span className={i === currentDay ? "actif" : ""} />
        </button>
      ))}
    </nav>
  );
}
