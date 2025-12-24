import React from 'react';
import './ReviewSummary.css';

const ReviewSummary = ({ data, currentStep }) => {
  const getStepStatus = (step) => {
    if (currentStep > step) return 'completed';
    if (currentStep === step) return 'current';
    return 'pending';
  };

  return (
    <div className="review-summary">
      <div className="summary-header">
        <h3>Récapitulatif</h3>
      </div>

      <div className="summary-content">
        {/* Informations personnelles */}
        <div className={`summary-section ${getStepStatus(1)}`}>
          <div className="section-header">
            <span className="section-number">1</span>
            <h4>Informations personnelles</h4>
            {currentStep > 1 && <span className="check-icon">✓</span>}
          </div>
          {currentStep > 1 && data.personalInfo.nom && (
            <div className="section-content">
              <p><strong>{data.personalInfo.prenom} {data.personalInfo.nom}</strong></p>
              <p className="text-muted">
                {data.personalInfo.sexe === 'M' ? 'Masculin' : 'Féminin'}, {data.personalInfo.age} ans
              </p>
              <p className="text-muted">{data.personalInfo.niveauAcademique}</p>
            </div>
          )}
        </div>

        {/* Dortoir */}
        <div className={`summary-section ${getStepStatus(2)}`}>
          <div className="section-header">
            <span className="section-number">2</span>
            <h4>Dortoir</h4>
            {currentStep > 2 && <span className="check-icon">✓</span>}
          </div>
          {currentStep > 2 && data.dormitoryInfo.dortoir && (
            <div className="section-content">
              <p><strong>{data.dormitoryInfo.dortoir}</strong></p>
              <p className="matricule-preview">{data.dormitoryInfo.matricule}</p>
            </div>
          )}
        </div>

        {/* Santé */}
        <div className={`summary-section ${getStepStatus(3)}`}>
          <div className="section-header">
            <span className="section-number">3</span>
            <h4>Santé</h4>
            {currentStep > 3 && <span className="check-icon">✓</span>}
          </div>
          {currentStep > 3 && (
            <div className="section-content">
              <p className="text-muted">
                Allergie : {data.healthInfo.allergie}
              </p>
              <p className="text-muted">
                Antécédent : {data.healthInfo.antecedentMedical}
              </p>
            </div>
          )}
        </div>

        {/* Paiement */}
        <div className={`summary-section ${getStepStatus(4)}`}>
          <div className="section-header">
            <span className="section-number">4</span>
            <h4>Paiement</h4>
            {currentStep > 4 && <span className="check-icon">✓</span>}
          </div>
          <div className="section-content">
            <div className="amount-display">
              <span className="amount-label">Montant</span>
              <span className="amount-value">6 000 FCFA</span>
            </div>
          </div>
        </div>
      </div>

      <div className="summary-footer">
        <div className="help-text">
          <span className="help-icon">💡</span>
          <p>Vos données sont automatiquement sauvegardées</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;