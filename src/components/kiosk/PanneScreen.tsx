export function PanneScreen({ visible }: { visible: boolean }) {
  return (
    <div id="panne" className={visible ? "visible" : ""}>
      <h1>Pas de données météo</h1>
      <p>Vérifie la connexion réseau du Raspberry Pi</p>
    </div>
  );
}
