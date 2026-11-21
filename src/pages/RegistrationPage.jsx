import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../components/Registration/Stepper";
import StepPersonnalInfo from "../components/Registration/StepPersonalInfo";
import StepDormitory from "../components/Registration/StepDormitory";
import StepHealthInfo from "../components/Registration/StepHealthInfo";
import StepPayment from "../components/Registration/StepPayment";
import StepConfirmation from "../components/Registration/StepConfirmation";
import ReinscriptionRecherche, { ReinscriptionChoix } from "../components/Registration/ReinscriptionRecherche";
import {
  chargerConfigurationReinscription,
  chargerStatutInscriptions,
  rechercherInscription,
} from "../services/inscription";
import useAttenteLongue from "../utils/commun/useAttenteLongue";
import {
  AVERTISSEMENT_IDENTITE_MODIFIEE,
  construireRecherche,
  identiteModifiee,
  ficheVersFormulaire,
  interpreterErreurRecherche,
  MESSAGE_REFUS_REPETE,
  RECHERCHE_VIDE,
  verifierReponseRecherche,
} from "../utils/inscription/reinscription";
import { formaterCloture, inscriptionsCloses } from "../utils/inscription/statut";
import { migrerAncienneInscription } from "../utils/inscription/stockage";
import "./RegistrationPage.css";

// L'API refuse une recherche moins de 3 s après l'émission du jeton du formulaire : marge de sécurité
const DELAI_MINIMAL_MS = 3500;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formulaireInitial = () => ({
  personalInfo: {
    nom: "",
    prenom: "",
    sexe: "",
    age: "",
    contactParent: "",
    contactSeminariste: "",
    communeHabitation: "",
    niveauAcademique: "",
  },
  dormitoryInfo: {
    dortoir: "",
    dortoirId: "",
    dortoirCode: "",
    matricule: "",
  },
  healthInfo: {
    allergie: "RAS",
    antecedentMedical: "Néant",
  },
  paymentInfo: {
    status: "pending",
    amount: 7000,
  },
});

