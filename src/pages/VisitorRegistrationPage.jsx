import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoAnnour from '../images/ANNOUR LOGO.PNG';
import { createVisitor } from '../services/api';
import './VisitorRegistrationPage.css';

const VisitorRegistrationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    contact: ''
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    // Nom validation (min 2 chars)
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est obligatoire';
    } else if (formData.nom.trim().length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }

    // Prénom validation (min 2 chars)
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est obligatoire';
    } else if (formData.prenom.trim().length < 2) {
      newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
    }

    // Contact validation (must be 10 digits)
    const phoneRegex = /^(01|05|07)\d{8}$/;
    if (!formData.contact.trim()) {
      newErrors.contact = 'Le contact est obligatoire';
    } else if (!phoneRegex.test(formData.contact.replace(/\s/g, ''))) {
      newErrors.contact = 'Le numéro doit commencer par 01, 05 ou 07 et contenir 10 chiffres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await createVisitor(formData);
      
      if (response && (response.id || response.created_at)) {
        setStatus({ type: 'success', message: 'Visiteur enregistré avec succès !' });
        setFormData({ nom: '', prenom: '', contact: '' });
      } else {
        const errorMsg = response.detail ? 
          (Array.isArray(response.detail) ? response.detail.map(d => d.msg).join(', ') : response.detail) 
          : 'Erreur lors de l\'enregistrement';
        setStatus({ type: 'error', message: errorMsg });
      }
    } catch (error) {
      console.error('Error creating visitor:', error);
      setStatus({ type: 'error', message: 'Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="visitor-page">
      <div className="visitor-container">
        <div className="visitor-header">
          <img src={logoAnnour} alt="An-Nour" className="visitor-logo" onClick={() => navigate('/')} />
          <h1>Nouveau Visiteur</h1>
          <p>Enregistrez un nouveau visiteur pour l'événement</p>
        </div>

        <form className="visitor-form" onSubmit={handleSubmit} noValidate>
          {status.message && (
            <div className={`status-message ${status.type}`}>
              {status.message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="nom">Nom</label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className={errors.nom ? 'input-error' : ''}
              placeholder="Entrez le nom"
            />
            {errors.nom && <span className="error-text">{errors.nom}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="prenom">Prénom</label>
            <input
              type="text"
              id="prenom"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              className={errors.prenom ? 'input-error' : ''}
              placeholder="Entrez le prénom"
            />
            {errors.prenom && <span className="error-text">{errors.prenom}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="contact">Contact</label>
            <input
              type="tel"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className={errors.contact ? 'input-error' : ''}
              placeholder="Numéro de téléphone (ex: 0707070707)"
            />
            {errors.contact && <span className="error-text">{errors.contact}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitorRegistrationPage;
