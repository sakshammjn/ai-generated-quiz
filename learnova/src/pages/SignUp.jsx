

import React, { useState } from "react";
import { signInWithGoogle, signUpWithEmail } from "../firebase";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../index.css";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!firstName.trim()) {
      setError("First name is required");
      return false;
    }
    if (!lastName.trim()) {
      setError("Last name is required");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Step 1: Create Firebase Auth account
      const result = await signUpWithEmail(email, password);
      
      if (result && result.user) {
        try {
          // Step 2: Send data to Flask backend
          const response = await axios.post("http://127.0.0.1:8080/api/auth/signup", {
            email: result.user.email,
            uid: result.user.uid,
            token: result.token,
            firstName: firstName,
            lastName: lastName,
            displayName: `${firstName} ${lastName}`
          });
          
          console.log("Server Response:", response.data);
          // Step 3: Show success message and redirect
          alert("Sign Up Successful! Please log in with your credentials.");
          navigate("/login");
          
        } catch (backendError) {
          // Handle backend communication error
          console.error("Backend Error:", backendError);
          
          // Still consider signup successful since Firebase account was created
          alert("Account created, but there was an issue connecting to the server. You can still log in.");
          navigate("/login");
        }
      }
    } catch (firebaseError) {
      // Handle Firebase Auth errors
      let errorMessage = "Error during sign-up";
      
      if (firebaseError.code === "auth/email-already-in-use") {
        errorMessage = "Email is already registered. Please log in instead.";
      } else if (firebaseError.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      } else if (firebaseError.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please use at least 6 characters.";
      } else {
        errorMessage = `Signup error: ${firebaseError.message}`;
      }
      
      setError(errorMessage);
      console.error("Firebase Error:", firebaseError);
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
        try {
          // For Google sign-in, we'll use the display name provided by Google
          const response = await axios.post("http://127.0.0.1:8080/api/auth/google", {
            token: result.token,
            email: result.user.email,
            displayName: result.user.displayName || "Google User",
            firstName: result.user.displayName ? result.user.displayName.split(' ')[0] : "",
            lastName: result.user.displayName ? 
              result.user.displayName.split(' ').slice(1).join(' ') : ""
          });
          
          console.log("Server Response:", response.data);
          navigate("/dashboard");
        } catch (backendError) {
          console.error("Backend Error:", backendError);
          // If backend fails but Google auth succeeded, go to dashboard anyway
          alert("Google Sign-In successful, but there was an issue connecting to the server.");
          navigate("/dashboard");
        }
      } else {
        setError("Google Sign-Up failed. Please try again.");
      }
    } catch (googleError) {
      setError("Google Sign-Up error: " + googleError.message);
      console.error("Google Sign-Up Error:", googleError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2 className="signup-title">Sign Up</h2>
        
        {error && <p className="signup-error">{error}</p>}

        {/* Email & Password Sign-Up */}
        <form onSubmit={handleEmailSignUp} className="flex flex-col space-y-4">
          <div className="name-fields flex space-x-2">
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="signup-input"
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="signup-input"
              disabled={loading}
            />
          </div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="signup-input"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="signup-input"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="signup-input"
            disabled={loading}
          />
          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="signup-divider">or</div>

        {/* Google Sign-In */}
        <button 
          className="google-signup" 
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          Sign Up with Google
        </button>
        
        <p className="login-link">
          Already have an account? <a href="/login" className="link">Log in</a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;