const RegistrationPage = ({ delaiMinimalMs = DELAI_MINIMAL_MS }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const registrationType = "single";

  const [formData, setFormData] = useState(formulaireInitial);

  // ---------------------------------------------------------------- réinscription (TAF lot 2)
  // phase : "choix" (inscrit l'an dernier ?) → "recherche" → "deja_inscrit" | "formulaire" (étapes existantes)
  const [phase, setPhase] = useState("choix");
  const [statut, setStatut] = useState(null);
  const [configReinscription, setConfigReinscription] = useState({ etat: "inactif", donnees: null });
  const [recherche, setRecherche] = useState(RECHERCHE_VIDE);
  const [requeteRecherche, setRequeteRecherche] = useState({ enCours: false, erreur: null, champs: {} });
  // Jeton et résultat en mémoire uniquement (jamais dans le stockage du navigateur)
  const [reinscription, setReinscription] = useState(null);
  const [matriculeActuel, setMatriculeActuel] = useState(null);
  const criteresRecherche = useRef(null);
  const identiteRetrouvee = useRef(null); // nom et prénom de l'inscription retrouvée, pour signaler une modification
  const jetonRecuA = useRef(0);
  const refusRecherche = useRef(0);
  const occupe = useRef(false);
  const champPiege = useRef(null);

  const attenteLongue = useAttenteLongue(configReinscription.etat === "chargement" || requeteRecherche.enCours);

  useEffect(() => {
    // Ancienne sauvegarde localStorage (pouvait contenir des données de santé) : supprimée
    migrerAncienneInscription();
    let actif = true;
    chargerStatutInscriptions()
      .then((reponse) => {
        if (actif) setStatut(reponse);
      })
      .catch(() => {}); // état inconnu : le formulaire reste affiché, l'API refusera si les inscriptions sont closes
    return () => {
      actif = false;
    };
  }, []);

  const chargerConfiguration = useCallback(async () => {
    setConfigReinscription((c) => ({ ...c, etat: "chargement" }));
    try {
      const reponse = await chargerConfigurationReinscription();
      jetonRecuA.current = Date.now();
      setConfigReinscription({
        etat: reponse.ouvert && reponse.jeton_formulaire ? "pret" : "indisponible",
        donnees: reponse,
      });
      return reponse;
    } catch (e) {
      const interpretation = interpreterErreurRecherche(e);
      if (interpretation.action === "ferme") setStatut((st) => ({ ...(st || {}), open: false }));
      setConfigReinscription((c) => ({ ...c, etat: "erreur" }));
      setRequeteRecherche({ enCours: false, erreur: interpretation, champs: {} });
      return null;
    }
  }, []);

  const choisirOui = () => {
    setPhase("recherche");
    setRequeteRecherche({ enCours: false, erreur: null, champs: {} });
    chargerConfiguration();
  };

  const choisirNon = () => {
    // Parcours actuel, inchangé (aucun jeton de réinscription)
    setReinscription(null);
    setFormData(formulaireInitial());
    setPhase("formulaire");
    setCurrentStep(1);
  };

  const modifierRecherche = (champ, valeur) => {
    setRecherche((v) => ({ ...v, [champ]: valeur }));
    setRequeteRecherche((r) => (r.champs[champ] ? { ...r, champs: { ...r.champs, [champ]: "" } } : r));
  };

  const appliquerResultat = (reponse, criteres) => {
    if (reponse.deja_inscrit) {
      setMatriculeActuel(reponse.matricule_actuel || null);
      setReinscription(null);
      setPhase("deja_inscrit");
      return;
    }
    const base = formulaireInitial();
    if (reponse.resultat === "trouve" && reponse.fiche) {
      const prerempli = ficheVersFormulaire(reponse.fiche);
      base.personalInfo = { ...base.personalInfo, ...prerempli.personalInfo };
      identiteRetrouvee.current = { nom: prerempli.personalInfo.nom, prenom: prerempli.personalInfo.prenom };
      base.healthInfo = prerempli.healthInfo;
    } else {
      identiteRetrouvee.current = null;
      // Résultat neutre : seuls le nom et le prénom saisis par la personne sont repris
      base.personalInfo = { ...base.personalInfo, nom: criteres.nom.trim(), prenom: criteres.prenom.trim() };
    }
    setFormData(base);
    setReinscription({ jeton: reponse.jeton_reinscription, resultat: reponse.resultat });
    setPhase("formulaire");
    setCurrentStep(1);
  };

  const rechercher = async () => {
    if (occupe.current) return;
    occupe.current = true;
    setRequeteRecherche({ enCours: true, erreur: null, champs: {} });
    try {
      const attente = delaiMinimalMs - (Date.now() - jetonRecuA.current);
      if (attente > 0) await pause(attente);
      const criteres = { ...recherche };
      const reponse = verifierReponseRecherche(
        await rechercherInscription(
          construireRecherche(criteres, configReinscription.donnees.jeton_formulaire, champPiege.current?.value || "")
        )
      );
      refusRecherche.current = 0;
      criteresRecherche.current = criteres; // en mémoire, pour renouveler un jeton expiré à l'envoi final
      setRequeteRecherche({ enCours: false, erreur: null, champs: {} });
      appliquerResultat(reponse, criteres);
    } catch (e) {
      const interpretation = interpreterErreurRecherche(e);
      if (interpretation.action === "ferme") setStatut((st) => ({ ...(st || {}), open: false }));
      if (interpretation.action === "recommencer") {
        refusRecherche.current += 1;
        if (refusRecherche.current >= 2) {
          interpretation.message = MESSAGE_REFUS_REPETE; // pas de rechargement en boucle
        } else {
          await chargerConfiguration();
        }
      }
      setRequeteRecherche({ enCours: false, erreur: interpretation, champs: interpretation.champs });
    } finally {
      occupe.current = false;
    }
  };

  /** Jeton expiré à l'envoi final : nouvelle recherche automatique avec les critères conservés en mémoire. */
  const renouvelerReinscription = async () => {
    const criteres = criteresRecherche.current;
    if (!criteres) throw new Error("Critères de recherche indisponibles");
    const configuration = await chargerConfigurationReinscription();
    if (!configuration.ouvert || !configuration.jeton_formulaire) throw new Error("Réinscription indisponible");
    await pause(delaiMinimalMs);
    const reponse = verifierReponseRecherche(
      await rechercherInscription(construireRecherche(criteres, configuration.jeton_formulaire, ""))
    );
    if (reponse.deja_inscrit) {
      const matricule = reponse.matricule_actuel ? ` (matricule ${reponse.matricule_actuel})` : "";
      throw Object.assign(new Error(`Vous êtes déjà inscrit(e) pour cette édition${matricule}.`), {
        dejaInscrit: true,
      });
    }
    setReinscription({ jeton: reponse.jeton_reinscription, resultat: reponse.resultat });
    return reponse.jeton_reinscription;
  };

  const cloture = statut?.open !== false ? formaterCloture(statut?.close_at) : null;

  const steps = [
    { number: 1, title: "Informations", icon: "👤" },
    { number: 2, title: "Dortoir", icon: "🏠" },
    { number: 3, title: "Santé", icon: "🏥" },
    { number: 4, title: "Paiement", icon: "💳" },
    { number: 5, title: "Confirmation", icon: "✓" },
  ];

  const updateFormData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  };

  const isPepiniereAge = () => {
    const age = Number(formData.personalInfo.age);
    return age >= 5 && age <= 11;
  };

  const handleNext = () => {
    // Spécifique : sortie de l’étape 1
    if (currentStep === 1) {
      const age = Number(formData.personalInfo.age);
      const sexe = formData.personalInfo.sexe;

      if (age >= 5 && age <= 11 && sexe) {
        const targetName = sexe === "M" ? "PEPINIERE-G" : "PEPINIERE-F";

        setFormData((prev) => ({
          ...prev,
          dormitoryInfo: {
            ...prev.dormitoryInfo,
            dortoir: targetName,
            dortoirId: targetName,
            dortoirCode: targetName,
            matricule: "",
          },
        }));

        setCurrentStep(3);
        return;
      }
    }

    // Cas normal
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    // Si on est à l’étape 3 et qu'on a un âge pépinière, on revient à 1
    if (currentStep === 3 && isPepiniereAge()) {
      setCurrentStep(1);
      return;
    }

    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {reinscription?.resultat === "trouve" && (
              <div className="rco-formulaire-public reinscription-bandeau">
                <div className="rco-alerte rco-alerte-succes" role="status">
                  <p className="rco-alerte-titre">Nous avons retrouvé votre inscription de l'an dernier</p>
                  <p>Vérifiez chaque information et mettez à jour ce qui a changé (âge, niveau, contacts, santé).</p>
                </div>
              </div>
            )}
            {reinscription?.resultat === "nouveau" && (
              <div className="rco-formulaire-public reinscription-bandeau">
                <div className="rco-alerte rco-alerte-info" role="status">
                  <p>
                    Nous n'avons pas pu confirmer votre inscription de l'an dernier : continuez, l'administration
                    vérifiera.
                  </p>
                </div>
              </div>
            )}
            <StepPersonnalInfo
              data={formData.personalInfo}
              onChange={(data) => updateFormData("personalInfo", data)}
              onNext={handleNext}
              avertissementIdentite={
                reinscription?.resultat === "trouve" &&
                identiteModifiee(identiteRetrouvee.current, formData.personalInfo)
                  ? AVERTISSEMENT_IDENTITE_MODIFIEE
                  : undefined
              }
              aideNiveau={
                reinscription?.resultat === "trouve"
                  ? "Mettez à jour votre niveau pour cette année scolaire."
                  : undefined
              }
            />
          </>
        );
      case 2:
        if (isPepiniereAge()) {
          setCurrentStep(3);
          return null;
        }
        return (
          <StepDormitory
            data={formData.dormitoryInfo}
            sexe={formData.personalInfo.sexe}
            onChange={(data) => updateFormData("dormitoryInfo", data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <StepHealthInfo
            data={formData.healthInfo}
            onChange={(data) => updateFormData("healthInfo", data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <StepPayment
            data={formData}
            registrationType={registrationType}
            onNext={handleNext}
            onPrevious={handlePrevious}
            jetonReinscription={reinscription?.jeton || null}
            onRenouvelerReinscription={renouvelerReinscription}
          />
        );
      case 5:
        return <StepConfirmation data={formData} />;
      default:
        return null;
    }
  };

  const renderContenu = () => {
    if (inscriptionsCloses(statut)) {
      return (
        <div className="rco-formulaire-public reinscription">
          <div className="rco-alerte rco-alerte-info" role="status">
            <p className="rco-alerte-titre">Les inscriptions sont closes pour cette édition.</p>
            <p>Merci de votre intérêt. Suivez nos annonces pour la prochaine édition.</p>
          </div>
          <div className="rco-actions">
            <button type="button" className="rco-bouton rco-bouton-secondaire" onClick={() => navigate("/")}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      );
    }
    if (phase === "choix") {
      return <ReinscriptionChoix onOui={choisirOui} onNon={choisirNon} />;
    }
    if (phase === "recherche" && configReinscription.etat === "indisponible") {
      return (
        <div className="rco-formulaire-public reinscription">
          <div className="rco-alerte rco-alerte-info" role="status">
            <p>La recherche de votre inscription de l'an dernier n'est pas disponible pour le moment.</p>
          </div>
          <div className="rco-actions">
            <button type="button" className="rco-bouton rco-bouton-principal" onClick={choisirNon}>
              Continuer avec une inscription classique
            </button>
          </div>
        </div>
      );
    }
    if (phase === "recherche") {
      return (
        <ReinscriptionRecherche
          valeurs={recherche}
          onChange={modifierRecherche}
          onValider={rechercher}
          onRetour={() => setPhase("choix")}
          pret={configReinscription.etat === "pret"}
          enCours={requeteRecherche.enCours}
          erreur={requeteRecherche.erreur}
          erreursServeur={requeteRecherche.champs}
          champPiegeRef={champPiege}
          messageAttente={
            configReinscription.etat === "chargement" || requeteRecherche.enCours
              ? `${configReinscription.etat === "chargement" ? "Préparation du formulaire…" : "Recherche en cours…"}${
                  attenteLongue
                    ? " Le serveur est en cours de démarrage, cela peut prendre jusqu'à une minute. Merci de patienter."
                    : ""
                }`
              : ""
          }
        />
      );
    }
    if (phase === "deja_inscrit") {
      return (
        <div className="rco-formulaire-public reinscription">
          <div className="rco-alerte rco-alerte-succes" role="status">
            <p className="rco-alerte-titre">
              Vous êtes déjà inscrit(e) pour cette édition{matriculeActuel ? ` (matricule ${matriculeActuel})` : ""}.
            </p>
            <p>Aucune nouvelle inscription n'est nécessaire. Pour toute question, contactez l'administration.</p>
          </div>
          <div className="rco-actions">
            <button type="button" className="rco-bouton rco-bouton-secondaire" onClick={() => navigate("/")}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      );
    }
    return renderStepContent();
  };

  return (
    <div className="registration-page">
      <header className="reg-header">
        <div className="reg-container">
          <button
            className="btn-back"
            onClick={() => navigate("/")}
            aria-label="Retour"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Retour</span>
          </button>
          <div className="header-title">
            <h1>Inscription An-Nour 7.0</h1>
            {phase === "formulaire" && !inscriptionsCloses(statut) && (
              <p className="step-indicator">
                Étape {currentStep} sur {steps.length}
              </p>
            )}
            {cloture && (
              <p className="rco-formulaire-public reinscription-cloture">Inscriptions ouvertes jusqu'au {cloture}</p>
            )}
          </div>
        </div>
      </header>
      <main className="reg-main">
        {phase === "formulaire" && !inscriptionsCloses(statut) && (
          <div className="stepper-container">
            <Stepper steps={steps} currentStep={currentStep} />
          </div>
        )}

        <div className="form-wrapper">
          <div className="form-card">{renderContenu()}</div>
        </div>
      </main>
    </div>
  );
};

export default RegistrationPage;
