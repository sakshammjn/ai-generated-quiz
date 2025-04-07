// import { initializeApp } from "firebase/app";
// import {
//   getAuth,
//   GoogleAuthProvider,
//   signInWithPopup,
// } from "firebase/auth";
// import {
//   getFirestore,
//   doc,
//   setDoc,
//   getDoc
// } from "firebase/firestore";

// // Load Firebase config from .env
// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);
// const provider = new GoogleAuthProvider();

// // ✅ Google Sign-In with Popup (Returns User)
// const signInWithGoogle = async () => {
//   try {
//     const result = await signInWithPopup(auth, provider);
//     const token = await result.user.getIdToken();
//     return { token, user: result.user };
//   } catch (error) {
//     console.error("Google Sign-In Error", error);
//     return null;
//   }
// };

// export { auth, db, provider, signInWithGoogle };








// firebase.js


import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";

// Load Firebase config from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Google Sign-In with Popup
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    return { token, user: result.user };
  } catch (error) {
    console.error("Google Sign-In Error", error);
    return null;
  }
};

// Email/Password Sign Up
const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    return { token, user: userCredential.user };
  } catch (error) {
    console.error("Email Sign-Up Error", error);
    throw error;
  }
};

// Email/Password Sign In
const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    return { token, user: userCredential.user };
  } catch (error) {
    console.error("Email Sign-In Error", error);
    throw error;
  }
};

export { 
  auth, 
  db, 
  provider, 
  signInWithGoogle, 
  signUpWithEmail, 
  signInWithEmail 
};