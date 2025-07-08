import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyChoHjlmmutN7axAOh3T0Egt9j1YHh-dLU",
  authDomain: "curhatinaja.firebaseapp.com",
  projectId: "curhatinaja",
  storageBucket: "curhatinaja.appspot.com",
  messagingSenderId: "1043707546891",
  appId: "1:1043707546891:web:aa32185f629594416ca60e"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);