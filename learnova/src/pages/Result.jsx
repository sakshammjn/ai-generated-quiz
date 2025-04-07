import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./Result.css";
import "../index.css";

const Result = () => {
  const [score, setScore] = useState(null);
  const [total, setTotal] = useState(null);
  const [links, setLinks] = useState([]);
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const storedResult = JSON.parse(localStorage.getItem("quizResult"));
      if (storedResult) {
        setScore(storedResult.score);
        setTotal(storedResult.total);
        setIncorrectQuestions(storedResult.incorrectQuestions || []);
        setLinks(storedResult.Links || []);
      } else {
        navigate("/");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, auth]);

  const startQuiz = async (youtubeUrl) => {
    const videoIdMatch =
      youtubeUrl.match(/[?&]v=([^&]+)/) ||
      youtubeUrl.match(/youtu\.be\/([^?]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      console.error("Invalid YouTube URL");
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("http://127.0.0.1:8080/yt_quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken,
        },
        body: JSON.stringify({ video_id: videoId }),
      });

      const data = await response.json();
      if (data.questions) {
        navigate("/quiz", { state: { questions: data.questions } });
      } else {
        console.error("Failed to fetch quiz questions");
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
    }
  };

  if (loading) {
    return (
      <div className="result-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your results...</p>
        </div>
      </div>
    );
  }

  const percentage =
    score !== null && total !== null ? Math.round((score / total) * 100) : 0;

  return (
    <div className="result-container">
      <div className="result-card">
        <div className="result-header">
        <h1 className="result-title" style={{ color: 'white' }}>Quiz Results</h1>
          <div className="score-display">
            {score !== null && total !== null ? (
              <div className="score-pill">
                <span className="score-value">
                  {score}/{total}
                </span>
                <span className="score-percent">{percentage}% Correct</span>
              </div>
            ) : (
              <div className="error-text">
                No result found. Please take a quiz first.
              </div>
            )}
          </div>
        </div>

        <div className="result-content">
          {incorrectQuestions.length > 0 && (
            <div className="section">
              <h2 className="section-title">Areas to Review</h2>
              <ul className="incorrect-list">
                {incorrectQuestions.map((q, index) => (
                  <li key={index} className="incorrect-item">
                    <p className="question-text">{q.question}</p>
                    <div className="answer-container">
                      <div className="user-answer">
                        <span className="answer-label wrong">Your Answer</span>
                        <span className="answer-text">
                          {q.userAnswer || "Not Answered"}
                        </span>
                      </div>
                      <div className="correct-answer">
                        <span className="answer-label correct">
                          Correct Answer
                        </span>
                        <span className="answer-text">{q.correctAnswer}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {links.length > 0 && (
            <div className="section">
              <h2 className="section-title">Recommended Videos</h2>
              <div className="videos-container">
                {links.map((link, index) => {
                  const videoId = link.match(
                    /(?:\?v=|\/embed\/|\.be\/)([^&?/]+)/
                  )?.[1];

                  return (
                    <div key={index} className="video-row">
                      <div className="video-preview">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={`YouTube Video ${index + 1}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="video-action">
                        <button
                          className="take-quiz-button"
                          onClick={() => startQuiz(link)}
                        >
                          Take Quiz
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="nav-buttons">
            <button
              className="nav-button"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
            <button
              className="nav-button"
              onClick={() => navigate("/profile")}
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
