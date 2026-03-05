// ============ FIREBASE CONFIGURATION ============
// This configuration connects both the presentation and the remote to the same Firebase project.

const firebaseConfig = {
    apiKey: "AIzaSyBtMVShH694evkpFk99zNFpxQu4hagu-OA",
    authDomain: "assembly-5c795.firebaseapp.com",
    projectId: "assembly-5c795",
    storageBucket: "assembly-5c795.firebasestorage.app",
    messagingSenderId: "670717013089",
    appId: "1:670717013089:web:8e1535b40e561a71a10e20",
    databaseURL: "https://assembly-5c795-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();
