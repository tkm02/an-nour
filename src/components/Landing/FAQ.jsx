// src/components/Landing/FAQs.jsx
import React, { useState } from 'react';
import './FAQs.css';

const FAQs = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      icon: '📝',
      question: "Comment puis-je m'inscrire au séminaire ?",
      answer: "L'inscription se fait en ligne sur notre plateforme. Cliquez sur le bouton 'S'inscrire' et suivez les étapes. Vous pouvez inscrire une personne ou plusieurs enfants en une seule fois."
    },
    {
      icon: '💳',
      question: "Quels sont les modes de paiement acceptés ?",
      answer: "Le paiement se fait via Wave Mobile Money. Après avoir rempli le formulaire d'inscription, vous serez redirigé vers Wave pour effectuer le paiement de manière sécurisée."
    },
    {
      icon: '🏠',
      question: "Puis-je choisir mon dortoir ?",
      answer: "Oui, lors de l'inscription, vous pourrez choisir votre dortoir selon les disponibilités. Les dortoirs sont séparés par sexe avec 30 places chacun."
    },
    {
      icon: '🎒',
      question: "Que dois-je apporter pour le séminaire ?",
      answer: "Apportez vos effets personnels, vêtements pour 6 jours, articles de toilette, Qur'an, cahier et stylo. Les repas et le logement sont fournis."
    },
    {
      icon: '👥',
      question: "Le séminaire est-il ouvert à tous les âges ?",
      answer: "Non, le séminaire est ouvert aux personnes de plus de 5 ans, du primaire jusqu'aux professionnels."
    },
  
    {
      icon: '🏥',
      question: "Y a-t-il un suivi médical pendant le séminaire ?",
      answer: "Oui, une équipe médicale sera présente sur place. Lors de l'inscription, vous devrez mentionner toute allergie ou antécédent médical."
    }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq-section">
      {/* Background Elements */}
      <div className="faq-bg">
        <div className="faq-pattern">
          <svg viewBox="0 0 1000 1000">
            <defs>
              <pattern id="faq-grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#faq-grid)" />
          </svg>
        </div>
      </div>

      <div className="container">
        {/* Header */}
        <div className="section-header" data-aos="fade-up">
      
          <h2 className="section-title">Questions fréquentes</h2>
          <p className="section-description">
            Trouvez les réponses aux questions les plus courantes
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${activeIndex === index ? 'active' : ''}`}
              data-aos="fade-up"
              data-aos-delay={index * 50}
            >
              {/* FAQ Card */}
              <div className="faq-card">
                {/* Icon Badge */}
                <div className="faq-icon-badge">
                  <span className="faq-emoji">{faq.icon}</span>
                </div>

                {/* Question Button */}
                <button 
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={activeIndex === index}
                >
                  <span className="question-text">{faq.question}</span>
                  <span className="faq-toggle">
                    <svg 
                      className={`toggle-icon ${activeIndex === index ? 'rotated' : ''}`}
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        d="M19 9l-7 7-7-7" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </span>
                </button>

                {/* Answer */}
                <div className={`faq-answer ${activeIndex === index ? 'open' : ''}`}>
                  <div className="answer-content">
                    <div className="answer-indicator"></div>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="faq-contact" data-aos="fade-up" data-aos-delay="400">
          <div className="contact-box">
            <div className="contact-icon-wrapper">
              <span className="contact-emoji">💬</span>
              <div className="icon-pulse"></div>
            </div>
            <div className="contact-content">
              <h3 className="contact-title">Vous ne trouvez pas la réponse ?</h3>
              <p className="contact-text">Notre équipe est là pour vous aider</p>
            </div>
            <div className="contact-actions">
              <a href="tel:+2250545844135" className="btn btn-primary">
                <span>📞</span>
                <span>Contactez-nous</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQs;
