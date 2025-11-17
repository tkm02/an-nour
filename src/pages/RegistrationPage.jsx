import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../components/Registration/Stepper";
import StepPersonnalInfo from "../components/Registration/StepPersonalInfo";
import StepDormitory from "../components/Registration/StepDormitory";
import StepHealthInfo from "../components/Registration/StepHealthInfo";
import StepPayment from "../components/Registration/StepPayment";
import StepConfirmation from "../components/Registration/StepConfirmation";
import "./RegistrationPage.css";

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  // const [registrationType, setRegistrationType] = useState("single");
  const registrationType = "single";
  const [formData, setFormData] = useState({
    personalInfo: {
      nom: "",
      prenom: "",
      sexe: "",
      age: "",
      communeHabitation: "",
      niveauAcademique: "",
    },
    dormitoryInfo: {
      dortoir: "",
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

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepPersonnalInfo
            data={formData.personalInfo}
            onChange={(data) => updateFormData("personalInfo", data)}
            onNext={handleNext}
          />
        );
      case 2:
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
          />
        );
      case 5:
        return <StepConfirmation data={formData} />;
      default:
        return null;
    }
  };

  // setRegistrationType("single");
  return (
    <div className="registration-page">
      {/* Header minimaliste */}
      <header className="reg-header">
        <div className="reg-container">
          <button className="btn-back" onClick={() => navigate("/")} aria-label="Retour">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Retour</span>
          </button>
          <div className="header-title">
            <h1>Inscription An-Nour 7.0</h1>
            <p className="step-indicator">
              Étape {currentStep} sur {steps.length}
            </p>
          </div>
        </div>
      </header>

      <main className="reg-main">
        {/* Stepper horizontal moderne */}
        <div className="stepper-container">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Formulaire centré */}
        <div className="form-wrapper">
          <div className="form-card">{renderStepContent()}</div>
        </div>
      </main>
    </div>
  );
};

export default RegistrationPage;
