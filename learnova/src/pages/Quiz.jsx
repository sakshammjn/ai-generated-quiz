import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Quiz.css";
import "../index.css";
import { io } from "socket.io-client";

const Quiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions = [] } = location.state || {};

  const [answers, setAnswers] = useState(
    questions.reduce((acc, q) => ({ ...acc, [q.question]: "-1" }), {})
  );
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [timerExpired, setTimerExpired] = useState(false);
  const [status, setStatus] = useState("Not Started");

  // ✅ Start training on page load
  useEffect(() => {
    const startTraining = async () => {
      setStatus("Training Started...");
      try {
        const response = await axios.post("http://127.0.0.1:8080/train");
        setStatus(`Training Completed: ${response.data.message}`);
      } catch (error) {
        console.error("Training error:", error);
        setStatus("Error starting training");
      }
    };
    startTraining();
  }, []);

  // ✅ Redirect if no quiz data
  useEffect(() => {
    if (!location.state || !questions.length) {
      console.error("No quiz data. Redirecting...");
      navigate("/");
    }
  }, [location.state, questions, navigate]);

  // ✅ Timer logic
  useEffect(() => {
    if (timeLeft <= 0 && !timerExpired) {
      setTimerExpired(true);
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, timerExpired]);

  // ✅ Socket listener for gaze detection
  useEffect(() => {
    const socket = io("http://localhost:8080");

    socket.on("look_away", (data) => {
      console.log("👀 Gaze Event:", data.message);
    });

    socket.on("auto_submit", (data) => {
      console.log("⚠️ Auto Submit Triggered:", data.message);
      handleSubmit();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ✅ Submit quiz
  const handleSubmit = async (event) => {
    if (event) event.preventDefault();

    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:8080/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, questions }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }

      const result = await response.json();
      localStorage.setItem("quizResult", JSON.stringify(result));
      navigate("/result");
    } catch (error) {
      console.error("Error submitting results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const isQuestionAnswered = (questionText) => {
    return answers[questionText] !== "-1";
  };

  const getProgressPercentage = () => {
    const answeredCount = Object.values(answers).filter(value => value !== "-1").length;
    return (answeredCount / questions.length) * 100;
  };

  const getTimerColor = () => {
    if (timeLeft > 20) return "#4caf50";
    if (timeLeft > 10) return "#ff9800";
    return "#f44336";
  };

  // ✅ Loading state or missing question
  if (questions.length === 0 || !questions[currentQuestion]) {
    return (
      <div className="quiz-container-modern">
        <div className="quiz-loading">
          <div className="spinner"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="quiz-container-modern">
      <div className="quiz-header">
        <h1>Quiz Challenge</h1>
        <div className="quiz-timer" style={{ borderColor: getTimerColor() }}>
          <svg viewBox="0 0 24 24" className="timer-icon">
            <path fill="currentColor" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
          </svg>
          <span style={{ color: getTimerColor() }}>{timeLeft}s</span>
        </div>
        <div style={{ fontSize: "14px", marginTop: "5px", color: "#888" }}>
          {status}
        </div>
      </div>

      <div className="quiz-progress">
        <div className="quiz-progress-bar">
          <div 
            className="quiz-progress-fill" 
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <div className="quiz-progress-text">
          {Object.values(answers).filter(value => value !== "-1").length} of {questions.length} answered
        </div>
      </div>

      <div className="quiz-navigation-dots">
        {questions.map((_, index) => (
          <button
            key={index}
            className={`nav-dot ${index === currentQuestion ? 'active' : ''} ${isQuestionAnswered(questions[index].question) ? 'answered' : ''}`}
            onClick={() => setCurrentQuestion(index)}
            aria-label={`Go to question ${index + 1}`}
          />
        ))}
      </div>

      <div className="question-card">
        <div className="question-number">Question {currentQuestion + 1} of {questions.length}</div>
        <h2 className="question-text">{question.question}</h2>
        
        {question.youtube_preview && (
          <div className="youtube-preview">
            <iframe 
              src={question.youtube_preview} 
              title="YouTube preview" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        )}

        <div className="options-grid">
          {Object.entries(question.options).map(([key, option]) => (
            <div 
              key={key} 
              className={`option-card ${answers[question.question] === key ? 'selected' : ''}`}
              onClick={() => setAnswers((prev) => ({ ...prev, [question.question]: key }))}
            >
              <div className="option-marker">{key}</div>
              <div className="option-text">{option}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="quiz-actions">
        <button 
          className="nav-button prev" 
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Previous
        </button>
        
        {currentQuestion < questions.length - 1 ? (
          <button 
            className="nav-button next" 
            onClick={handleNext}
          >
            Next
          </button>
        ) : (
          <button 
            className="submit-button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Submitting...
              </>
            ) : "Submit Quiz"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
