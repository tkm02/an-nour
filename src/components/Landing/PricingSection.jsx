import React from 'react';
import { useNavigate } from 'react-router-dom';
import logowave from "../../images/wave.png";
import './PricingSection.css';

const PricingSection = () => {
  const navigate = useNavigate();

  const included = [
    { icon: '🏠', text: 'Hébergement 6 jours / 5 nuits' },
    { icon: '🍽️', text: 'Restauration complète (3 repas/jour)' },
    { icon: '📋', text: 'Toutes les activités du programme' },
    { icon: '📖', text: 'Cours de formation islamique' },
    { icon: '⚽', text: 'Activités sportives et récréatives' },
    { icon: '🏆', text: 'Certificat de participation' }
  ];

  return (
    <section id="tarif" className="pricing-section">
      {/* Background Elements */}
      <div className="pricing-bg">
        <div className="pricing-orb orb-1"></div>
        <div className="pricing-orb orb-2"></div>
        <div className="pricing-pattern">
          <svg viewBox="0 0 1000 1000">
            <defs>
              <pattern id="pricing-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pricing-dots)" />
          </svg>
        </div>
      </div>

      <div className="container">
        {/* Header */}
        <div className="section-header" data-aos="fade-up">
          
          <h2 className="section-title">Inscription au séminaire</h2>
          <p className="section-description">
            Un tarif unique pour 6 jours d'expérience inoubliable
          </p>
        </div>

        {/* Pricing Card */}
        <div className="pricing-card" data-aos="zoom-in" data-aos-delay="200">
          {/* Card Glow Effect */}
          <div className="card-glow-effect"></div>

          {/* Popular Badge */}
      

          {/* Header */}
          <div className="pricing-header">
            <div className="pricing-icon-wrapper">
              <svg viewBox="0 0 100 100" className="pricing-icon">
                <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.1" />
                <path
                  d="M50,20 L55,40 L75,45 L55,50 L50,70 L45,50 L25,45 L45,40 Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <h3 className="pricing-title">Participation complète</h3>

            <div className="pricing-amount">
              <div className="amount-wrapper">
                <span className="amount">6 000</span>
                <span className="currency-symbol">FCFA</span>
              </div>
              <p className="pricing-subtitle">Par participant</p>
            </div>
          </div>

          {/* Divider */}
          <div className="pricing-divider">
            <span className="divider-text">Tout compris</span>
          </div>

          {/* Body */}
          <div className="pricing-body">
            <h4 className="included-title">
              <span className="title-icon">✨</span>
              Ce qui est inclus
            </h4>

            <ul className="included-list">
              {included.map((item, index) => (
                <li
                  key={index}
                  className="included-item"
                  data-aos="fade-right"
                  data-aos-delay={300 + index * 50}
                >
                  
                  <div className="item-content">
                    <span className="item-icon">{item.icon}</span>
                    <span className="item-text">{item.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="pricing-footer">
            <button
              className="btn btn-primary btn-large"
              onClick={() => navigate('/inscription')}
            >
              <span>Je m'inscris maintenant</span>
              <svg className="btn-arrow" width="20" height="20" viewBox="0 0 20 20">
                <path d="M10 3L9 4L14 9H3v2h11l-5 5 1 1 7-7-7-7z" fill="currentColor" />
              </svg>
            </button>

            <div className="payment-info">
              <div className="payment-icon">
                <img src={logowave} alt="logowave" style={{ width: '80px', height: '80px' }} />
              </div>
              <div className="payment-text">
                <span>Paiement sécurisé via</span>
                <strong>Wave Mobile Money</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="contact-info" data-aos="fade-up" data-aos-delay="400">
          <div className="contact-card">
            <div className="contact-icon-wrapper">
              <span className="contact-icon">💬</span>
            </div>
            <div className="contact-content">
              <p className="contact-title">Une question sur le séminaire ?</p>
              <div className="contact-numbers">
                <a href="tel:+2250545844135" className="contact-link">
                  <span className="link-icon">📞</span>
                  <span>05 45 84 41 35</span>
                </a>
                <span className="separator"></span>
                <a href="tel:+2250142080537" className="contact-link">
                  <span className="link-icon">📞</span>
                  <span>01 42 08 05 37</span>
                </a>
                <span className="separator"></span>
                <a href="tel:+2250787944973" className="contact-link">
                  <span className="link-icon">📞</span>
                  <span>0787944973</span>
                </a>
              </div>
              <p className="contact-hours">Disponible 7j/7 de 8h à 20h</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;