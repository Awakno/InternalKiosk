// Classe de base pour tous les modules
// Implémente l'interface commune : load, isReady, isRelevant, renderCard, renderDetail

export class Module {
  constructor(id, config = {}) {
    this.id = id;
    this.config = config;
    this.data = null;
    this.error = null;
  }

  // Charge les données depuis l'API
  async load() {
    throw new Error(`Module ${this.id} doit implémenter load()`);
  }

  // Les données sont-elles disponibles?
  isReady() {
    return this.data !== null;
  }

  // Faut-il l'afficher maintenant? (ex: vacances = non, 4 mois à l'avance)
  isRelevant() {
    return true;
  }

  // Rendu du carrousel : { label, valeur }
  renderCard() {
    throw new Error(`Module ${this.id} doit implémenter renderCard()`);
  }

  // Rendu détail (HTML, fenêtre plein écran)
  renderDetail() {
    throw new Error(`Module ${this.id} doit implémenter renderDetail()`);
  }

  // Ouvre la fenêtre détail
  open() {
    const fenetreCorps = document.getElementById('fenetre-corps');
    // Vider et ajouter le contenu
    while (fenetreCorps.firstChild) fenetreCorps.removeChild(fenetreCorps.firstChild);

    const detail = this.renderDetail();
    if (typeof detail === 'string') {
      // Si c'est du HTML, créer un wrapper temporaire
      const wrapper = document.createElement('div');
      wrapper.innerHTML = detail;
      while (wrapper.firstChild) fenetreCorps.appendChild(wrapper.firstChild);
    } else {
      fenetreCorps.appendChild(detail);
    }

    const retour = document.createElement('div');
    retour.className = 'retour';
    retour.textContent = '✕ ou glisser pour revenir';
    fenetreCorps.appendChild(retour);

    document.getElementById('fenetre').classList.add('ouverte');
    document.body.classList.add('fenetre-ouverte');
  }

  // Ferme la fenêtre
  static close() {
    document.getElementById('fenetre').classList.remove('ouverte');
    document.body.classList.remove('fenetre-ouverte');
  }
}
