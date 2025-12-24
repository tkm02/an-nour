import React, { useState } from 'react';
import './StepHealthInfo.css';

const StepHealthInfo = ({ data, onChange, onNext, onPrevious }) => {
  const [customAllergie, setCustomAllergie] = useState(data.allergie !== 'RAS');
  const [customAntecedent, setCustomAntecedent] = useState(data.antecedentMedical !== 'Néant');

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