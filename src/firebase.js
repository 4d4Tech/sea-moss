// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHfQ0mZDOXrBhjIX1u6gF-Pd7iRfnU3N8",
    authDomain: "sea-moss-a798e.firebaseapp.com",
    projectId: "sea-moss-a798e",
    storageBucket: "sea-moss-a798e.firebasestorage.app",
    messagingSenderId: "748650100577",
    appId: "1:748650100577:web:356a0bd06fd3230b80b720",
    measurementId: "G-J0V6CTPYC2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { app, analytics, auth, db, storage, functions };
