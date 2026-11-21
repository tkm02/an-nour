import { useCallback, useMemo, useState } from "react";
import { premierChampEnErreur } from "../../utils/recensementCo/validation";

/**
 * Validation en temps réel d'une étape : un champ affiche son erreur dès qu'il a été quitté (blur) ou après une
 * tentative de validation de l'étape ; les erreurs renvoyées par l'API (422) s'affichent jusqu'à modification.
 * `verifier()` renvoie true si l'étape est valide, sinon place le focus sur le premier champ en erreur.
 */
const useValidationEtape = ({ valeurs, valider, ordre, prefixeId, erreursServeur = {} }) => {
  const [touches, setTouches] = useState({});
  const [soumis, setSoumis] = useState(false);
  const erreursClient = useMemo(() => valider(valeurs), [valider, valeurs]);

  const erreurs = useMemo(() => {
    const visibles = {};
    for (const champ of ordre) {
      if ((soumis || touches[champ]) && erreursClient[champ]) {
        visibles[champ] = erreursClient[champ];
      } else if (erreursServeur[champ]) {
        visibles[champ] = erreursServeur[champ];
      }
    }
    return visibles;
  }, [ordre, soumis, touches, erreursClient, erreursServeur]);

  const marquer = useCallback((champ) => setTouches((t) => (t[champ] ? t : { ...t, [champ]: true })), []);

  const verifier = useCallback(() => {
    setSoumis(true);
    const toutes = { ...erreursServeur, ...erreursClient };
    const premier = premierChampEnErreur(toutes, ordre);
    if (premier) {
      const element = document.getElementById(`${prefixeId}${premier}`);
      if (element) element.focus();
      return false;
    }
    return true;
  }, [erreursClient, erreursServeur, ordre, prefixeId]);

  return { erreurs, marquer, verifier };
};

export default useValidationEtape;
