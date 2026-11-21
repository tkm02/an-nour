// src/utils/commun/useAttenteLongue.js
// Vrai lorsqu'une attente (`actif`) dure depuis plus de `delai` ms : l'API gratuite (Render) peut mettre ~50 s à
// démarrer, l'interface l'explique alors au lieu de sembler bloquée. Commun aux formulaires publics.
import { useEffect, useState } from "react";

export const DELAI_MESSAGE_ATTENTE_MS = 6000;

const useAttenteLongue = (actif, delai = DELAI_MESSAGE_ATTENTE_MS) => {
  const [longue, setLongue] = useState(false);
  useEffect(() => {
    if (!actif) {
      setLongue(false);
      return undefined;
    }
    const minuterie = setTimeout(() => setLongue(true), delai);
    return () => clearTimeout(minuterie);
  }, [actif, delai]);
  return longue;
};

export default useAttenteLongue;
