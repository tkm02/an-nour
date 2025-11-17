// src/components/Registration/StepPayment.jsx
import React, { useState } from "react";
import axios from "axios";
import "./StepPayment.css";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";

const API_URL =  process.env.REACT_APP_API_URL; // Ton API

const StepPayment = ({
  data,
  onNext,
  onPrevious,
  registrationType = "single",
}) => {
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [transactionId, setTransactionId] = useState("");
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState(null);
  const [registrationResponse, setRegistrationResponse] = useState(null);

  const calculateTotalAmount = () => {
    if (registrationType === "multiple" && data.children) {
      return data.children.length * 1000;
    }
    return 1000;
  };

  const totalAmount = calculateTotalAmount();
  const numberOfParticipants =
    registrationType === "multiple" ? data.children?.length || 0 : 1;
  const wavePaymentUrl = `https://pay.wave.com/m/M_ci_EG_sCkR022Up/c/ci/?amount=${totalAmount}`;

  // ===== VÉRIFICATION OCR VIA BACKEND =====

  const verifyReceiptWithBackend = async (imageFile) => {
    setIsUploading(true);
    setOcrProgress(0);
    setVerificationResult(null);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("expected_amount", totalAmount);

      setOcrProgress(20);

      const response = await axios.post(
        `${API_URL}/api/v1/registrations/verify-receipt`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          params: {
            expected_amount: totalAmount,
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 80) / progressEvent.total
            );
            setOcrProgress(20 + progress);
          },
        }
      );

      setOcrProgress(100);

      console.log("Résultat backend:", response.data);
      setVerificationResult(response.data);

      if (!response.data.isValid) {
        setUploadError(response.data.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erreur backend:", error);
      if (error.response?.data?.message) {
        setUploadError(error.response.data.message);
      } else if (error.response) {
        setUploadError("Erreur lors de la vérification. Veuillez réessayer.");
      } else {
        setUploadError(
          "Impossible de contacter le serveur. Vérifiez votre connexion."
        );
      }
      return false;
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setOcrProgress(0);
      }, 500);
    }
  };

  // ===== HANDLERS =====

  const handleInitiatePayment = () => {
    localStorage.setItem(
      "an-nour-registration",
      JSON.stringify({
        ...data,
        paymentInfo: {
          status: "awaiting_proof",
          amount: totalAmount,
        },
      })
    );

    window.open(wavePaymentUrl, "_blank");
    setPaymentStatus("awaiting_proof");
  };

  const handleReceiptChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image trop grande (max 10 MB)");
      return;
    }

    setUploadError("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result);
    };
    reader.readAsDataURL(file);

    const isValid = await verifyReceiptWithBackend(file);

    if (isValid) {
      setReceiptImage(file);
    }
  };

   const handleUploadReceipt = async () => {
    if (!receiptImage || !verificationResult?.isValid) {
      setUploadError("Veuillez uploader une preuve valide");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError("");

      console.log('🚀 Upload vers Cloudinary...');

      // ✅ Upload vers Cloudinary
      const uploadResult = await uploadToCloudinary(receiptImage);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Échec upload image');
      }

      console.log('✅ Image uploadée:', uploadResult.url);
      console.log('📦 Taille:', (uploadResult.size / 1024).toFixed(2), 'KB');

      // Préparer les données de paiement avec URL Cloudinary
      const paymentData = {
        transactionId: verificationResult.extractedData.transactionId,
        amount: verificationResult.extractedData.amount,
        receiptUrl: uploadResult.url, // ✅ URL Cloudinary
      };

      console.log('💾 Sauvegarde des données:', paymentData);

      // Sauvegarder dans localStorage
      const savedData = JSON.parse(localStorage.getItem("an-nour-registration") || "{}");
      const updatedData = {
        ...savedData,
        paymentInfo: paymentData,
      };

      localStorage.setItem("an-nour-registration", JSON.stringify(updatedData));

      setTransactionId(verificationResult.extractedData.transactionId);
      setPaymentStatus("completed");

      console.log('✅ Upload terminé avec succès');

    } catch (error) {
      console.error("❌ Erreur upload:", error);
      setUploadError(
        error.message || "Erreur lors de l'upload. Veuillez réessayer."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmPayment = async () => {
  try {
    setIsUploading(true);

    // Récupérer toutes les données du localStorage
    const fullRegistrationData = JSON.parse(
      localStorage.getItem("an-nour-registration") || "{}"
    );

    console.log("📦 Données brutes du localStorage:", fullRegistrationData);

    // ✅ Nettoyer et préparer les données à envoyer
    const cleanedData = {
      personalInfo: {
        nom: fullRegistrationData.personalInfo.nom,
        prenom: fullRegistrationData.personalInfo.prenom,
        sexe: fullRegistrationData.personalInfo.sexe,
        age: fullRegistrationData.personalInfo.age,
        communeHabitation: fullRegistrationData.personalInfo.communeHabitation,
        niveauAcademique: fullRegistrationData.personalInfo.niveauAcademique,
        communeAutre: fullRegistrationData.personalInfo.communeAutre || ""
      },
      dormitoryInfo: {
        dortoirId: fullRegistrationData.dormitoryInfo.dortoirCode,
        dortoir: fullRegistrationData.dormitoryInfo.dortoir,
        // ❌ Retirer: dortoir, matricule (sera généré par le backend)
      },
      healthInfo: {
        allergie: fullRegistrationData.healthInfo.allergie,
        antecedentMedical: fullRegistrationData.healthInfo.antecedentMedical
      },
      paymentInfo: {
        transactionId: fullRegistrationData.paymentInfo.transactionId,
        amount: fullRegistrationData.paymentInfo.amount,
        receiptUrl: fullRegistrationData.paymentInfo.receiptUrl
        // ❌ Retirer: timestamp (sera généré par le backend)
      }
    };

    console.log("✅ Données nettoyées à envoyer:", cleanedData);

    // Envoyer au backend
    const response = await axios.post(
      `${API_URL}/api/v1/registrations`,
      cleanedData,
      {
        headers: {
          "Content-Type": "application/json", // ✅ JSON au lieu de form-data
        },
      }
    );

    console.log("✅ Réponse du backend:", response.data);

    // Sauvegarder la réponse complète
    setRegistrationResponse(response.data);

    // Mettre à jour le localStorage avec la réponse du backend
    localStorage.setItem(
      "an-nour-registration",
      JSON.stringify({
        ...fullRegistrationData,
        registrationId: response.data.id,
        matricule: response.data.matricule, // ✅ Matricule généré par le backend
        qrCode: response.data.qrCode,
        confirmedAt: response.data.confirmedAt,
      })
    );

    // Passer à l'étape de confirmation
    onNext();
    
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi:", error);

    if (error.response?.data?.message) {
      setUploadError(error.response.data.message);
    } else if (error.response?.data?.detail) {
      setUploadError(error.response.data.detail);
    } else {
      setUploadError("Erreur lors de l'envoi des données. Veuillez réessayer.");
    }
  } finally {
    setIsUploading(false);
  }
};


  // ===== RENDER =====

  return (
    <div className="step-form">
      <div className="form-header">
        <h2>💳 Paiement</h2>
        <p>Finalisez votre inscription en effectuant le paiement</p>
      </div>

      <div className="form-content">
        {/* Récapitulatif */}
        <div className="payment-summary">
          <div className="summary-header">
            <h3>Récapitulatif</h3>
          </div>

          <div className="summary-body">
            {registrationType === "single" ? (
              <>
                <div className="summary-item">
                  <span className="label">Participant</span>
                  <span className="value">
                    {data.personalInfo.prenom} {data.personalInfo.nom}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">Dortoir</span>
                  <span className="value">{data.dormitoryInfo.dortoir}</span>
                </div>
              </>
            ) : (
              <>
                <div className="summary-item">
                  <span className="label">Parent/Tuteur</span>
                  <span className="value">
                    {data.parent.prenom} {data.parent.nom}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">Enfants</span>
                  <span className="value">{numberOfParticipants}</span>
                </div>
              </>
            )}
          </div>

          <div className="summary-total">
            <span className="label">Montant total</span>
            <span className="amount">{totalAmount.toLocaleString()} FCFA</span>
          </div>
        </div>

        {/* Étape 1: Paiement Wave */}
        {paymentStatus === "pending" && (
          <div className="payment-stage">
            <div className="payment-method-card">
              <div className="method-icon">📱</div>
              <div className="method-details">
                <h4>Paiement Wave</h4>
                <p>Paiement mobile money sécurisé et instantané</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-header">
                <span className="info-icon">💡</span>
                <strong>Comment procéder ?</strong>
              </div>
              <ol className="info-steps">
                <li>Cliquez sur le bouton "Payer avec Wave"</li>
                <li>Complétez le paiement sur la page Wave</li>
                <li>
                  <strong>Prenez une capture d'écran de qualité :</strong>
                  <ul className="quality-requirements">
                    <li>
                      ✓ Image <strong>nette et claire</strong> (pas floue)
                    </li>
                    <li>
                      ✓ Tous les textes <strong>bien lisibles</strong>
                    </li>
                    <li>
                      ✓ Reçu <strong>complet</strong> (pas coupé)
                    </li>
                    <li>✓ Bon éclairage (évitez les zones sombres)</li>
                  </ul>
                </li>
                <li>Revenez ici et uploadez la capture</li>
              </ol>
            </div>

            <div className="alert alert-warning">
              <span>⚠️</span>
              <div>
                <strong>Important !</strong> La qualité de votre capture est
                cruciale. Une image floue ou mal cadrée sera automatiquement
                rejetée.
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-payment"
              onClick={handleInitiatePayment}
            >
              <span>💳</span>
              Payer {totalAmount.toLocaleString()} FCFA avec Wave
            </button>
          </div>
        )}

        {/* Étape 2: Upload preuve */}
        {paymentStatus === "awaiting_proof" && (
          <div className="payment-stage">
            <div className="upload-header">
              <div className="upload-icon-large">📸</div>
              <h3>Téléchargez votre preuve de paiement</h3>
              <p>
                Importez une capture d'écran nette de votre confirmation Wave
              </p>
            </div>

            <div className="transaction-card">
              <div className="transaction-amount">
                {totalAmount.toLocaleString()} FCFA
              </div>
            </div>

            {!receiptPreview ? (
              <label htmlFor="receipt-upload" className="upload-zone">
                <input
                  type="file"
                  id="receipt-upload"
                  accept="image/*"
                  onChange={handleReceiptChange}
                  disabled={isUploading}
                  style={{ display: "none" }}
                />
                <div className="upload-content">
                  <div className="upload-icon">📤</div>
                  <div className="upload-text">
                    <p className="upload-title">
                      Cliquez pour choisir une image
                    </p>
                    <p className="upload-hint">ou glissez-déposez ici</p>
                  </div>
                  <p className="upload-format">PNG, JPG, JPEG - Max 10 MB</p>
                </div>
              </label>
            ) : (
              <div className="preview-card">
                <div className="preview-header">
                  <h4>Aperçu de la capture</h4>
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => {
                      setReceiptImage(null);
                      setReceiptPreview(null);
                      setVerificationResult(null);
                      setUploadError("");
                    }}
                    disabled={isUploading}
                  >
                    Changer
                  </button>
                </div>
                <div className="preview-image-wrapper">
                  <img
                    src={receiptPreview}
                    alt="Aperçu"
                    className="preview-image"
                  />
                </div>
              </div>
            )}

            {/* Progression */}
            {isUploading && (
              <div className="ocr-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${ocrProgress}%` }}
                  >
                    <span className="progress-text">{ocrProgress}%</span>
                  </div>
                </div>
                <p className="progress-label">Vérification en cours...</p>
              </div>
            )}

            {/* Résultat */}
            {verificationResult && !isUploading && (
              <div
                className={`verification-result-simple ${
                  verificationResult.isValid ? "valid" : "invalid"
                }`}
              >
                {verificationResult.isValid ? (
                  <div className="result-success">
                    <div className="success-icon">✓</div>
                    <h4>{verificationResult.message}</h4>
                    <p>Vous pouvez maintenant confirmer votre paiement</p>
                  </div>
                ) : (
                  <div className="result-error">
                    <div className="error-icon">✗</div>
                    <h4>Vérification échouée</h4>
                    <p>{verificationResult.message}</p>
                  </div>
                )}
              </div>
            )}

            {uploadError && (
              <div className="alert alert-error">
                <span>⚠️</span>
                <span>{uploadError}</span>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUploadReceipt}
              disabled={
                !receiptImage || !verificationResult?.isValid || isUploading
              }
            >
              {isUploading ? (
                <>
                  <span className="spinner"></span>
                  Upload en cours...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Confirmer le paiement
                </>
              )}
            </button>
          </div>
        )}

        {/* Étape 3: Succès */}
        {paymentStatus === "completed" && (
          <div className="payment-stage success-stage">
            <div className="success-animation">
              <div className="success-checkmark">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle
                    cx="40"
                    cy="40"
                    r="38"
                    stroke="#10b981"
                    strokeWidth="4"
                  />
                  <path
                    d="M25 40L35 50L55 30"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <h3 className="success-title">Preuve reçue avec succès !</h3>
            <p className="success-text">
              Votre paiement de{" "}
              <strong>{totalAmount.toLocaleString()} FCFA</strong> est confirmé.
            </p>

            <div className="success-details">
              {transactionId && (
                <div className="detail-row">
                  <span className="detail-label">Transaction</span>
                  <span className="detail-value">{transactionId}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Montant</span>
                <span className="detail-value">
                  {totalAmount.toLocaleString()} FCFA
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Statut</span>
                <span className="detail-value status-success">
                  <span className="status-dot"></span>
                  Validé
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmPayment}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className="spinner"></span>
                  Finalisation...
                </>
              ) : (
                <>
                  Continuer
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
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {(paymentStatus === "pending" || paymentStatus === "awaiting_proof") && (
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onPrevious}
            disabled={isUploading}
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
        </div>
      )}
    </div>
  );
};

export default StepPayment;
