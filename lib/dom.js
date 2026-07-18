// Utilitaires DOM sûrs (pas d'innerHTML avec contenu non sûr)

export function createText(tag, text, className = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

export function createDiv(children = [], className = '') {
  const div = document.createElement('div');
  if (className) div.className = className;
  children.forEach(child => {
    if (typeof child === 'string') {
      div.appendChild(document.createTextNode(child));
    } else {
      div.appendChild(child);
    }
  });
  return div;
}

// Pour le contenu qui EST contrôlé (SVG icônes, HTML généré internement)
export function safeHTML(html) {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.firstElementChild;
}

export function clearAndAppend(parent, ...children) {
  while (parent.firstChild) parent.removeChild(parent.firstChild);
  children.forEach(child => {
    if (typeof child === 'string') {
      parent.appendChild(document.createTextNode(child));
    } else {
      parent.appendChild(child);
    }
  });
}
