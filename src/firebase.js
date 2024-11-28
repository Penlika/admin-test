// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAaK_2739wqm928C0f7rIq5-6zdLmO2-b8',
  authDomain: 'reacttest-26675.firebaseapp.com',
  projectId: 'reacttest-26675',
  storageBucket: 'reacttest-26675.appspot.com',
  messagingSenderId: '583761591180',
  appId: '1:583761591180:android:85b54aa16a808792e834a9',
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export Firebase services
export { auth, db, storage, createUserWithEmailAndPassword };
