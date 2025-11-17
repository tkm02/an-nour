import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StepDormitory.css";

const API_URL =  process.env.REACT_APP_API_URL; // Ton API

const StepDormitory = ({ data, sexe, onChange, onNext, onPrevious }) => {
  const [dortoirs, setDortoirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");

  // ✅ Récupération des dortoirs depuis l'API
  useEffect(() => {
    const fetchDormitories = async () => {
      try {
        setLoading(true);
        setApiError("");

        // ✅ Appel API pour récupérer les dortoirs par sexe
        const response = await axios.get(`${API_URL}/api/v1/registrations/dortoirs`, {
          params: { sexe: sexe }
        });

        // console.log('Dortoirs récupérés:', response.data);

        // Format attendu: { dormitories: [{ id, name, capacity, available, sexe }] }
        const dortoirsData = response.data || response.data;
        setDortoirs(dortoirsData);
        // Filtrer par sexe (au cas où le backend ne filtre pas)
        // const filteredDortoirs = dortoirsData.filter(d => d.sexe === sexe);
        
        // setDortoirs(filteredDortoirs);
        setLoading(false);

      } catch (err) {
        console.error("Erreur récupération dortoirs:", err);
        setApiError(
          err.response?.data?.message || 
          "Impossible de charger les dortoirs. Veuillez réessayer."
        );
        setLoading(false);
      }
    };

    if (sexe) {
      fetchDormitories();
    }
  }, [sexe]);

  const handleDormitorySelect = (dortoir) => {
    const available = dortoir.available || 0;

  // Ne rien faire si le dortoir est complet
  if (available <= 0) {
    setError(`Le dortoir "${dortoir.name}" est complet. Veuillez en choisir un autre.`);
    return;
  }

  // Si on clique sur le dortoir déjà sélectionné, le désélectionner
  if (data.dortoirId === dortoir.code) {
    onChange({
      dortoir: '',
      dortoirId: '',
      dortoirCode: '',
      // matricule: ''
    });
    setError('');
    return;
  }

  // Sinon, sélectionner le nouveau dortoir
  onChange({
    dortoir: dortoir.name,
    dortoirId: dortoir.code,
    dortoirCode: dortoir.code,
    matricule: '', // Sera généré par le backend
  });
  setError('');
  
  // console.log('Dortoir sélectionné:', dortoir.name, dortoir.code);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.dortoir) {
      setError("Veuillez sélectionner un dortoir");
      return;
    }
    onNext();
  };

  // ✅ État de chargement
  if (loading) {
    return (
      <div className="step-form">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des dortoirs disponibles...</p>
        </div>
      </div>
    );
  }

  // ✅ Erreur API
  if (apiError) {
    return (
      <div className="step-form">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Erreur de connexion</h3>
          <p>{apiError}</p>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              style={{margin:"0 5px"}}
              onClick={onPrevious}
            >
              ← Précédent
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Tous les dortoirs complets
  const allFull = dortoirs.every(d => (d.available || 0) === 0);

  if (allFull) {
    return (
      <div className="step-form">
        <div className="no-availability-container">
          <div className="icon-large">🏠</div>
          <h3>Aucun dortoir disponible</h3>
          <p>
            Tous les dortoirs {sexe === "M" ? "masculins" : "féminins"} sont actuellement complets.
          </p>
          <div className="info-card">
            <p>
              <strong>Que faire ?</strong><br />
              -  Contactez-nous au <a href="tel:+225XXXXXXXX">+225 XX XX XX XX</a><br />
              -  Envoyez un email à <a href="mailto:contact@annour.ci">contact@annour.ci</a><br />
              -  Réessayez plus tard
            </p>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              style={{margin:"0 5px"}}
              onClick={onPrevious}
            >
              ← Précédent
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Affichage normal des dortoirs
  return (
    <div className="step-form">
      <div className="step-header">
        <h2>🏠 Choix du dortoir</h2>
        <p>Sélectionnez votre dortoir parmi ceux disponibles</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="dormitory-grid">
          {dortoirs.map((dortoir) => {
            const available = dortoir.available || 0;
            const capacity = dortoir.capacity || 30;
            const isAvailable = available > 0;
            const isSelected = data.dortoirId === dortoir.code;
            // console.log('isSelected', isSelected);
            const occupancyPercent = ((capacity - available) / capacity) * 100;

            return (
              <div
                key={dortoir.code}
                className={`dormitory-card ${!isAvailable ? "disabled" : ""} ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => isAvailable && handleDormitorySelect(dortoir)}
              >
                <div className="dormitory-card-header">
                  <h3 className="dormitory-name">{dortoir.name}</h3>
                  {isSelected && (
                    <span className="selected-badge">✓ Sélectionné</span>
                  )}
                </div>

                <div className="dormitory-capacity">
                  <div className="capacity-text">
                    <span className="available-count">{available}</span>
                    <span className="capacity-total">/{capacity}</span>
                    <span className="capacity-label">places disponibles</span>
                  </div>

                  <div className="capacity-bar">
                    <div
                      className={`capacity-fill ${
                        occupancyPercent > 80 ? "critical" : ""
                      }`}
                      style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div
                  className={`availability-status ${
                    isAvailable ? "available" : "full"
                  }`}
                >
                  {isAvailable ? "✓ Disponible" : "✗ Complet"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            style={{margin:"0 5px"}}
            onClick={onPrevious}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Précédent
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{margin:"0 5px"}}
            disabled={!data.dortoir}
          >
            Continuer
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StepDormitory;
