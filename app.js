// Your Firebase config — replace with your actual keys
const firebaseConfig = {
  apiKey: "AIzaSyASXVNfQLyfjdi-9svf2vD_PaEHiUzWLZI",
  authDomain: "cryptoswap-eb9b8.firebaseapp.com",
  projectId: "cryptoswap-eb9b8",
  storageBucket: "cryptoswap-eb9b8.firebasestorage.app",
  messagingSenderId: "914803395308",
  appId: "1:914803395308:web:315211b2a97665296c73c9",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---- UI HELPERS ----
function showRegister() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
}

function showLogin() {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
}

// ---- AUTH ----
function register() {
  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const phone = document.getElementById("reg-phone").value;

  auth
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      // Save extra info to Firestore
      return db.collection("users").doc(user.uid).set({
        name: name,
        email: email,
        phone: phone,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    })
    .then(() => {
      alert("Account created successfully!");
    })
    .catch((error) => {
      alert(error.message);
    });
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password).catch((error) => {
    alert(error.message);
  });
}

function logout() {
  auth.signOut();
}

// ---- AUTH STATE LISTENER ----
// This runs automatically whenever login state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is logged in — show dashboard
    document.getElementById("auth-screen").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
  } else {
    // User is logged out — show auth screen
    document.getElementById("auth-screen").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
  }
});

// ---- NAVIGATION (coming soon) ----
function showBuy() {
  alert("Buy flow coming next!");
}

function showSell() {
  alert("Sell flow coming next!");
}
