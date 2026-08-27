import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCZBbL8-vJyDA5R9bZnYPSfibQSemCMAys",
  authDomain: "ini-bot.firebaseapp.com",
  projectId: "ini-bot",
  storageBucket: "ini-bot.firebasestorage.app",
  messagingSenderId: "292770020238",
  appId: "1:292770020238:web:6c625c352cf5387c0082df",
  measurementId: "G-V3SE727XH0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);