import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA7exXAriO0ROrrSWj_SS55LOvqqw4kNiQ",
    authDomain: "bebilush-app.firebaseapp.com",
    projectId: "bebilush-app",
    storageBucket: "bebilush-app.firebasestorage.app",
    messagingSenderId: "993395607726",
    appId: "1:993395607726:web:2779af49a4353da91fc53f"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
