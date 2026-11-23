import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFeedback } from '../services/api';
import './FeedbackPage.css';

// Notation accessible au clavier (P-25) : chaque valeur est un radio natif masqué visuellement, placé dans
// l'élément existant (rendu inchangé) ; le clic souris sur l'étoile reste géré par son onClick.
const NoteEtoiles = ({ name, label, value, onSelect }) => (
  <div className="rating-stars" role="radiogroup" aria-label={label}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`star ${star <= value ? 'active' : ''}`}
        onClick={() => onSelect(star)}
      >
        <input
          type="radio"
          className="visually-hidden"
          name={name}
          value={star}
          checked={value === star}
          onChange={() => onSelect(star)}
          aria-label={`${star} sur 5`}
        />
        <span aria-hidden="true">★</span>
      </span>
    ))}
  </div>
);

const FeedbackPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    globalRating: 0,
    organizationRating: 5,
    cateringRating: 0,
    accommodationRating: 0,
    trainingRating: 0,
    gender: '',
    contentQuality: 0,
    durationAppropriate: '',
    recommend: '',
    likedAspects: '',
    improvementAspects: '',
    contactName: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRating = (value) => {
    setFormData(prev => ({
      ...prev,
      globalRating: value
    }));
  };

  const handleScale = (value) => {
    setFormData(prev => ({
      ...prev,
      contentQuality: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Map form state to API schema
    const payload = {
      sexe: formData.gender,
      nom: formData.contactName,
      note_globale: Number(formData.globalRating),
      qualite_nourriture: Number(formData.cateringRating),
      confort_dortoirs: Number(formData.accommodationRating),
      qualite_formations: Number(formData.trainingRating),
      qualite_contenu: Number(formData.contentQuality),
      note_organisation: Number(formData.organizationRating),
      duree_appropriee: formData.durationAppropriate === 'true',
      recommande: formData.recommend === 'true',
      points_apprecies: formData.likedAspects,
      suggestions: formData.improvementAspects
    };

    try {
      await createFeedback(payload);
      alert('Merci pour votre avis !');
      navigate('/');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <div className="feedback-header">
          <h1>Votre Avis Compte</h1>
          <p>Aidez-nous à améliorer les prochains séminaires</p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          {/* Gender */}
          <div className="form-group">
            <label>Sexe</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="gender"
                  value="M"
                  checked={formData.gender === 'M'}
                  onChange={handleChange}
                  required
                />
                Homme
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="gender"
                  value="F"
                  checked={formData.gender === 'F'}
                  onChange={handleChange}
                />
                Femme
              </label>
            </div>
          </div>

          {/* Global Rating - Stars */}
          <div className="form-group">
            <label>Note globale du séminaire</label>
            <NoteEtoiles
              name="globalRating-etoiles"
              label="Note globale du séminaire"
              value={formData.globalRating}
              onSelect={handleRating}
            />
            <input 
              type="hidden" 
              name="globalRating" 
              required 
              value={formData.globalRating || ''} 
            />
          </div>

          {/* Organization - Range */}
          <div className="form-group">
            <label>Comment jugez-vous l'organisation ? (0-10)</label>
            <div className="range-container">
              <input
                type="range"
                name="organizationRating"
                min="0"
                max="10"
                value={formData.organizationRating}
                onChange={handleChange}
              />
              <span className="range-value">{formData.organizationRating}/10</span>
            </div>
          </div>

          {/* Catering Rating */}
          <div className="form-group">
            <label>Qualité de la nourriture</label>
            <NoteEtoiles
              name="cateringRating-etoiles"
              label="Qualité de la nourriture"
              value={formData.cateringRating}
              onSelect={(note) => setFormData(prev => ({ ...prev, cateringRating: note }))}
            />
          </div>

          {/* Accommodation Rating */}
          <div className="form-group">
            <label>Confort des dortoirs</label>
            <NoteEtoiles
              name="accommodationRating-etoiles"
              label="Confort des dortoirs"
              value={formData.accommodationRating}
              onSelect={(note) => setFormData(prev => ({ ...prev, accommodationRating: note }))}
            />
          </div>

          {/* Training Rating */}
          <div className="form-group">
            <label>Qualité des formations</label>
            <NoteEtoiles
              name="trainingRating-etoiles"
              label="Qualité des formations"
              value={formData.trainingRating}
              onSelect={(note) => setFormData(prev => ({ ...prev, trainingRating: note }))}
            />
          </div>

          {/* Content Quality - Scale 1-5 */}
          <div className="form-group">
            <label>Qualité du contenu</label>
            <div className="scale-container" role="radiogroup" aria-label="Qualité du contenu">
              {[1, 2, 3, 4, 5].map((num) => (
                <div
                  key={num}
                  className={`scale-item ${formData.contentQuality === num ? 'selected' : ''}`}
                  onClick={() => handleScale(num)}
                >
                  <input
                    type="radio"
                    className="visually-hidden"
                    name="contentQuality-echelle"
                    value={num}
                    checked={formData.contentQuality === num}
                    onChange={() => handleScale(num)}
                    aria-label={`${num} sur 5`}
                  />
                  <span aria-hidden="true">{num}</span>
                </div>
              ))}
            </div>
            <input 
              type="hidden" 
              name="contentQuality" 
              required 
              value={formData.contentQuality || ''} 
            />
          </div>

          {/* True/False Questions */}
          <div className="form-group">
            <label>La durée du séminaire était-elle appropriée ?</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="durationAppropriate"
                  value="true"
                  checked={formData.durationAppropriate === 'true'}
                  onChange={handleChange}
                  required
                />
                Oui
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="durationAppropriate"
                  value="false"
                  checked={formData.durationAppropriate === 'false'}
                  onChange={handleChange}
                />
                Non
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Recommanderiez-vous ce séminaire ?</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="recommend"
                  value="true"
                  checked={formData.recommend === 'true'}
                  onChange={handleChange}
                  required
                />
                Oui
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="recommend"
                  value="false"
                  checked={formData.recommend === 'false'}
                  onChange={handleChange}
                />
                Non
              </label>
            </div>
          </div>

          {/* Text Areas */}
          <div className="form-group">
            <label>Qu'avez-vous le plus apprécié ?</label>
            <textarea
              name="likedAspects"
              value={formData.likedAspects}
              onChange={handleChange}
              placeholder="Dites-nous ce qui vous a plu..."
              required
            />
          </div>

          <div className="form-group">
            <label>Que pouvons-nous améliorer ?</label>
            <textarea
              name="improvementAspects"
              value={formData.improvementAspects}
              onChange={handleChange}
              placeholder="Vos suggestions sont précieuses..."
              required
            />
          </div>

          {/* Optional Contact */}
          <div className="form-group">
            <label>Votre nom (Optionnel)</label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="Pour vous recontacter si nécessaire"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer mon avis'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage;
