import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import './Home.css'; // Import the new CSS file

const Home = () => {
  const howItWorksRef = useRef(null);
  const conceptsRef = useRef(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToConcepts = () => {
    conceptsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartTest = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleConceptSelect = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  function gotohome(){
    navigate ('/');
  }
  return (
    <div className="app-container">
      {/* Header/Navbar */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo-container">
            <span className="logo" style={{color: 'white', fontSize: '3rem', fontWeight: 'bold', cursor: 'pointer' } } onClick={gotohome}>
  Learnova
</span>

            </div>
            <nav className="nav">
            <button className="nav-link" onClick={scrollToHowItWorks} style={{ color: 'white', backgroundColor: '#4E47E5' }}>
  How It Works
</button>

<button className="nav-link" onClick={scrollToConcepts} style={{ color: 'white', backgroundColor: '#4E47E5' }}>
  Concepts
</button>

              {isLoggedIn ? (
                <>
                  <Link to="/profile">
                    <button className="nav-button">Profile</button>
                  </Link>
                  <button 
                    className="nav-button"
                    onClick={() => auth.signOut().then(() => navigate('/'))}
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <Link to="/login">
                  <button className="nav-button">LogIn</button>
                </Link>
              )}
            </nav>
            <button className="menu-button">
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-shape"></div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text animate-fade-in">
              <h1 className="hero-title">
                <span className="block">Master Concepts,</span>
                <span className="highlight">Not Subjects</span>
              </h1>
              <p className="hero-description">
                Learn exactly what you need with our AI-powered adaptive learning system. Take focused tests, get personalized explanations, and build your knowledge efficiently.
              </p>
              <div className="hero-buttons">
                <button 
                  className="primary-button hover-scale"
                  onClick={handleConceptSelect}
                >
                  Select a Concept
                </button>
                {!isLoggedIn && (
                  <Link to="/signup">
                    <button className="secondary-button hover-scale">Sign Up Free</button>
                  </Link>
                )}
              </div>
            </div>
            <div className="hero-card">
              <div className="card-gradient hover-scale">
                <div className="card-content">
                  <div className="card-header">
                    <h3 className="card-title">Quantum Mechanics</h3>
                    <span className="card-tag">Physics</span>
                  </div>
                  <div className="card-body">
                    <div className="card-info">
                      <span>Select your concept</span>
                      <span className="highlight">15-20 questions</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill"></div>
                    </div>
                    <div className="card-details">
                      <span><i className="fas fa-clock"></i> 15 min</span>
                      <span><i className="fas fa-eye eye-icon"></i> Anti-cheat enabled</span>
                    </div>
                  </div>
                  <button className="card-button" onClick={handleStartTest}>Start Test</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="how-it-works-section" ref={howItWorksRef}>
        <div className="section-container">
          <h2 className="section-subtitle">How It Works</h2>
          <p className="section-title">Learn Smarter, One Concept at a Time</p>
          <div className="how-it-works-grid">
            {[
              { icon: "fa-crosshairs", title: "Select a Concept", desc: "Choose exactly what you want to learn from our extensive concept library." },
              { icon: "fa-tasks", title: "Take a Test", desc: "Complete dynamic tests with 15-20 questions designed to assess your knowledge." },
              { icon: "fa-lightbulb", title: "Get Personalized Help", desc: "Receive targeted explanations or video recommendations based on your performance." },
              { icon: "fa-chart-line", title: "Track Progress", desc: "Watch as your mastered concepts automatically group into subject modules." }
            ].map((item, index) => (
              <div key={index} className="feature-card hover-scale animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="feature-icon">
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <h3 className="feature-title">{item.title}</h3>
                <p className="feature-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Concepts Section */}
      <div className="concepts-section" ref={conceptsRef}>
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-subtitle">Popular Concepts</h2>
            <p className="section-title">Start Learning Today</p>
          </div>
          <div className="concepts-grid">
            {[
              { color: "#4f46e5", title: "Photosynthesis", tag: "Biology", tagColor: "#d1fae5", tagText: "#047857", desc: "Understand how plants convert light energy into chemical energy.", time: "15 min test" },
              { color: "#0891b2", title: "Quadratic Equations", tag: "Mathematics", tagColor: "#cffafe", tagText: "#0e7490", desc: "Master solving and graphing quadratic equations efficiently.", time: "20 min test" },
              { color: "#9333ea", title: "Neural Networks", tag: "Computer Science", tagColor: "#f3e8ff", tagText: "#7e22ce", desc: "Learn the fundamentals of neural networks and deep learning.", time: "15 min test" }
            ].map((concept, index) => (
              <div key={index} className="concept-card">
                <div className="concept-bar" style={{ backgroundColor: concept.color }}></div>
                <div className="concept-content">
                  <div className="concept-header">
                    <h3 className="concept-title">{concept.title}</h3>
                    <span className="concept-tag" style={{ backgroundColor: concept.tagColor, color: concept.tagText }}>{concept.tag}</span>
                  </div>
                  <p className="concept-desc">{concept.desc}</p>
                  <div className="concept-footer">
                    <span className="concept-time">{concept.time}</span>
                    <button className="concept-button" onClick={handleStartTest}>Start</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rest of the code remains unchanged */}
      {/* Features Section */}
      <div className="features-section">
        <div className="section-container">
          <div className="features-content">
            <div className="features-text">
              <h2 className="features-title">
                <span className="block">Adaptive Learning</span>
                <span className="highlight">That Grows With You</span>
              </h2>
              <p className="features-desc">
                Our AI-powered system adapts to your learning style and pace, creating a personalized education experience.
              </p>
              <div className="features-list">
                {[
                  { icon: "fa-brain", title: "AI-Powered Tests", desc: "Dynamic tests adapt to your knowledge level, targeting exactly what you need to learn." },
                  { icon: "fa-eye", title: "Anti-Cheating Technology", desc: "Eye-tracking and visibility detection ensure fair testing and accurate assessment." },
                  { icon: "fa-video", title: "Smart Recommendations", desc: "Receive targeted explanations or video recommendations based on your performance." }
                ].map((feature, index) => (
                  <div key={index} className="feature-item">
                    <div className="feature-icon">
                      <i className={`fas ${feature.icon}`}></i>
                    </div>
                    <div className="feature-text">
                      <h3 className="feature-title">{feature.title}</h3>
                      <p className="feature-desc">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="progress-card">
              <div className="progress-content">
                <div className="progress-header">
                  <div className="progress-icon">
                    <i className="fas fa-chart-pie"></i>
                  </div>
                  <h3 className="progress-title">Your Progress</h3>
                </div>
                <div className="progress-bars">
                  {[
                    { module: "Physics Module", percent: "75%" },
                    { module: "Mathematics Module", percent: "60%" },
                    { module: "Biology Module", percent: "45%" }
                  ].map((progress, index) => (
                    <div key={index} className="progress-item">
                      <div className="progress-label">
                        <span>{progress.module}</span>
                        <span>{progress.percent} Complete</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: progress.percent }}></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="recently-mastered">
                  <h4 className="recent-title">Recently Mastered Concepts</h4>
                  <div className="recent-list">
                    <div className="recent-item">
                      <span className="recent-concept">
                        <i className="fas fa-check-circle"></i>
                        Photosynthesis
                      </span>
                      <span className="recent-time">2 days ago</span>
                    </div>
                    <div className="recent-item">
                      <span className="recent-concept">
                        <i className="fas fa-check-circle"></i>
                        Kinetic Energy
                      </span>
                      <span className="recent-time">4 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="testimonials-section">
        <div className="section-container">
          <h2 className="testimonials-title">What Students Say</h2>
          <p className="testimonials-desc">Join thousands of learners who have transformed their education.</p>
          <div className="testimonials-grid">
            {[
              { initial: "A", name: "Raj K.", role: "Computer Science Student", quote: "Learnova helped me understand algorithms in days rather than weeks. The targeted tests identified exactly what I was struggling with.", rating: 5 },
              { initial: "P", name: "Priya M.", role: "High School Student", quote: "I struggled with chemistry for years. The video recommendations and explanations finally made complex concepts click for me.", rating: 4.5 },
              { initial: "J", name: "Prem D.", role: "Medical Student", quote: "The concept-based approach is revolutionary. I've mastered anatomy topics in half the time it would have taken with traditional methods.", rating: 5 }
            ].map((testimonial, index) => (
              <div key={index} className="testimonial-card hover-scale">
                <div className="testimonial-header">
                  <div className="testimonial-avatar">{testimonial.initial}</div>
                  <div className="testimonial-info">
                    <h4 className="testimonial-name">{testimonial.name}</h4>
                    <p className="testimonial-role">{testimonial.role}</p>
                  </div>
                </div>
                <p className="testimonial-quote">{testimonial.quote}</p>
                <div className="testimonial-rating">
                  {Array(Math.floor(testimonial.rating)).fill().map((_, i) => <i key={i} className="fas fa-star"></i>)}
                  {testimonial.rating % 1 !== 0 && <i className="fas fa-star-half-alt"></i>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="section-container">
          <h2 className="cta-title">
            <span className="block">Ready to Master Concepts?</span>
            <span className="cta-highlight">Start Your Learning Journey Today</span>
          </h2>
          <div className="cta-buttons">
            {!isLoggedIn ? (
              <Link to="/signup">
                <button className="cta-primary-button hover-scale">Sign Up Free</button>
              </Link>
            ) : null}
            <button 
              className="cta-secondary-button hover-scale" 
              onClick={handleConceptSelect}
            >
              Select a Concept
            </button>
          </div>
        </div>
      </div>

      {/* Footer - UPDATED */}
      <footer className="footer">
        <div className="footer-container">
          <p className="copyright-text">© 2025 Learnova. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;