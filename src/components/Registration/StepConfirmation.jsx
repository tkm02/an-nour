
// src/components/Registration/StepConfirmation.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PDFGenerator from '../PDFGenerator';
import './StepConfirmation.css';

const StepConfirmation = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    // Récupérer les données du localStorage
    const savedData = localStorage.getItem('an-nour-registration');
    
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setData(parsedData);
      
      // Générer QR code avec le matricule
      if (parsedData.matricule || parsedData.dormitoryInfo?.matricule) {
        const matricule = parsedData.matricule || parsedData.dormitoryInfo.matricule;
        generateQRCode(matricule);
      }
    }
  }, []);

  const generateQRCode = async (matricule) => {
    try {
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${matricule}`);
    } catch (error) {
      console.error('Erreur génération QR code:', error);
    }
  };

  const handleDownloadPDF = () => {
    if (data) {
      PDFGenerator.generateRegistrationPDF(data, qrCodeUrl);
    }
  };

  const handleNewRegistration = () => {
    localStorage.removeItem('an-nour-registration');
    navigate('/inscription');
    window.location.reload();
  };

  if (!data) {
    return (
      <div className="step-form">
        <div className="loading">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  const matricule = data.matricule || data.dormitoryInfo?.matricule || 'N/A';

  return (
    <div className="step-form confirmation-step">
      <div className="confirmation-success">
        <div className="success-animation">
          <div className="success-checkmark">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="4"/>
              <path d="M30 50L45 65L70 35" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <h2 className="confirmation-title">Inscription confirmée !</h2>
        <p className="confirmation-subtitle">
          Félicitations ! Votre inscription au Séminaire An-Nour 7.0 a été validée avec succès.
        </p>
      </div>

      <div className="confirmation-card">
        <div className="card-header">
          <h3>Votre fiche d'inscription</h3>
        </div>

        <div className="card-content">
          <div className="qr-code-section">
            <div className="qr-code-container">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="qr-code-image" />
              ) : (
                <div className="qr-code-placeholder">
                  <div className="spinner"></div>
                </div>
              )}
            </div>
            <p className="qr-code-label">Votre QR Code d'identification</p>
            <p className="matricule-display">{matricule}</p>
          </div>

          <div className="participant-info">
            <div className="info-row">
              <span className="info-label">Nom complet</span>
              <span className="info-value">
                {data.personalInfo.prenom} {data.personalInfo.nom}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Sexe</span>
              <span className="info-value">
                {data.personalInfo.sexe === 'M' ? 'Masculin' : 'Féminin'}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Âge</span>
              <span className="info-value">{data.personalInfo.age} ans</span>
            </div>

            <div className="info-row">
              <span className="info-label">Niveau académique</span>
              <span className="info-value">{data.personalInfo.niveauAcademique}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Dortoir</span>
              <span className="info-value highlight">{data.dormitoryInfo.dortoir}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Allergie</span>
              <span className="info-value">{data.healthInfo.allergie}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Antécédent médical</span>
              <span className="info-value">{data.healthInfo.antecedentMedical}</span>
            </div>

            <div className="info-row payment-row">
              <span className="info-label">Statut paiement</span>
              <span className="info-value status-badge status-paid">
                ✓ Payé ({data.paymentInfo?.amount?.toLocaleString() || '1000'} FCFA)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="important-info">
        <div className="info-box">
          <div className="info-box-header">
            <span className="info-icon">📌</span>
            <strong>Informations importantes</strong>
          </div>
          <ul className="info-list">
            <li><strong>Dates :</strong> 20 au 25 Décembre 2025</li>
            <li><strong>Lieu :</strong> Lycée Moderne Cocody Angré, Abidjan</li>
            <li><strong>Heure d'arrivée :</strong> Vendredi 20 Décembre à partir de 14h00</li>
            <li><strong>À apporter :</strong> Effets personnels, vêtements, articles de toilette, Coran, cahier et stylo</li>
            <li><strong>QR Code :</strong> Présentez votre QR Code à l'entrée le jour J</li>
          </ul>
        </div>
      </div>

      <div className="confirmation-actions">
        <button 
          className="btn btn-primary btn-large"
          onClick={handleDownloadPDF}
        >
          <span className="btn-icon">📄</span>
          Télécharger ma fiche PDF
        </button>

        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/')}
        >
          Retour à l'accueil
        </button>

        <button 
          className="btn btn-outline"
          onClick={handleNewRegistration}
        >
          Nouvelle inscription
        </button>
      </div>

      <div className="contact-support">
        <p>Besoin d'aide ? Contactez-nous</p>
        <div className="support-contacts">
          <a href="tel:+2250545844135" className="support-link">
            📞 05 45 84 41 35
          </a>
          <a href="tel:+2250142080537" className="support-link">
            📞 01 42 08 05 37
          </a>
        </div>
      </div>
    </div>
  );
};

export default StepConfirmation;
