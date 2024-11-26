// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAaK_2739wqm928C0f7rIq5-6zdLmO2-b8",
    authDomain: "reacttest-26675.firebaseapp.com",
    projectId: "reacttest-26675",
    storageBucket: "reacttest-26675.appspot.com",
    messagingSenderId: "583761591180",
    appId: "1:583761591180:android:85b54aa16a808792e834a9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };