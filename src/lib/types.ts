// Contrat commun à tous les modules (météo exceptée, qui pilote l'écran
// principal directement) : chaque hook de données renvoie cette forme,
// et le carrousel de widgets ne regarde que isReady/isRelevant pour
// décider s'il affiche la carte -- portage mécanique de l'ancien contrat
// Module.isReady()/isRelevant()/renderCard()/renderDetail() en données +
// composants JSX plutôt que chaînes HTML.
export interface ModuleResult<T> {
  data: T | null;
  isReady: boolean;
  isRelevant: boolean;
}
