import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CoStepper from "../components/RecensementCo/CoStepper";
import StepIdentification from "../components/RecensementCo/StepIdentification";
import StepFiche from "../components/RecensementCo/StepFiche";
import StepRecapitulatif, { RecapitulatifFiche } from "../components/RecensementCo/StepRecapitulatif";
import {
  chargerConfiguration,
  envoyerPhoto,
  identifierMembre,
  soumettreFiche,
} from "../services/recensementCo";
import { completerAvecContact, contactAide } from "../utils/recensementCo/contact";
import {
  ErreurApi,
  interpreterErreur,
  interpreterErreurPhoto,
  MESSAGE_FERME,
  MESSAGE_FORMULAIRE_EXPIRE,
  MESSAGE_REFUS_REPETE,
  MESSAGE_SESSION,
  MESSAGE_VERROUILLEE,
} from "../utils/recensementCo/erreurs";
import {
  appliquerFicheSauvegardee,
  chargerProgression,
  effacerProgression,
  enregistrerProgression,
  memeIdentite,
} from "../utils/recensementCo/progression";
import {
  construireFiche,
  construireIdentification,
  construirePhoto,
  FICHE_VIDE,
  IDENTIFICATION_VIDE,
  libelleOfficiel,
  valeursFicheInitiales,
} from "../utils/recensementCo/requetes";
import {
  ANCIEN_NON,
  CHAMPS_FICHE,
  CHAMPS_IDENTIFICATION,
  qualitesPourCommission,
  VALEUR_AUCUNE_COMMISSION,
} from "../utils/recensementCo/validation";
import "./RecensementCoPage.css";

const ETAPES = ["Identité", "Fiche", "Envoi"];
const TITRES = {
  1: "Identifiez-vous",
  2: "Vérifiez et complétez votre fiche",
  3: "Récapitulatif et envoi",
  4: "Fiche enregistrée",
};
const TITRE_FICHE_NOUVEAU_MEMBRE = "Complétez votre fiche";
// L'API refuse une identification moins de 3 s après l'émission du jeton du formulaire : marge de sécurité
const DELAI_MINIMAL_MS = 3500;
const DELAI_MESSAGE_ATTENTE_MS = 6000;
const PHOTO_VIDE = { fichier: null, urlExistante: null, supprimerExistante: false };
const REQUETE_LIBRE = { enCours: false, erreur: null };
// « Commission inconnue » (422 texte de l'API) rattaché au champ concerné
const COMMISSION_INCONNUE = "commission inconnue";

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Identification reprise de l'onglet ; l'ancienne option « Nouveau membre / aucune » devient la réponse « Non ». */
const identificationRestauree = (sauvee) => {
  const valeurs = { ...IDENTIFICATION_VIDE, ...(sauvee || {}) };
  if (valeurs.commission_precedente === VALEUR_AUCUNE_COMMISSION) {
    valeurs.commission_precedente = "";
    if (!valeurs.ancien_membre) valeurs.ancien_membre = ANCIEN_NON;
  }
  return valeurs;
};

/** Vrai lorsque `actif` dure depuis plus de `delai` ms (démarrage à froid de l'API). */
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

/** Zone aria-live montée vide, puis remplie (sinon le premier message n'est pas annoncé). */
const MessageAttente = ({ actif, longue, texte }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(actif);
  }, [actif]);
  return (
    <div className="rco-attente" aria-live="polite">
      {visible && actif && (
        <p>
          <span className="rco-spinner" aria-hidden="true" /> {texte}
          {longue && (
            <span className="rco-attente-longue">
              Le serveur est en cours de démarrage, cela peut prendre jusqu'à une minute. Merci de patienter sans
              fermer la page.
            </span>
          )}
        </p>
      )}
    </div>
  );
};

/** Alerte d'erreur : reçoit le focus et est centrée à l'écran à chaque nouvelle erreur. */
const AlerteErreur = ({ erreur, onReessayer, libelleReessayer = "Réessayer" }) => {
  const zone = useRef(null);
  useEffect(() => {
    if (!erreur || !zone.current) return;
    zone.current.focus();
    if (typeof zone.current.scrollIntoView === "function") {
      zone.current.scrollIntoView({ block: "center" });
    }
  }, [erreur]);
  if (!erreur) return null;
  return (
    <div className="rco-alerte rco-alerte-erreur" role="alert" ref={zone} tabIndex={-1}>
      <p>{completerAvecContact(erreur.message)}</p>
      {onReessayer && (
        <button type="button" className="rco-bouton rco-bouton-secondaire" onClick={onReessayer}>
          {libelleReessayer}
        </button>
      )}
    </div>
  );
};

