"use client";

import { useEffect, useState } from "react";
import type { WidgetEntry } from "@/hooks/useModules";

export interface ModuleCarouselProps {
  widgets: WidgetEntry[];
  activeIndex: number;
  onOpen: (id: string) => void;
}

// Note : contrairement à l'ancien peindreModules() (qui comparait une
// "empreinte" id|label|valeur pour ne re-fondre que si le CONTENU changeait
// vraiment), ce portage ne refait le fondu que quand le WIDGET affiché
// change (rotation du carrousel). Une mise à jour de donnée en place (ex.
// le % CPU qui bouge) s'affiche donc instantanément plutôt qu'en fondu --
// différence mineure et assumée, pas un bug fonctionnel.
export function ModuleCarousel({ widgets, activeIndex, onOpen }: ModuleCarouselProps) {
  const qualifies = widgets.filter((w) => w.isReady && w.isRelevant);
  const clamped = activeIndex >= qualifies.length ? 0 : activeIndex;
  const current = qualifies[clamped] ?? null;

  const [displayedId, setDisplayedId] = useState<string | null>(current?.id ?? null);
  const [corpsOpacity, setCorpsOpacity] = useState(1);

  useEffect(() => {
    if (!current || current.id === displayedId) return;
    // Fondu enchaîné (sortie -> swap de contenu -> entrée) : le setState
    // synchrone ici est intentionnel, ce n'est pas de l'état dérivable --
    // il n'y a pas d'équivalent "calculé au rendu" pour une séquence
    // temporisée comme celle-ci.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCorpsOpacity(0);
    const timer = setTimeout(() => {
      setDisplayedId(current.id);
      setCorpsOpacity(1);
    }, 220);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ne dépend que de l'id, pas de displayedId
  }, [current?.id]);

  if (!current) {
    return <div id="modules" />;
  }

  const displayed = qualifies.find((w) => w.id === displayedId) ?? current;
  const card = displayed.renderCard();
  if (!card) {
    return <div id="modules" />;
  }

  return (
    <div id="modules" className="visible" onClick={() => onOpen(current.id)}>
      <div id="modules-corps" style={{ opacity: corpsOpacity }}>
        {card}
      </div>
      {qualifies.length > 1 && (
        <div id="modules-points">
          {qualifies.map((w, i) => (
            <span key={w.id} className={i === clamped ? "actif" : ""} />
          ))}
        </div>
      )}
    </div>
  );
}
