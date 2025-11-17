// ...existing code...
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "../components/Landing/Hero";
import ProgramSection from "../components/Landing/ProgramSection";
import PricingSection from "../components/Landing/PricingSection";
import FAQs from "../components/Landing/FAQ";
import logoAnnour from "../images/ANNOUR LOGO.PNG";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="navbar-container">
          {/* Logo avec icône islamique */}
          <div className="navbar-logo" onClick={() => navigate("/")}>
            <div className="logo-image-wrapper">
              <img src={logoAnnour} alt="An-Nour Logo" className="logo-image" />
            </div>
            <div className="logo-text-container">
              <span className="logo-text">AN-NOUR</span>
              <span className="logo-version">7.0</span>
            </div>
          </div>

          {/* Menu Toggle */}
          <button
            className={`menu-toggle ${isMenuOpen ? "active" : ""}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Menu Navigation */}
          <ul className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
            <li>
              <a
                onClick={() => scrollToSection("accueil")}
                className="nav-link"
              >
                <span className="nav-text">Accueil</span>
                <span className="nav-indicator"></span>
              </a>
            </li>
            <li>
              <a
                onClick={() => scrollToSection("programme")}
                className="nav-link"
              >
                <span className="nav-text">Programme</span>
                <span className="nav-indicator"></span>
              </a>
            </li>
            <li>
              <a onClick={() => scrollToSection("tarif")} className="nav-link">
                <span className="nav-text">Tarif</span>
                <span className="nav-indicator"></span>
              </a>
            </li>
            <li>
              <a onClick={() => scrollToSection("faq")} className="nav-link">
                <span className="nav-text">FAQ</span>
                <span className="nav-indicator"></span>
              </a>
            </li>
            <li>
              <button
                className="btn-inscription"
                onClick={() => navigate("/inscription")}
              >
                <span>S'inscrire</span>
                <svg
                  className="btn-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M10 3L9 4L14 9H3v2h11l-5 5 1 1 7-7-7-7z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </li>
          </ul>
        </div>

        {/* Ligne décorative dorée */}
        <div className="navbar-border"></div>
      </nav>

      {/* Sections */}
      <Hero />
      <ProgramSection />
      <PricingSection />
      <FAQs />

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              {/* Logo dans le footer aussi */}
              <div className="footer-logo">
                <img
                  src={logoAnnour}
                  alt="An-Nour"
                  className="footer-logo-image"
                />
              </div>
              <h3 className="footer-title">AN-NOUR 7.0</h3>
              <p className="footer-description">
                Pour une spiritualité étincelante...
              </p>
              <div className="footer-organizer">
                <p>
                  <strong>AEEMCI</strong>
                </p>
                <p>SERAE</p>
                <p style={{fontFamily:"monospace",fontSize:"1.2em"}}>Sous-comité Cocody I & Sous-comité Bingerville</p>
              </div>
            </div>

            <div className="footer-section">
              <h4 className="footer-subtitle">Contact</h4>
              <ul className="footer-links">
                <li>📞 05 45 84 41 35</li>
                <li>📞 01 42 08 05 37</li>
                <li>📍 Lycée Moderne Cocody Angré</li>
                <li>📅 20 - 25 Décembre 2025</li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-subtitle">Liens rapides</h4>
              <ul className="footer-links">
                <li>
                  <a onClick={() => scrollToSection("accueil")}>Accueil</a>
                </li>
                <li>
                  <a onClick={() => scrollToSection("programme")}>Programme</a>
                </li>
                <li>
                  <a onClick={() => scrollToSection("tarif")}>Tarif</a>
                </li>
                <li>
                  <a onClick={() => scrollToSection("faq")}>FAQ</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; AN NOUR 2025 - 7eme edition | (c) 2025 Tous droits réservés
            </p>
            <span style={{fontStyle:"italic"}}>
              Pour une spiritualite etincelante...
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
// ...existing code...
