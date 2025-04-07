

import React, { useState } from "react";
import { auth, signInWithGoogle, signInWithEmail } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../index.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const result = await signInWithEmail(email, password);
      if (result && result.user) {
        console.log("Login successful:", result.user.email);
        navigate("/dashboard");
      }
    } catch (error) {
      let errorMessage = "Invalid email or password";
      if (error.code === "auth/user-not-found") {
        errorMessage = "User not found. Please check your email or sign up.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      }
      setError(errorMessage);
      console.error("Login Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    
    try {
      const result = await signInWithGoogle();
      if (result && result.user) {
        console.log("Google sign-in successful:", result.user.email);
        navigate("/dashboard");
      } else {
        setError("Google Sign-In failed. Please try again.");
      }
    } catch (error) {
      setError("Google Sign-In error: " + error.message);
      console.error("Google Sign-In Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Login</h2>
        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email:</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password:</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading} style={{ marginTop: '20px' }}>
            {loading ? "Logging in..." : "Login"} 
          </button>
        </form>

        <hr className="divider" />

        <button 
          onClick={handleGoogleSignIn} 
          className="google-button"
          disabled={loading}
        >
          Sign in with Google
        </button>

        <p className="signup-link">
          Don't have an account? <a href="/signup" className="link">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;