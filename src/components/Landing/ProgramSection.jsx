import React from 'react';
import './ProgramSection.css';

const ProgramSection = () => {
  const activities = [
    {
      icon: '🎮',
      title: 'Jeu-concours AL ILM',
      description: 'Compétition amicale de connaissances islamiques',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '📖',
      title: 'Nuit du Coran',
      description: 'Récitation et méditation coranique nocturne',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '🎓',
      title: 'Cours de formation',
      description: 'Formations islamiques et développement personnel',
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: '🤝',
      title: 'Grins des sœurs',
      description: 'Rencontres et échanges entre participantes',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '⚽',
      title: 'Activités récréatives',
      description: 'Sports, jeux et moments de détente',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: '📚',
      title: 'Apprentissage du Coran',
      description: 'Sessions de mémorisation et tajwid',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const dortoirs = {
    freres: [
      { name: 'Nassr', meaning: 'Victoire', icon: '⭐' },
      { name: 'Basîr', meaning: 'Clairvoyance', icon: '👁️' },
      { name: 'Hilm', meaning: 'Maîtrise de soi', icon: '🧘' },
      { name: 'Sidane', meaning: 'Gardien', icon: '🛡️' },
      { name: 'Furqân', meaning: 'Discernement', icon: '⚖️' },
      { name: 'Riyâdh', meaning: 'Jardins', icon: '🌿' }
    ],
    soeurs: [
      { name: 'Najma', meaning: 'Étoile', icon: '✨' },
      { name: 'Hidaya', meaning: 'Guidance', icon: '🧭' },
      { name: 'Rahma', meaning: 'Miséricorde', icon: '💚' },
      { name: 'Sakîna', meaning: 'Sérénité', icon: '☮️' },
      { name: 'Salwa', meaning: 'Réconfort', icon: '🤗' },
      { name: 'Zahra', meaning: 'Fleur / Pureté', icon: '🌸' },
      { name: 'Firdaous', meaning: 'Paradis', icon: '🌺' },
      { name: 'Salam', meaning: 'Paix', icon: '🕊️' }
    ]
  };

  return (
    <>
      {/* Programme Section */}
      <section id="programme" className="program-section">
        {/* Background Pattern */}
        <div className="section-bg-pattern">
          <svg className="pattern-svg" viewBox="0 0 1000 1000">
            <defs>
              <pattern id="program-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="25" cy="25" r="2" fill="currentColor" opacity="0.1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#program-pattern)" />
          </svg>
        </div>

        <div className="container">
          {/* Header */}
          <div className="section-header" data-aos="fade-up">

            <h2 className="section-title">Au programme du séminaire</h2>
            <p className="section-description">
              Six jours d'activités enrichissantes pour renforcer votre foi
            </p>
          </div>

          {/* Activities Grid */}
          <div className="activities-grid">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="activity-card"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* Card Background Pattern */}
                <div className="card-pattern-bg">
                  <svg viewBox="0 0 200 200">
                    <path
                      d="M100,40 L110,80 L150,90 L110,100 L100,140 L90,100 L50,90 L90,80 Z"
                      fill="currentColor"
                      opacity="0.05"
                    />
                  </svg>
                </div>

                {/* Icon Container */}
                <div className="activity-icon-container">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="icon-glow"></div>
                </div>

                {/* Content */}
                <div className="activity-content">
                  <h3 className="activity-title">{activity.title}</h3>
                  <p className="activity-description">{activity.description}</p>
                </div>

                {/* Hover Border */}
                <div className="activity-border"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dortoirs Section */}
      <section id="dortoirs" className="dortoirs-section">
        {/* Background Gradient */}
        <div className="dortoirs-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
        </div>

        <div className="container">
          {/* Header */}
          <div className="section-header" data-aos="fade-up">
           
            <h2 className="section-title">Nos dortoirs</h2>
            <p className="section-description">
              Chaque dortoir porte un nom inspiré des valeurs islamiques
            </p>
          </div>

          {/* Dortoirs Container */}
          <div className="dortoirs-container">
            {/* Dortoirs Frères */}
            <div className="dortoirs-category" data-aos="fade-right">
              <div className="category-header">
                <div className="category-icon-wrapper">
                  <span className="category-icon">👨</span>
                </div>
                <div>
                  <h3 className="category-title">Dortoirs Frères</h3>
                  <p className="category-subtitle">6 dortoirs disponibles</p>
                </div>
              </div>

              <div className="dortoirs-grid">
                {dortoirs.freres.map((dortoir, index) => (
                  <div
                    key={index}
                    className="dortoir-card"
                    data-aos="zoom-in"
                    data-aos-delay={index * 50}
                  >
                    {/* Card Header */}
                    <div className="dortoir-header">
                      <span className="dortoir-icon">{dortoir.icon}</span>
                      <div className="dortoir-name">{dortoir.name}</div>
                    </div>

                    {/* Card Body */}
                    <div className="dortoir-body">
                      <div className="dortoir-meaning">{dortoir.meaning}</div>
                      <div className="dortoir-divider"></div>
                      <div className="dortoir-capacity">
                        <span className="capacity-icon">🛏️</span>
                        <span className="capacity-text">30 places</span>
                      </div>
                    </div>

                    {/* Decorative Corner */}
                    <div className="dortoir-corner"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dortoirs Sœurs */}
            <div className="dortoirs-category" data-aos="fade-left">
              <div className="category-header">
                <div className="category-icon-wrapper soeurs">
                  <span className="category-icon">👩</span>
                </div>
                <div>
                  <h3 className="category-title">Dortoirs Sœurs</h3>
                  <p className="category-subtitle">8 dortoirs disponibles</p>
                </div>
              </div>

              <div className="dortoirs-grid">
                {dortoirs.soeurs.map((dortoir, index) => (
                  <div
                    key={index}
                    className="dortoir-card soeurs"
                    data-aos="zoom-in"
                    data-aos-delay={index * 50}
                  >
                    {/* Card Header */}
                    <div className="dortoir-header">
                      <span className="dortoir-icon">{dortoir.icon}</span>
                      <div className="dortoir-name">{dortoir.name}</div>
                    </div>

                    {/* Card Body */}
                    <div className="dortoir-body">
                      <div className="dortoir-meaning">{dortoir.meaning}</div>
                      <div className="dortoir-divider"></div>
                      <div className="dortoir-capacity">
                        <span className="capacity-icon">🛏️</span>
                        <span className="capacity-text">30 places</span>
                      </div>
                    </div>

                    {/* Decorative Corner */}
                    <div className="dortoir-corner"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="dortoirs-note" data-aos="fade-up">
            <div className="note-icon">ℹ️</div>
            <p>Le choix du dortoir se fera lors de l'inscription selon les disponibilités</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProgramSection;