

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase project configuration
const firebaseConfig = {
  // Paste the six configuration values copied from Firebase here
  // Keep the property names exactly as shown in Firebase.
  apiKey: "AIzaSyD99I7u0G8aIqNYEMBY803jlRpa2kEPJCY",
  authDomain: "gym-management-app-e6de0.firebaseapp.com",
  projectId: "gym-management-app-e6de0",
  storageBucket: "gym-management-app-e6de0.firebasestorage.app",
  messagingSenderId: "657019611930",
  appId: "1:657019611930:web:d16e91c06aeeeb5ff45aa3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Database
export const db = getFirestore(app);