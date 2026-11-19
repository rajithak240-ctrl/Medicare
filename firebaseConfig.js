// Import the functions you need from the SDKs you need
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUUzH4k4xwbxKpc2meaPiH8nGbuj2G9jo",
  authDomain: "medicare-abeaf.firebaseapp.com",
  projectId: "medicare-abeaf",
  storageBucket: "medicare-abeaf.firebasestorage.app",
  messagingSenderId: "429276484705",
  appId: "1:429276484705:web:2627e7fb42bf069b988620"
};

// Initialize Firebase
//const app = initializeApp(firebaseConfig);

const app = getApps().length ? getApp(): initializeApp(firebaseConfig);
let auth;
try{
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage)});
} catch (e) {
    auth = getAuth(app);
}
const db = getFirestore(app);
export { auth, db };

