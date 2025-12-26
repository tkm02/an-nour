import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFeedback } from '../services/api';
import './FeedbackPage.css';

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
    try {
      await createFeedback(formData);
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
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= formData.globalRating ? 'active' : ''}`}
                  onClick={() => handleRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
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
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= formData.cateringRating ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, cateringRating: star }))}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Accommodation Rating */}
          <div className="form-group">
            <label>Confort des dortoirs</label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= formData.accommodationRating ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, accommodationRating: star }))}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Training Rating */}
          <div className="form-group">
            <label>Qualité des formations</label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= formData.trainingRating ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, trainingRating: star }))}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Content Quality - Scale 1-5 */}
          <div className="form-group">
            <label>Qualité du contenu</label>
            <div className="scale-container">
              {[1, 2, 3, 4, 5].map((num) => (
                <div
                  key={num}
                  className={`scale-item ${formData.contentQuality === num ? 'selected' : ''}`}
                  onClick={() => handleScale(num)}
                >
                  {num}
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
