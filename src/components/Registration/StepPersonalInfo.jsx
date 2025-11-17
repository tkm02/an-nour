import React, { useState } from "react";
import "./StepPersonnalInfo.css";

const StepPersonalInfo = ({ data, onChange, onNext }) => {
  const [errors, setErrors] = useState({});
  const [selectedCycle, setSelectedCycle] = useState("");

  // ✅ Structure hiérarchique des niveaux
  const niveauxAcademiques = {
    "Primaire": ["CP1", "CP2", "CE1", "CE2", "CM1", "CM2"],
    "Collège": ["6ème", "5ème", "4ème", "3ème"],
    "Lycée": ["2nde", "1ère", "Terminale"],
    "Licence": ["Licence 1", "Licence 2", "Licence 3"],
    "Master": ["Master 1", "Master 2"],
    "Ingenieur": ["Ingenieur 1", "Ingenieur 2", "Ingenieur 3"],
    "Bts": ["Bts 1", "Bts 2"],
    "Doctorat": ["Doctorat 1", "Doctorat 2", "Doctorat 3"],
    "Professionnel": ["Professionnel"]
  };

  const communesCI = [
    "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", "Marcory",
    "Plateau", "Port-Bouët", "Treichville", "Yopougon", "Bingerville",
    "Songon", "Anyama", "Bouaké", "Daloa", "Korhogo", "San-Pédro",
    "Yamoussoukro", "Man", "Gagnoa", "Divo", "Abengourou", "Agboville",
    "Grand-Bassam", "Autre"
  ];

  const handleChange = (field, value) => {
    onChange({ [field]: value });

    if (field === "communeHabitation" && value !== "Autre") {
      onChange({ communeHabitation: value, communeAutre: "" });
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // ✅ Gestion du cycle (1ère sélection)
  const handleCycleChange = (cycle) => {
    setSelectedCycle(cycle);
    // Réinitialiser le niveau académique quand on change de cycle
    onChange({ niveauAcademique: "" });
    if (errors.niveauAcademique) {
      setErrors((prev) => ({ ...prev, niveauAcademique: "" }));
    }
  };

  // ✅ Gestion de la classe détaillée (2ème sélection)
  const handleNiveauChange = (niveau) => {
    handleChange("niveauAcademique", niveau);
  };

  const validate = () => {
    const newErrors = {};
    if (!data.nom.trim()) newErrors.nom = "Le nom est requis";
    if (!data.prenom.trim()) newErrors.prenom = "Le prénom est requis";
    if (!data.sexe) newErrors.sexe = "Le sexe est requis";
    if (!data.age || data.age < 5 || data.age > 100) {
      newErrors.age = "L'âge doit être entre 5 et 100 ans";
    }
    if (!data.niveauAcademique) {
      newErrors.niveauAcademique = "Le niveau académique est requis";
    }

    if (!data.communeHabitation.trim()) {
      newErrors.communeHabitation = "La commune d'habitation est requise";
    } else if (data.communeHabitation === "Autre" && !data.communeAutre?.trim()) {
      newErrors.communeAutre = "Veuillez préciser votre commune";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form className="step-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>👤 Informations personnelles</h2>
        <p>Veuillez renseigner vos informations pour continuer</p>
      </div>

      <div className="form-content">
        {/* Nom et Prénom */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nom">
              Nom <span className="required">*</span>
            </label>
            <input
              id="nom"
              type="text"
              value={data.nom}
              onChange={(e) => handleChange("nom", e.target.value)}
              className={errors.nom ? "error" : ""}
              placeholder="Votre nom"
            />
            {errors.nom && <span className="error-message">{errors.nom}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="prenom">
              Prénom(s) <span className="required">*</span>
            </label>
            <input
              id="prenom"
              type="text"
              value={data.prenom}
              onChange={(e) => handleChange("prenom", e.target.value)}
              className={errors.prenom ? "error" : ""}
              placeholder="Votre prénom"
            />
            {errors.prenom && <span className="error-message">{errors.prenom}</span>}
          </div>
        </div>

        {/* Sexe */}
        <div className="form-group">
          <label>
            Sexe <span className="required">*</span>
          </label>
          <div className="radio-group">
            <label className={`radio-card ${data.sexe === "M" ? "active" : ""}`}>
              <input
                type="radio"
                name="sexe"
                value="M"
                checked={data.sexe === "M"}
                onChange={(e) => handleChange("sexe", e.target.value)}
              />
              <span className="radio-label">
                <span className="radio-icon">👳‍♂️</span>
                <span>Masculin</span>
              </span>
            </label>
            <label className={`radio-card ${data.sexe === "F" ? "active" : ""}`}>
              <input
                type="radio"
                name="sexe"
                value="F"
                checked={data.sexe === "F"}
                onChange={(e) => handleChange("sexe", e.target.value)}
              />
              <span className="radio-label">
                <span className="radio-icon">🧕</span>
                <span>Féminin</span>
              </span>
            </label>
          </div>
          {errors.sexe && <span className="error-message">{errors.sexe}</span>}
        </div>

        {/* Âge */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="age">
              Âge <span className="required">*</span>
            </label>
            <input
              id="age"
              type="number"
              value={data.age}
              onChange={(e) => handleChange("age", e.target.value)}
              className={errors.age ? "error" : ""}
              placeholder="Votre âge"
              min="5"
              max="100"
            />
            {errors.age && <span className="error-message">{errors.age}</span>}
          </div>
        </div>

        {/* ✅ Niveau académique en 2 étapes */}
        <div className="form-group">
          <label>
            Niveau académique <span className="required">*</span>
          </label>
          
          {/* Étape 1 : Sélection du cycle */}
          <div className="niveau-selection">
            <div className="cycle-buttons">
              {Object.keys(niveauxAcademiques).map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  className={`cycle-btn ${selectedCycle === cycle ? "active" : ""}`}
                  onClick={() => handleCycleChange(cycle)}
                >
                  {cycle}
                </button>
              ))}
            </div>

            {/* Étape 2 : Sélection de la classe détaillée */}
            {selectedCycle && (
              <div className="classe-selection animate-slide-down">
                <label className="classe-label">
                  Sélectionnez votre classe :
                </label>
                <select
                  value={data.niveauAcademique}
                  onChange={(e) => handleNiveauChange(e.target.value)}
                  className={errors.niveauAcademique ? "error" : ""}
                >
                  <option value="">-- Choisissez --</option>
                  {niveauxAcademiques[selectedCycle].map((classe) => (
                    <option key={classe} value={classe}>
                      {classe}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {errors.niveauAcademique && (
            <span className="error-message">{errors.niveauAcademique}</span>
          )}
        </div>

        {/* Commune d'habitation */}
        <div className="form-group">
          <label htmlFor="commune">
            Commune d'habitation <span className="required">*</span>
          </label>
          <select
            id="commune"
            value={data.communeHabitation}
            onChange={(e) => handleChange("communeHabitation", e.target.value)}
            className={errors.communeHabitation ? "error" : ""}
          >
            <option value="">Sélectionnez votre commune</option>
            {communesCI.map((commune) => (
              <option key={commune} value={commune}>
                {commune}
              </option>
            ))}
          </select>
          {errors.communeHabitation && (
            <span className="error-message">{errors.communeHabitation}</span>
          )}
        </div>

        {/* Champ conditionnel pour "Autre" */}
        {data.communeHabitation === "Autre" && (
          <div className="form-group animate-slide-down">
            <label htmlFor="communeAutre">
              Précisez votre commune <span className="required">*</span>
            </label>
            <input
              id="communeAutre"
              type="text"
              value={data.communeAutre || ""}
              onChange={(e) => handleChange("communeAutre", e.target.value)}
              className={errors.communeAutre ? "error" : ""}
              placeholder="Entrez le nom de votre commune"
            />
            {errors.communeAutre && (
              <span className="error-message">{errors.communeAutre}</span>
            )}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Continuer
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default StepPersonalInfo;
