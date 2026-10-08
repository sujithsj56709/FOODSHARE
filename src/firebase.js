import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBUgSmegQOMlog69OKJlQJ0D4hWz79B5C8",
    authDomain: "fooddonationplatform-b05e2.firebaseapp.com",
    databaseURL: "https://fooddonationplatform-b05e2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fooddonationplatform-b05e2",
    storageBucket: "fooddonationplatform-b05e2.firebasestorage.app",
    messagingSenderId: "750761004210",
    appId: "1:750761004210:web:b6996790c56c6fae660dab",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);