const ReferenceACopier = ({ reference }) => {
  const [etat, setEtat] = useState("");
  const copier = async () => {
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") throw new Error("indisponible");
      await navigator.clipboard.writeText(reference);
      setEtat("Référence copiée.");
    } catch {
      setEtat("Copie impossible : notez la référence ou faites une capture d'écran.");
    }
  };
  return (
    <div className="rco-copie">
      <button type="button" className="rco-bouton rco-bouton-secondaire" onClick={copier}>
        Copier la référence
      </button>
      <p className="rco-aide" aria-live="polite">
        {etat}
      </p>
    </div>
  );
};

const RecensementCoPage = ({ delaiMinimalMs = DELAI_MINIMAL_MS }) => {
  const [sauvegarde] = useState(() => chargerProgression());
  const [config, setConfig] = useState({ etat: "chargement", donnees: null, erreur: null });
  const [etape, setEtape] = useState(1);
  const [identification, setIdentification] = useState(() => identificationRestauree(sauvegarde?.identification));
  const [fiche, setFiche] = useState(FICHE_VIDE);
  const [session, setSession] = useState(null);
  const [photo, setPhoto] = useState(PHOTO_VIDE);
  const [photoEnPreparation, setPhotoEnPreparation] = useState(false);
  const [requete, setRequete] = useState(REQUETE_LIBRE);
  const [erreursServeur, setErreursServeur] = useState({ identification: {}, fiche: {} });
  const [confirmation, setConfirmation] = useState(null);
  const [restauree, setRestauree] = useState(Boolean(sauvegarde));
  // Sauvegarde de l'onglet : identité saisie (sans téléphone) et champs de l'étape 2 saisis par l'utilisateur
  const identificationStockee = useRef(sauvegarde?.identification || null);
  const ficheSaisie = useRef({ ...(sauvegarde?.fiche || {}) });
  // Mémoire de la page (jamais écrite dans le navigateur) : fiche complète telle que saisie, pour un retour arrière
  // ou une session expirée
  const memoire = useRef(null);
  const occupe = useRef(false); // garde contre le double clic (l'état React n'est pas encore à jour)
  const refusIdentification = useRef(0);
  const jetonRecuA = useRef(0);
  const champPiege = useRef(null);
  // Valeur du champ piège relevée à l'étape 1 : l'identification du parcours « non » part de l'étape 2, où le champ
  // n'est plus affiché
  const valeurPiege = useRef("");
  const titre = useRef(null);
  const alerteVerrou = useRef(null);
  const premierRendu = useRef(true);
  const contact = contactAide();

  const donnees = config.donnees;
  const commissions = useMemo(() => donnees?.commissions || [], [donnees]);
  const commissionsPrecedentes = useMemo(() => donnees?.commissions_precedentes || [], [donnees]);
  const qualites = useMemo(() => donnees?.qualites || [], [donnees]);
  const codesQualites = useMemo(() => qualites.map((q) => q.code), [qualites]);
  // Libellé de commission → codes de qualité proposés ([] : commission sans qualité) ; absent : API antérieure
  const qualitesParCommission = donnees?.qualites_par_commission || null;
  // « Non » à « Étiez-vous membre du CO l'an passé ? » : fiche vide, identification envoyée avant le récapitulatif
  const nouveauMembre = identification.ancien_membre === ANCIEN_NON;
  const sessionVerrouillee = Boolean(session?.verrouillee);

  const attenteLongue = useAttenteLongue(config.etat === "chargement" || requete.enCours);

  // ---------------------------------------------------------------- configuration (jeton du formulaire)
  const charger = useCallback(async ({ silencieux = false } = {}) => {
    if (!silencieux) setConfig((c) => ({ ...c, etat: "chargement", erreur: null }));
    try {
      const reponse = await chargerConfiguration();
      if (!reponse.jeton_formulaire && reponse.ouvert) throw new ErreurApi("reponse");
      jetonRecuA.current = Date.now();
      setConfig({ etat: reponse.ouvert ? "pret" : "ferme", donnees: reponse, erreur: null });
      return true;
    } catch (e) {
      const interpretation = interpreterErreur(e);
      setConfig((c) => ({
        etat: interpretation.action === "ferme" ? "ferme" : silencieux && c.donnees ? c.etat : "erreur",
        donnees: c.donnees,
        erreur: interpretation,
      }));
      return false;
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    document.title = "Recensement des membres du CO — An-Nour";
  }, []);

  // Focus sur le titre à chaque changement d'étape, sauf si une alerte d'erreur vient de le prendre
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    const actif = document.activeElement;
    if (actif && actif.classList && actif.classList.contains("rco-alerte-erreur")) return;
    if (titre.current) titre.current.focus();
  }, [etape]);

  // Fiche déjà validée (lecture seule) : focus et défilement sur l'alerte, qui est lue par les lecteurs d'écran
  // (parcours « non » : l'étape ne change pas, le formulaire disparaît)
  useEffect(() => {
    if (etape !== 2 || !sessionVerrouillee || !alerteVerrou.current) return;
    alerteVerrou.current.focus();
    if (typeof alerteVerrou.current.scrollIntoView === "function") {
      alerteVerrou.current.scrollIntoView({ block: "center" });
    }
  }, [etape, sessionVerrouillee]);

  // ---------------------------------------------------------------- sauvegarde de l'onglet (saisie seulement)
  useEffect(() => {
    if (etape === 4) return;
    const identiteVide = Object.values(identification).every((v) => !v);
    if (identiteVide && !Object.keys(ficheSaisie.current).length) return;
    enregistrerProgression({ identification, fiche: ficheSaisie.current });
  }, [identification, fiche, etape]);

  const reinitialiser = () => {
    effacerProgression();
    identificationStockee.current = null;
    ficheSaisie.current = {};
    memoire.current = null;
    refusIdentification.current = 0;
    setIdentification(IDENTIFICATION_VIDE);
    setFiche(FICHE_VIDE);
    setPhoto(PHOTO_VIDE);
    setSession(null);
    setErreursServeur({ identification: {}, fiche: {} });
    setRequete(REQUETE_LIBRE);
    setConfirmation(null);
    setRestauree(false);
    setEtape(1);
  };

  const autrePersonne = () => {
    reinitialiser();
    charger();
  };

  // ---------------------------------------------------------------- saisie
  const modifierIdentification = (champ, valeur) => {
    if (champ === "ancien_membre") {
      // Changement de parcours : les erreurs de l'autre parcours portent sur des champs masqués, elles sont effacées
      setErreursServeur((e) => ({ ...e, identification: {} }));
      setRequete((r) => (r.erreur ? { ...r, erreur: null } : r));
      const ficheMemoire = memoire.current?.identification.ancien_membre === ANCIEN_NON ? memoire.current.fiche : null;
      setIdentification((v) => {
        const suivant = { ...v, ancien_membre: valeur };
        // « Non » puis « Oui » : l'identité saisie dans la fiche est reprise pour la recherche
        if (valeur !== ANCIEN_NON && ficheMemoire && !v.nom && !v.prenoms && !v.telephone) {
          suivant.nom = ficheMemoire.nom || "";
          suivant.prenoms = ficheMemoire.prenoms || "";
          suivant.telephone = ficheMemoire.telephone || "";
        }
        return suivant;
      });
      return;
    }
    setIdentification((v) => ({ ...v, [champ]: valeur }));
    setErreursServeur((e) =>
      e.identification[champ] ? { ...e, identification: { ...e.identification, [champ]: "" } } : e
    );
  };

  const modifierFiche = (champ, valeur) => {
    ficheSaisie.current = { ...ficheSaisie.current, [champ]: valeur };
    setFiche((v) => ({ ...v, [champ]: valeur }));
    setErreursServeur((e) => (e.fiche[champ] ? { ...e, fiche: { ...e.fiche, [champ]: "" } } : e));
  };

  const memoriser = () => {
    memoire.current = { identification, fiche, fichierPhoto: photo.fichier };
  };

  // ---------------------------------------------------------------- identification (jeton de session)
  /** POST /co/identification après le délai anti-robot ; réponse vérifiée. */
  const demanderSession = async (identite) => {
    const attente = delaiMinimalMs - (Date.now() - jetonRecuA.current);
    if (attente > 0) await pause(attente);
    const piege = champPiege.current ? champPiege.current.value || "" : valeurPiege.current;
    const reponse = await identifierMembre(construireIdentification(identite, donnees.jeton_formulaire, piege));
    if (!reponse.jeton_session || !["trouve", "nouveau"].includes(reponse.resultat)) {
      throw new ErreurApi("reponse");
    }
    refusIdentification.current = 0;
    return reponse;
  };

  /** Erreur d'identification : fermeture, jeton du formulaire à renouveler, puis refus répété. */
  const interpreterRefus = async (e, options) => {
    const interpretation = interpreterErreur(e, options);
    if (interpretation.action === "ferme") {
      setConfig((c) => ({ ...c, etat: "ferme" }));
    }
    if (interpretation.action === "recommencer") {
      refusIdentification.current += 1;
      if (refusIdentification.current >= 2) {
        // Deuxième refus consécutif : ne pas boucler, orienter vers l'administration
        interpretation.message = MESSAGE_REFUS_REPETE;
      } else {
        await charger({ silencieux: true }); // nouveau jeton du formulaire
        interpretation.message = MESSAGE_FORMULAIRE_EXPIRE;
      }
    }
    return interpretation;
  };

  const ajusterAuxOptions = (valeurs) => {
    valeurs.commission = libelleOfficiel(valeurs.commission, commissions);
    if (!qualitesPourCommission(valeurs.commission, codesQualites, qualitesParCommission).includes(valeurs.qualite)) {
      valeurs.qualite = "";
    }
    return valeurs;
  };

  // ---------------------------------------------------------------- étape 1 → 2, parcours « non » : fiche vide
  const commencerNouveauMembre = () => {
    const enMemoire = memoire.current && memoire.current.identification.ancien_membre === ANCIEN_NON;
    // « Oui » puis « Non » : nom, prénoms et téléphone déjà saisis sont repris dans la fiche
    const identiteSaisie = {
      nom: identification.nom || "",
      prenoms: identification.prenoms || "",
      telephone: identification.telephone || "",
    };
    const valeurs = enMemoire
      ? { ...memoire.current.fiche }
      : appliquerFicheSauvegardee({ ...FICHE_VIDE, ...identiteSaisie }, ficheSaisie.current);
    setFiche(ajusterAuxOptions(valeurs));
    setSession(null);
    setPhoto({ ...PHOTO_VIDE, fichier: enMemoire ? memoire.current.fichierPhoto || null : null });
    setErreursServeur({ identification: {}, fiche: {} });
    setRequete(REQUETE_LIBRE);
    setEtape(2);
  };

  // ---------------------------------------------------------------- étape 1 → 2, parcours « oui »
  const identifier = async () => {
    valeurPiege.current = champPiege.current?.value || "";
    if (nouveauMembre) {
      commencerNouveauMembre();
      return;
    }
    if (occupe.current) return;
    occupe.current = true;
    setRequete({ enCours: true, erreur: null });
    try {
      const reponse = await demanderSession(identification);
      let valeurs = valeursFicheInitiales(identification, reponse.fiche, {
        commissions,
        qualites: codesQualites,
        qualitesParCommission,
      });
      // Mémoire de la page : identification du parcours « oui », ou identité saisie dans la fiche du parcours « non »
      const identiteMemoire =
        memoire.current &&
        (memoire.current.identification.ancien_membre === ANCIEN_NON
          ? memoire.current.fiche
          : memoire.current.identification);
      const enMemoire = Boolean(identiteMemoire) && memeIdentite(identiteMemoire, identification);
      if (!reponse.verrouillee && enMemoire) {
        valeurs = { ...memoire.current.fiche }; // fiche telle que saisie, champs vidés compris
      } else if (!reponse.verrouillee && memeIdentite(identificationStockee.current, identification)) {
        valeurs = appliquerFicheSauvegardee(valeurs, ficheSaisie.current);
      } else {
        ficheSaisie.current = {}; // autre personne : la saisie précédente de l'onglet ne s'applique pas
      }
      identificationStockee.current = identification;

      setFiche(ajusterAuxOptions(valeurs));
      setSession({
        jeton: reponse.jeton_session,
        trouvee: reponse.resultat === "trouve",
        nonRetrouve: reponse.resultat === "nouveau",
        dejaSoumise: Boolean(reponse.deja_soumise),
        verrouillee: Boolean(reponse.verrouillee),
        santeMasquee: Boolean(reponse.sante_masquee),
        modificationsNonEnregistrees: false,
      });
      setPhoto({
        ...PHOTO_VIDE,
        fichier: enMemoire && !reponse.verrouillee ? memoire.current.fichierPhoto || null : null,
        urlExistante: reponse.fiche?.photo_url || null,
      });
      setErreursServeur({ identification: {}, fiche: {} });
      setRequete(REQUETE_LIBRE);
      setEtape(2);
    } catch (e) {
      const interpretation = await interpreterRefus(e, {
        champsConnus: CHAMPS_IDENTIFICATION,
        champsTexte: { [COMMISSION_INCONNUE]: "commission_precedente" },
      });
      setErreursServeur((s) => ({ ...s, identification: interpretation.champs }));
      setRequete({ enCours: false, erreur: interpretation });
    } finally {
      occupe.current = false;
    }
  };

  // ---------------------------------------------------------------- étape 2 → 3
  /**
   * Parcours « non » : identification (identité de la fiche, sans commission précédente) pour obtenir le jeton de
   * session ; refaite seulement si nom, prénoms ou téléphone ont changé depuis. Le serveur réévalue la
   * correspondance à l'envoi ; une fiche déjà validée cette année passe en lecture seule.
   */
  const continuerVersRecapitulatif = async () => {
    const identite = { nom: fiche.nom, prenoms: fiche.prenoms, telephone: fiche.telephone, commission_precedente: "" };
    if (!nouveauMembre || (session && memeIdentite(session.identite, identite))) {
      setRequete(REQUETE_LIBRE);
      setEtape(3);
      return;
    }
    if (occupe.current) return;
    occupe.current = true;
    setRequete({ enCours: true, erreur: null });
    try {
      const reponse = await demanderSession(identite);
      const verrouillee = Boolean(reponse.verrouillee);
      setSession({
        jeton: reponse.jeton_session,
        identite,
        trouvee: false,
        nonRetrouve: false,
        dejaSoumise: Boolean(reponse.deja_soumise),
        verrouillee,
        modificationsNonEnregistrees: verrouillee,
      });
      setRequete(REQUETE_LIBRE);
      if (!verrouillee) setEtape(3);
    } catch (e) {
      const interpretation = await interpreterRefus(e, { champsConnus: CHAMPS_FICHE });
      setErreursServeur((s) => ({ ...s, fiche: interpretation.champs }));
      setRequete({ enCours: false, erreur: interpretation });
    } finally {
      occupe.current = false;
    }
  };

  // ---------------------------------------------------------------- étape 3 → confirmation
  const envoyerLaPhoto = async (jetonPhoto, fichier) => {
    try {
      await envoyerPhoto(construirePhoto(jetonPhoto, fichier));
      return null;
    } catch (e) {
      return interpreterErreurPhoto(e);
    }
  };

  const echecEnvoi = async (e) => {
    const interpretation = interpreterErreur(e, {
      champsConnus: CHAMPS_FICHE,
      champsTexte: { [COMMISSION_INCONNUE]: "commission" },
    });
    if (interpretation.action === "recommencer") interpretation.message = MESSAGE_SESSION;
    setRequete({ enCours: false, erreur: interpretation });
    if (interpretation.action === "ferme") {
      setConfig((c) => ({ ...c, etat: "ferme" }));
    } else if (interpretation.action === "recommencer") {
      // Session expirée : la saisie reste en mémoire et revient après une nouvelle identification (parcours « non » :
      // la fiche reste affichée, la nouvelle identification part au prochain « Continuer »)
      memoriser();
      setSession(null);
      await charger({ silencieux: true });
      setEtape(nouveauMembre ? 2 : 1);
    } else if (interpretation.action === "verrouillee") {
      setSession((s) => ({ ...s, verrouillee: true, modificationsNonEnregistrees: true }));
      setEtape(2);
    } else if (Object.keys(interpretation.champs).length) {
      setErreursServeur((s) => ({ ...s, fiche: interpretation.champs }));
      setEtape(2);
    }
  };

  const envoyer = async () => {
    if (occupe.current) return;
    occupe.current = true;
    setRequete({ enCours: true, erreur: null });
    try {
      const reponse = await soumettreFiche(
        construireFiche(fiche, session.jeton, { supprimerPhoto: photo.supprimerExistante && !photo.fichier })
      );
      if (typeof reponse.reference !== "string" || !reponse.reference || typeof reponse.jeton_photo !== "string") {
        throw new ErreurApi("reponse");
      }
      effacerProgression();
      identificationStockee.current = null;
      ficheSaisie.current = {};
      memoire.current = null;
      const echecPhoto = photo.fichier ? await envoyerLaPhoto(reponse.jeton_photo, photo.fichier) : null;
      setConfirmation({
        reference: reponse.reference,
        message: reponse.message,
        jetonPhoto: reponse.jeton_photo,
        fichierPhoto: photo.fichier,
        echecPhoto,
      });
      setRequete(REQUETE_LIBRE);
      setEtape(4);
    } catch (e) {
      await echecEnvoi(e);
    } finally {
      occupe.current = false;
    }
  };

  const reessayerPhoto = async () => {
    if (occupe.current) return;
    occupe.current = true;
    setRequete({ enCours: true, erreur: null });
    try {
      const echecPhoto = await envoyerLaPhoto(confirmation.jetonPhoto, confirmation.fichierPhoto);
      setConfirmation((c) => ({ ...c, echecPhoto }));
    } finally {
      setRequete(REQUETE_LIBRE);
      occupe.current = false;
    }
  };

  const recommencer = () => {
    if (occupe.current) return; // « Retour » inactif pendant la vérification (la réponse changerait d'étape)
    if (etape === 2 && !session?.verrouillee) memoriser();
    setSession(null);
    setRequete(REQUETE_LIBRE);
    setEtape(1);
  };

  // ---------------------------------------------------------------- rendu
  const renduVerrouillee = () => (
    <>
      <div className="rco-alerte rco-alerte-avertissement" role="status" ref={alerteVerrou} tabIndex={-1}>
        <p className="rco-alerte-titre">{completerAvecContact(MESSAGE_VERROUILLEE)}</p>
        <p>Votre fiche a été validée par l'administration : elle ne peut plus être modifiée en ligne.</p>
      </div>
      {session.modificationsNonEnregistrees ? (
        <>
          <h3 className="rco-sous-titre">Vos modifications (non enregistrées)</h3>
          <RecapitulatifFiche
            valeurs={fiche}
            qualites={qualites}
            qualitesParCommission={qualitesParCommission}
            photo={photo}
          />
        </>
      ) : (
        <RecapitulatifFiche
          valeurs={fiche}
          qualites={qualites}
          qualitesParCommission={qualitesParCommission}
          photo={photo}
        />
      )}
      <div className="rco-actions">
        <button type="button" className="rco-bouton rco-bouton-secondaire" onClick={recommencer}>
          Recommencer
        </button>
      </div>
    </>
  );

  const renduConfirmation = () => (
    <div className="rco-confirmation">
      <div className="rco-alerte rco-alerte-succes" role="status">
        <p className="rco-alerte-titre">{confirmation?.message || "Votre fiche a bien été enregistrée. Merci !"}</p>
        <p>
          Référence de votre fiche : <strong className="rco-reference">{confirmation?.reference}</strong>
        </p>
        <p>Conservez cette référence. Votre fiche sera vérifiée par l'administration du séminaire.</p>
      </div>
      <ReferenceACopier reference={confirmation?.reference || ""} />
      {confirmation?.echecPhoto && (
        <div className="rco-alerte rco-alerte-avertissement" role="alert">
          <p className="rco-alerte-titre">Votre fiche est enregistrée, mais la photo n'a pas pu être envoyée.</p>
          <p>{completerAvecContact(confirmation.echecPhoto.message)}</p>
          {confirmation.echecPhoto.reessayable && (
            <button
              type="button"
              className={`rco-bouton rco-bouton-secondaire${requete.enCours ? " rco-bouton-occupe" : ""}`}
              onClick={reessayerPhoto}
              aria-disabled={requete.enCours ? "true" : undefined}
            >
              {requete.enCours ? "Envoi de la photo…" : "Réessayer l'envoi de la photo"}
            </button>
          )}
        </div>
      )}
      <p className="rco-intro">Vous pouvez fermer cette page.</p>
      <div className="rco-actions">
        <button type="button" className="rco-bouton rco-bouton-secondaire" onClick={autrePersonne}>
          Remplir la fiche d'une autre personne
        </button>
      </div>
    </div>
  );

  const renduEtape = () => {
    if (etape === 1) {
      return (
        <>
          {restauree && (
            <div className="rco-alerte rco-alerte-info">
              <p>
                Nous avons repris les réponses saisies dans cet onglet (sauf téléphone et santé).
              </p>
              <button type="button" className="rco-bouton rco-bouton-discret" onClick={reinitialiser}>
                Effacer mes réponses
              </button>
            </div>
          )}
          {config.etat === "erreur" && <AlerteErreur erreur={config.erreur} onReessayer={() => charger()} />}
          <AlerteErreur erreur={requete.erreur} />
          <StepIdentification
            valeurs={identification}
            onChange={modifierIdentification}
            commissionsPrecedentes={commissionsPrecedentes}
            listeDisponible={config.etat === "pret"}
            listeEnChargement={config.etat === "chargement"}
            erreursServeur={erreursServeur.identification}
            onValider={identifier}
            enCours={requete.enCours}
            champPiegeRef={champPiege}
          />
        </>
      );
    }
    if (etape === 2 && session?.verrouillee) return renduVerrouillee();
    if (etape === 2) {
      return (
        <>
          <AlerteErreur erreur={requete.erreur} />
          <StepFiche
            valeurs={fiche}
            onChange={modifierFiche}
            commissions={commissions}
            qualites={qualites}
            qualitesParCommission={qualitesParCommission}
            trouvee={session?.trouvee}
            dejaSoumise={session?.dejaSoumise}
            nonRetrouve={session?.nonRetrouve}
            santeMasquee={session?.santeMasquee}
            contact={contact}
            photo={photo}
            onChoisirPhoto={(fichier) => setPhoto((p) => ({ ...p, fichier }))}
            onRetirerPhoto={() =>
              setPhoto((p) => ({ ...p, fichier: null, supprimerExistante: Boolean(p.urlExistante) }))
            }
            photoEnPreparation={photoEnPreparation}
            onPreparationPhoto={setPhotoEnPreparation}
            erreursServeur={erreursServeur.fiche}
            onValider={continuerVersRecapitulatif}
            onRetour={recommencer}
            enCours={requete.enCours}
          />
        </>
      );
    }
    if (etape === 3) {
      return (
        <>
          <AlerteErreur erreur={requete.erreur} />
          <StepRecapitulatif
            valeurs={fiche}
            qualites={qualites}
            qualitesParCommission={qualitesParCommission}
            photo={photo}
            dejaSoumise={nouveauMembre && session?.dejaSoumise}
            santeMasquee={session?.santeMasquee}
            onModifier={() => {
              setRequete(REQUETE_LIBRE);
              setEtape(2);
            }}
            onEnvoyer={envoyer}
            enCours={requete.enCours || photoEnPreparation}
            erreur={requete.erreur ? completerAvecContact(requete.erreur.message) : null}
            consentementVersion={donnees?.consentement_version}
          />
        </>
      );
    }
    return renduConfirmation();
  };

  const renduContenu = () => {
    if (config.etat === "ferme") {
      return (
        <div className="rco-alerte rco-alerte-info" role="status">
          <p className="rco-alerte-titre">{MESSAGE_FERME}</p>
          <p>Le lien vous sera de nouveau communiqué à l'ouverture du recensement.</p>
        </div>
      );
    }
    return (
      <>
        <CoStepper etapes={ETAPES} etapeCourante={etape} />
        <h2 className="rco-titre-etape" ref={titre} tabIndex={-1}>
          {etape === 2 && nouveauMembre ? TITRE_FICHE_NOUVEAU_MEMBRE : TITRES[etape]}
        </h2>
        {renduEtape()}
        <MessageAttente
          actif={config.etat === "chargement" || requete.enCours}
          longue={attenteLongue}
          texte={
            config.etat === "chargement"
              ? "Chargement de la liste des commissions…"
              : etape === 1
              ? "Recherche de votre fiche…"
              : etape === 2
              ? "Vérification de votre fiche…"
              : "Envoi en cours…"
          }
        />
      </>
    );
  };

  return (
    <div className="rco-page" lang="fr">
      <header className="rco-entete">
        <div className="rco-conteneur">
          <p className="rco-surtitre">
            Séminaire An-Nour 8.0{donnees?.edition?.libelle ? ` — ${donnees.edition.libelle}` : ""}
          </p>
          <h1>Recensement des membres du comité d'organisation</h1>
        </div>
      </header>
      <main className="rco-conteneur rco-principal">
        <div className="rco-carte">
          {renduContenu()}
          {contact && (
            <p className="rco-pied-carte">
              Besoin d'aide ? <span className="rco-contact">{contact}</span>
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecensementCoPage;
