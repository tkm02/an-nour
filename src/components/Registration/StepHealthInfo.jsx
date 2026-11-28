import React, { useState } from 'react';
import { CONSENTEMENT_SANTE_REQUIS, santeRenseignee } from '../../utils/inscription/sante';
import './StepHealthInfo.css';

const StepHealthInfo = ({ data, onChange, onNext, onPrevious }) => {
  const [customAllergie, setCustomAllergie] = useState(data.allergie !== 'RAS');
  const [customAntecedent, setCustomAntecedent] = useState(data.antecedentMedical !== 'Néant');
  const [erreurConsentement, setErreurConsentement] = useState('');
  const consentementRequis = santeRenseignee(data);

  const handleAllergieChange = (value) => {
    if (value === 'custom') {
      setCustomAllergie(true);
      onChange({ allergie: '' });
    } else {
      setCustomAllergie(false);
      onChange({ allergie: value });
    }
  };

  const handleAntecedentChange = (value) => {
    if (value === 'custom') {
      setCustomAntecedent(true);
      onChange({ antecedentMedical: '' });
    } else {
      setCustomAntecedent(false);
      onChange({ antecedentMedical: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TAF lot 4 : l'API refuse une donnée de santé déclarée sans consentement (422)
    if (consentementRequis && !data.consentementSante) {
      setErreurConsentement(CONSENTEMENT_SANTE_REQUIS);
      const caseConsentement = document.getElementById('consentement-sante');
      if (caseConsentement) caseConsentement.focus();
      return;
    }
    onNext();
  };

  return (
    <div className="step-form">
      <div className="step-header">
        <h2>Informations de santé</h2>
        <p>Ces informations nous permettent de mieux vous accompagner pendant le séminaire</p>
      </div>

      <div className="health-info-notice">
        <span className="notice-icon">🏥</span>
        <div className="notice-content">
          <strong>Confidentialité garantie</strong>
          <p>Vos informations médicales sont strictement confidentielles et utilisées uniquement en cas d'urgence.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Allergies */}
        <div className="form-group">
          <label>
            Allergies <span className="required">*</span>
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="allergie"
                value="RAS"
                checked={!customAllergie && data.allergie === 'RAS'}
                onChange={(e) => handleAllergieChange(e.target.value)}
              />
              <span>RAS (Rien à signaler)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="allergie"
                value="custom"
                checked={customAllergie}
                onChange={(e) => handleAllergieChange(e.target.value)}
              />
              <span>J'ai des allergies</span>
            </label>
          </div>

          {customAllergie && (
            <div className="custom-input-container">
              <textarea
                rows="3"
                value={data.allergie}
                onChange={(e) => onChange({ allergie: e.target.value })}
                placeholder="Décrivez vos allergies (alimentaires, médicamenteuses, etc.)"
                className="form-textarea"
              />
              <p className="input-hint">
                Exemple : Arachides, pénicilline, poussière, etc.
              </p>
            </div>
          )}
        </div>

        {/* Antécédents médicaux */}
        <div className="form-group">
          <label>
            Antécédents médicaux <span className="required">*</span>
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="antecedent"
                value="Néant"
                checked={!customAntecedent && data.antecedentMedical === 'Néant'}
                onChange={(e) => handleAntecedentChange(e.target.value)}
              />
              <span>Néant (Aucun antécédent)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="antecedent"
                value="custom"
                checked={customAntecedent}
                onChange={(e) => handleAntecedentChange(e.target.value)}
              />
              <span>J'ai des antécédents médicaux</span>
            </label>
          </div>

          {customAntecedent && (
            <div className="custom-input-container">
              <textarea
                rows="3"
                value={data.antecedentMedical}
                onChange={(e) => onChange({ antecedentMedical: e.target.value })}
                placeholder="Décrivez vos antécédents médicaux"
                className="form-textarea"
              />
              <p className="input-hint">
                Exemple : Asthme, diabète, hypertension, épilepsie, etc.
              </p>
            </div>
          )}
        </div>

        {consentementRequis && (
          <div className={`form-group consentement-sante${erreurConsentement ? ' consentement-sante-erreur' : ''}`}>
            <label className="consentement-sante-label" htmlFor="consentement-sante">
              <input
                id="consentement-sante"
                type="checkbox"
                checked={Boolean(data.consentementSante)}
                onChange={(e) => {
                  onChange({ consentementSante: e.target.checked });
                  if (e.target.checked) setErreurConsentement('');
                }}
                aria-invalid={erreurConsentement ? true : undefined}
                aria-describedby={erreurConsentement ? 'consentement-sante-erreur' : 'consentement-sante-info'}
              />
              {/* Texte du consentement : version 2026-11-sante-v1 (API). Le modifier impose une nouvelle version. */}
              <span>
                J'accepte que ces informations de santé soient enregistrées et utilisées pour la prise en charge
                du séminariste pendant le séminaire. Si le séminariste est mineur, je donne cet accord en tant que
                parent ou tuteur. <span className="required">*</span>
              </span>
            </label>
            <ul className="consentement-sante-info" id="consentement-sante-info">
              <li>Accès limité à la commission Santé et à l'administration du séminaire.</li>
              <li>Effacement au plus tard à la clôture de l'édition suivante du séminaire.</li>
              <li>
                Accès, rectification ou suppression : sur demande auprès de l'administration du séminaire
                (loi ivoirienne n°2013-450 relative à la protection des données à caractère personnel).
              </li>
            </ul>
            {erreurConsentement && (
              <p className="consentement-sante-message" id="consentement-sante-erreur" role="alert">
                {erreurConsentement}
              </p>
            )}
          </div>
        )}

        <div className="health-note">
          <p>
            💊 <strong>Important :</strong> N'oubliez pas d'apporter vos médicaments personnels 
            avec les ordonnances si nécessaire.
          </p>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" style={{ marginRight: '10px' }} onClick={onPrevious}>
            ← Précédent
          </button>
          <button type="submit" className="btn btn-primary">
            Suivant →
          </button>
        </div>
      </form>
    </div>
  );
};

export default StepHealthInfo;