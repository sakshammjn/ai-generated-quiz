import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./Dashboard.css";

const Dashboard = () => {
  const [concept, setConcept] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [loading, setLoading] = useState(true);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false);
      if (!user) {
        // Redirect to login page if not authenticated
        navigate("/login");
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, navigate]);

  const startQuiz = async () => {
    const requestData = {
      concept,
      difficulty,
    };

    setGeneratingQuiz(true);

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("http://127.0.0.1:8080/generate_quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken, // Add authentication token
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      navigate("/quiz", { state: { questions: data.questions } });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      setGeneratingQuiz(false);
    }
  };

  const gotohome = () => {
    navigate("/");
  };

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header/Navbar - matched with Home */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo-container">
              <span
                className="logo"
                id="learnova"
                onClick={gotohome}
                style={{ color: "white" }}
              >
                Learnova
              </span>
            </div>
            <nav className="nav">
              <button
                className="nav-button"
                onClick={() => navigate("/profile")}
              >
                Profile
              </button>
              <button
                className="nav-button outlined"
                onClick={() => auth.signOut().then(() => navigate("/"))}
              >
                Log Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-background">
          <div className="background-shape"></div>
        </div>

        <div
          className="dashboard-container"
          style={{ backgroundColor: "#4C4AE4" }}
        >
          <h1 className="dashboard-title" style={{ fontSize: "40px", color: "white" }}>
          Try It. Quiz It. Learn It.
          </h1>
          <p className="dashboard-subtitle">
            {/* Choose exactly what you want to learn and test your knowledge */}
          </p>

          <div className="creative-form-card">
            <div className="form-content">
              <div className="form-group concept-group">
                <label htmlFor="concept-input">
                  What do you want to learn?
                </label>
                <input
                  id="concept-input"
                  type="text"
                  className="concept-input"
                  placeholder="Enter a specific concept (e.g., Newton's Laws of Motion)"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                />
                <p className="input-helper">
                  Be as clear and specific as possible for better results
                </p>
              </div>

              <div className="form-group level-group">
                <label htmlFor="experience-level">Experience Level</label>
                <div className="select-wrapper">
                  <select
                    id="experience-level"
                    className="experience-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy">Beginner</option>
                    <option value="medium">Intermediate</option>
                    <option value="hard">Advanced</option>
                  </select>
                </div>
              </div>

              <button
                className={`generate-quiz-button ${
                  generatingQuiz ? "generating" : ""
                }`}
                onClick={startQuiz}
                disabled={generatingQuiz || !concept.trim()}
              >
                {generatingQuiz ? (
                  <>
                    <span className="generating-text">Generating Quiz</span>
                    <span className="generating-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </span>
                  </>
                ) : (
                  "Generate Quiz"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
