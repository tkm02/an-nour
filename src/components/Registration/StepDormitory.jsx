import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StepDormitory.css";

const API_URL = process.env.REACT_APP_API_URL; // Your API base URL
console.log("API_URL:", API_URL);
const StepDormitory = ({ data, sexe, onChange, onNext, onPrevious }) => {
  const [dortoirs, setDortoirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");

  // Fetch dormitories from API
  useEffect(() => {
    const fetchDormitories = async () => {
      try {
        setLoading(true);
        setApiError("");
        setError(""); // Clear previous errors

        const response = await axios.get(
          `${API_URL}/api/v1/registrations/dortoirs`,
          {
            params: { sexe: sexe },
          }
        );

        console.log("Raw API response:", response.data);

        let dortoirsData = [];
        if (Array.isArray(response.data)) {
          dortoirsData = response.data;
        } else if (
          response.data.dormitories &&
          Array.isArray(response.data.dormitories)
        ) {
          dortoirsData = response.data.dormitories;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          dortoirsData = response.data.data;
        } else {
          console.error("Unexpected API structure:", response.data);
          setApiError(
            "Invalid data format from server. Please contact support."
          );
          setLoading(false);
          return;
        }

        setDortoirs(dortoirsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dormitories:", err);
        setApiError(
          err.response?.data?.message ||
            "Unable to load dormitories. Please try again."
        );
        setLoading(false);
        setDortoirs([]);
      }
    };

    if (sexe) {
      fetchDormitories();
    } else {
      setDortoirs([]);
      setLoading(false);
    }
  }, [sexe]);

  // ✅ Auto-select "Pépinière" dormitory for age 5–11
  useEffect(() => {
    const age = Number(data.age);
    if (!age || age < 5 || age > 11) return;
    if (!Array.isArray(dortoirs) || dortoirs.length === 0) return;

    const targetName = sexe === "M" ? "Pépinière Homme" : "Pépinière Femme";

    const target = dortoirs.find(
      (d) =>
        d.name?.toLowerCase() === targetName.toLowerCase() &&
        (d.available || 0) > 0
    );

    if (target) {
      onChange({
        dortoir: target.name,
        dortoirId: target.code,
        dortoirCode: target.code,
        matricule: "",
      });
      setError("");
      console.log("Auto-selected dormitory:", target.name, target.code);
    } else {
      setError(
        `Aucun dortoir "${targetName}" n'est disponible pour le moment.`
      );
    }
  }, [data.age, sexe, dortoirs, onChange]);

  const handleDormitorySelect = (dortoir) => {
    const age = Number(data.age);
    if (age >= 5 && age <= 11) {
      // On bloque le choix manuel pour la pépinière
      return;
    }

    const available = dortoir.available || 0;

    if (available <= 0) {
      setError(
        `The dormitory "${dortoir.name}" is full. Please choose another.`
      );
      return;
    }

    if (data.dortoirId === dortoir.code) {
      onChange({
        dortoir: "",
        dortoirId: "",
        dortoirCode: "",
      });
      setError("");
      return;
    }

    onChange({
      dortoir: dortoir.name,
      dortoirId: dortoir.code,
      dortoirCode: dortoir.code,
      matricule: "",
    });
    setError("");

    console.log("Selected dormitory:", dortoir.name, dortoir.code);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.dortoir) {
      setError("Please select a dormitory");
      return;
    }
    onNext();
  };

  if (loading) {
    return (
      <div className="step-form">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading available dormitories...</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="step-form">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Connection Error</h3>
          <p>{apiError}</p>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              style={{ margin: "0 5px" }}
              onClick={onPrevious}
            >
              ← Previous
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allFull =
    Array.isArray(dortoirs) &&
    dortoirs.length > 0 &&
    dortoirs.every((d) => (d.available || 0) === 0);

  if (allFull) {
    return (
      <div className="step-form">
        <div className="no-availability-container">
          <div className="icon-large">🏠</div>
          <h3>Aucun Dortoir Disponible</h3>
          <p>
            Tous les dortoirs {sexe === "M" ? "masculins" : "féminins"} sont
            actuellement complets.
          </p>

          <div className="info-card">
            <p>
              <strong>Que faire ?</strong> – Contactez-nous au{" "}
              <a href="tel:+2250787944973">+2250787944973</a> – Envoyez un email
              à <a href="mailto:contact@annour.ci">contact@annour.ci</a> –
              Réessayez plus tard
            </p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              style={{ margin: "0 5px" }}
              onClick={onPrevious}
            >
              ← Précédent
            </button>
          </div>
        </div>
      </div>
    );
  }

  const age = Number(data.age);
  const isPepiniereAge = age >= 5 && age <= 11;

  return (
    <div className="step-form">
      <div className="step-header">
        <h2>🏠 Sélection du Dortoir</h2>
        <p>
          {isPepiniereAge
            ? "Pour les 5-11 ans, le dortoir Pépinière est attribué automatiquement."
            : "Sélectionnez votre dortoir parmi les options disponibles"}
        </p>
      </div>
    
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="dormitory-grid">
          {Array.isArray(dortoirs) && dortoirs.length > 0 ? (
            dortoirs.map((dortoir) => {
              const available = dortoir.available || 0;
              const capacity = dortoir.capacity || 30;
              const isAvailable = available > 0;
              const isSelected = data.dortoirId === dortoir.code;
              const occupancyPercent =
                ((capacity - available) / capacity) * 100;

              const targetName =
                sexe === "M" ? "Pépinière Homme" : "Pépinière Femme";
              const isPepiniere =
                dortoir.name?.toLowerCase() === targetName.toLowerCase();

              const clickable =
                !isPepiniereAge || (isPepiniereAge && isPepiniere);

              return (
                <div
                  key={dortoir.code}
                  className={`dormitory-card ${
                    !isAvailable ? "disabled" : ""
                  } ${isSelected ? "selected" : ""} ${
                    !clickable ? "non-clickable" : ""
                  }`}
                  onClick={() =>
                    isAvailable && clickable && handleDormitorySelect(dortoir)
                  }
                >
                  <div className="dormitory-card-header">
                    <h3 className="dormitory-name">{dortoir.name}</h3>
                    {isSelected && (
                      <span className="selected-badge">✓</span>
                    )}
                  </div>

                  <div className="dormitory-capacity">
                    <div className="capacity-text">
                      <span className="available-count">{available}</span>
                      <span className="capacity-total">/{capacity}</span>
                      <span className="capacity-label">places disponible</span>
                    </div>

                    <div className="capacity-bar">
                      <div
                        className={`capacity-fill ${
                          occupancyPercent > 80 ? "critical" : ""
                        }`}
                        style={{
                          width: `${Math.min(occupancyPercent, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div
                    className={`availability-status ${
                      isAvailable ? "disponible" : "indisponible"
                    }`}
                  >
                    {isAvailable ? "✓ Disponible" : "✗ Indisponible"}
                  </div>
                </div>
              );
            })
          ) : (
            <p>Aucun dortoir trouvé. Veuillez vérifier votre sélection.</p>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ margin: "0 5px" }}
            onClick={onPrevious}
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
            Précédent
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ margin: "0 5px" }}
            disabled={!data.dortoir}
          >
            Suivant
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StepDormitory;
