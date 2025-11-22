// src/components/Landing/Hero.jsx
import React, { useEffect, useState } from "react";
import afficheOfficiel from "../../images/An nour.jpg";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

const Hero = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // ✅ État pour le compte à rebours
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  // ✅ Effet pour le mouvement de la souris
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20,
        y: (e.clientY / window.innerHeight) * 20,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // ✅ Effet pour le compte à rebours
  useEffect(() => {
    const calculateTimeLeft = () => {
      // Date cible : 20 décembre 2025 à 14h00 (heure locale Côte d'Ivoire - GMT)
      const targetDate = new Date('2025-12-20T14:00:00').getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isExpired: false
      };
    };

    // Mise à jour initiale
    setCountdown(calculateTimeLeft());

    // Mise à jour toutes les secondes
    const timer = setInterval(() => {
      setCountdown(calculateTimeLeft());
    }, 1000);

    // Nettoyage
    return () => clearInterval(timer);
  }, []);

  // ✅ Fonction pour formater les nombres avec zéro devant
  const formatNumber = (num) => {
    return num.toString().padStart(2, '0');
  };

  return (
    <section id="accueil" className="hero">
      {/* Animated Background */}
      <div className="hero-background">
        {/* Gradient Layers */}
        <div className="gradient-layer gradient-1"></div>
        <div className="gradient-layer gradient-2"></div>

        {/* Geometric Islamic Patterns */}
        <div className="pattern-container">
          <svg
            className="pattern-svg"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id="islamic-pattern"
                x="0"
                y="0"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <g className="pattern-group">
                  <path
                    d="M50,30 L55,45 L70,50 L55,55 L50,70 L45,55 L30,50 L45,45 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                  <path
                    d="M35,25 L65,25 L75,35 L75,65 L65,75 L35,75 L25,65 L25,35 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    opacity="0.2"
                  />
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
          </svg>
        </div>

        {/* Floating Particles */}
        <div className="particles">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        {/* Animated Shapes */}
        <div className="floating-shapes">
          <div
            className="shape shape-1"
            style={{
              transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            }}
          >
            <svg viewBox="0 0 200 200">
              <path
                d="M100,20 L120,60 L165,75 L120,90 L100,130 L80,90 L35,75 L80,60 Z"
                fill="currentColor"
                opacity="0.1"
              />
            </svg>
          </div>
          <div
            className="shape shape-2"
            style={{
              transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
            }}
          >
            <svg viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.2"
              />
              <circle
                cx="100"
                cy="100"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="hero-content">
        <div className="container">
          <div className="content-wrapper">
            {/* Left Content */}
            <div className="hero-text">
              {/* Badge with Animation */}
              <div className="hero-badge" data-aos="fade-down">
                <span className="badge-icon">✨</span>
                <span className="badge-text">
                  7ème Édition - Excellence en Éducation Islamique
                </span>
                <div className="badge-shine"></div>
              </div>

              {/* Main Title */}
              <h1 className="hero-title" data-aos="fade-up" data-aos-delay="100">
                SÉMINAIRE DE FORMATION
                <span className="title-highlight">
                  <span className="title-text">
                    <span style={{ fontSize: "1.5em", verticalAlign: "sub", margin: "0 0.2rem" }}>
                      Islamique
                    </span>
                    <span style={{ fontSize: ".5em", verticalAlign: "sub", margin: "0 0.2rem" }}>
                      &
                    </span>
                    Managerial
                  </span>
                  <svg className="title-underline" viewBox="0 0 400 20">
                    <path
                      d="M0,10 Q100,0 200,10 T400,10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Subtitle */}
    

              {/* Theme Box */}
              <div className="hero-theme-box" data-aos="fade-up" data-aos-delay="250">
                <div className="theme-header">
                  <span className="theme-badge">THÈME 2025</span>
                </div>
                <h3 className="theme-title">
                  AEEMCI : Cinquante ans d'engagement citoyen et islamique
                </h3>
                <p className="theme-subtitle">
                  Pour une jeunesse responsable et actrice de paix en Côte d'Ivoire
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="hero-cta" data-aos="fade-up" data-aos-delay="300">
                <button className="btn btn-primary" onClick={() => navigate("/inscription")}>
                  <span>Inscription</span>
                  <svg className="btn-arrow" width="20" height="20" viewBox="0 0 20 20">
                    <path d="M10 3L9 4L14 9H3v2h11l-5 5 1 1 7-7-7-7z" fill="currentColor" />
                  </svg>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    document.getElementById("programme")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <span>Découvrir le programme</span>
                </button>
              </div>

              {/* ✅ Compte à rebours dynamique */}
              <div className="hero-countdown" data-aos="fade-up" data-aos-delay="400">
                {countdown.isExpired ? (
                  <div className="countdown-expired">
                    <span className="expired-icon">🎉</span>
                    <span className="expired-text">Le séminaire a commencé !</span>
                  </div>
                ) : (
                  <>
                    <div className="countdown-item">
                      <div className="countdown-number">{formatNumber(countdown.days)}</div>
                      <div className="countdown-label">Jours</div>
                    </div>
                    <div className="countdown-separator">:</div>
                    <div className="countdown-item">
                      <div className="countdown-number">{formatNumber(countdown.hours)}</div>
                      <div className="countdown-label">Heures</div>
                    </div>
                    <div className="countdown-separator">:</div>
                    <div className="countdown-item">
                      <div className="countdown-number">{formatNumber(countdown.minutes)}</div>
                      <div className="countdown-label">Minutes</div>
                    </div>
                    <div className="countdown-separator">:</div>
                    <div className="countdown-item">
                      <div className="countdown-number">{formatNumber(countdown.seconds)}</div>
                      <div className="countdown-label">Secondes</div>
                    </div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="hero-stats" data-aos="fade-up" data-aos-delay="500">
                <div className="stat-item">
                  <div className="stat-number">6</div>
                  <div className="stat-label">Jours intensifs</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <div className="stat-number">7000</div>
                  <div className="stat-label">FCFA par personne</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <div className="stat-number">20-25</div>
                  <div className="stat-label">Décembre 2025</div>
                </div>
              </div>
            </div>

            {/* Right Content - Visual Card */}
            <div className="hero-visual" data-aos="fade-left" data-aos-delay="200">
              <div className="visual-card">
                <div className="card-image-container">
                  <img src={afficheOfficiel} alt="Séminaire An-Nour" className="card-image" />
                  <div className="card-image-overlay"></div>
                </div>

                <div className="card-glow"></div>

                <div className="card-pattern">
                  <svg viewBox="0 0 400 400">
                    <g className="pattern-animate">
                      <path
                        d="M200,100 L220,160 L280,180 L220,200 L200,260 L180,200 L120,180 L180,160 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        opacity="0.3"
                      />
                      <circle
                        cx="200"
                        cy="180"
                        r="100"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        opacity="0.2"
                        strokeDasharray="10 5"
                      />
                    </g>
                  </svg>
                </div>

                <div className="card-content">
                  <div className="brand-icon">
                    <svg viewBox="0 0 100 100" className="icon-svg">
                      <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.2" />
                      <text
                        x="50"
                        y="65"
                        fontSize="35"
                        fill="currentColor"
                        textAnchor="middle"
                        fontWeight="bold"
                        fontFamily="serif"
                      >
                        النور
                      </text>
                    </svg>
                  </div>
                </div>

                <div className="card-float float-1">
                  <div className="float-content">
                    <span className="float-icon">📖</span>
                    <span className="float-text">Formation Islamique</span>
                  </div>
                </div>
                <div className="card-float float-2">
                  <div className="float-content">
                    <span className="float-icon">🎓</span>
                    <span className="float-text">Certificat de participation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator" data-aos="fade-up" data-aos-delay="600">
        <div className="scroll-mouse">
          <div className="scroll-wheel"></div>
        </div>
        <span className="scroll-text">Défiler pour explorer</span>
      </div>
    </section>
  );
};

export default Hero;
