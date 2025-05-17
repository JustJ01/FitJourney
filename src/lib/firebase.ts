
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 

const firebaseConfig = {
  apiKey: "AIzaSyA0pvlaizb9DgbZx6zR2BEDhBGFX2HEwOI",
  authDomain: "fitjourney-s9xit.firebaseapp.com",
  projectId: "fitjourney-s9xit",
  storageBucket: "fitjourney-s9xit.firebasestorage.app",
  messagingSenderId: "523797258638",
  appId: "1:523797258638:web:42713218b93898a48bc4df"
};

let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);
const auth = getAuth(app); // auth was already initialized

export { app, db, auth }; // Export auth
