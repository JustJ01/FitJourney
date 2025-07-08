
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyAD0Tp0us-6qc22w5cVaLjHeMiiNuVQLy4",
  authDomain: "fitjourney-1a7fd.firebaseapp.com",
  projectId: "fitjourney-1a7fd",
  storageBucket: "fitjourney-1a7fd.firebasestorage.app",
  messagingSenderId: "1055137463993",
  appId: "1:1055137463993:web:c32e4c034ff68bb2d1e568",
  measurementId: "G-JSZKM9MXRM"
};

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics; 

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);
const auth = getAuth(app);
storage = getStorage(app);

if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}


export { app, db, auth, storage, analytics };
