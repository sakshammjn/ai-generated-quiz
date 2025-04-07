import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import './Profile.css';

const Profile = () => {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    modules: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        // Get Firebase ID token for secure backend call
        const token = await user.getIdToken();
        fetchUserData(token, user);
      } else {
        setIsLoggedIn(false);
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const fetchUserData = async (token, user) => {
    try {
      setIsLoading(true);

      const res = await fetch("http://127.0.0.1:8080/api/user/concepts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user concepts");
      }

      const modulesData = await res.json();

      const processedModules = modulesData.map((module) => {
        const totalPossibleScore = module.total_concepts * 100;
        const overallAccuracy = totalPossibleScore === 0
          ? 0
          : Math.round((module.total_score / totalPossibleScore) * 100);

        return {
          ...module,
          overallAccuracy
        };
      });

      setUserData({
        firstName: user.displayName?.split(" ")[0] || 'First',
        lastName: user.displayName?.split(" ")[1] || 'Last',
        email: user.email,
        testsCompleted: processedModules.reduce((sum, mod) => sum + mod.total_concepts, 0),
        modulesCompleted: processedModules.length,
        modules: processedModules
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setIsLoading(false);
    }
  };

  const gotoHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return <div className="loading">Loading profile data...</div>;
  }

  return (
    <div className="profile-container">
      {/* Header/Navbar */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo-container">
              <span className="logo" onClick={gotoHome} style={{color:"white", fontSize:"48px"}}>
                Learnova
              </span>
            </div>
            {/* <div className="nav-text">Profile</div> */}
            <nav className="nav">
              <button style={{color:"white"}} className="nav-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
              {/* <button className="nav-link" onClick={() => navigate('/concepts')}>Concepts</button> */}
              <button
                className="nav-button"
                onClick={() => auth.signOut().then(() => navigate('/'))}
              >
                Log Out
              </button>
            </nav>
            <button className="menu-button">
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="profile-content">
        {/* User Info Card */}
        <div className="profile-card">
          <div className="user-info">
            <div className="user-avatar">
              {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
            </div>
            <div className="user-details">
              <h1>{userData.firstName} {userData.lastName}</h1>
              <p>{userData.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stats-card">
            <div className="stats-number">{userData.testsCompleted}</div>
            <div className="stats-label">Tests Completed</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">{userData.modulesCompleted}</div>
            <div className="stats-label">Modules Completed</div>
          </div>
        </div>

        {/* Module Section */}
        <div className="module-section">
          <div className="section-header">
            <div className="section-title">Auto Grouped Module</div>
          </div>

          <div className="modules-list">
            {userData.modules.map((module, index) => (
              <div key={index} className="module-item">
                <div className="module-header">
                  <div className="module-name">{module.subject}</div>
                  <div className="module-accuracy">Overall Accuracy: {module.overallAccuracy}%</div>
                </div>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${module.overallAccuracy}%` }}
                    ></div>
                  </div>
                </div>
                <div className="module-concepts">
                  {module.concepts.map((concept, cIndex) => (
                    <div className="concept-item" key={cIndex}>
                      <span className="concept-name">{concept.concept}</span>
                      <span className="concept-score">{concept.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
