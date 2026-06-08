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

// ---- STATE ----
let buyOrder = { crypto: "", network: "", amount: "", payment: "" };
let sellOrder = {
  crypto: "",
  network: "",
  amount: "",
  payment: "",
  account: "",
};

// Your wallet addresses (edit these to your real addresses)
const walletAddresses = {
  "USDT-TRC20": "TYourUSDTTRC20AddressHere",
  "USDT-ERC20": "0xYourUSDTERC20AddressHere",
  "USDT-BEP20": "0xYourUSDTBEP20AddressHere",
  "BTC-TRC20": "YourBTCAddressHere",
  "BTC-ERC20": "YourBTCAddressHere",
  "BTC-BEP20": "YourBTCAddressHere",
  "ETH-ERC20": "0xYourETHAddressHere",
  "ETH-BEP20": "0xYourETHAddressHere",
};

// ---- UI NAVIGATION ----
function showSection(sectionId) {
  // Hide all sections first
  document
    .querySelectorAll(".section")
    .forEach((s) => (s.style.display = "none"));
  // Show the chosen one
  document.getElementById(sectionId).style.display = "block";
  // Reset steps
  if (sectionId === "buy-section") resetBuySteps();
  if (sectionId === "sell-section") resetSellSteps();
}

function resetBuySteps() {
  buyOrder = { crypto: "", network: "", amount: "", payment: "" };
  document.getElementById("buy-step-1").style.display = "block";
  document.getElementById("buy-step-2").style.display = "none";
  document.getElementById("buy-step-3").style.display = "none";
  document.getElementById("buy-step-4").style.display = "none";
}

function resetSellSteps() {
  sellOrder = { crypto: "", network: "", amount: "", payment: "", account: "" };
  document.getElementById("sell-step-1").style.display = "block";
  document.getElementById("sell-step-2").style.display = "none";
  document.getElementById("sell-step-3").style.display = "none";
  document.getElementById("sell-step-4").style.display = "none";
}

// ---- BUY FLOW ----
function selectCrypto(crypto) {
  buyOrder.crypto = crypto;
  highlightSelected("buy-step-1", crypto);
  document.getElementById("buy-step-2").style.display = "block";
}

function selectNetwork(network) {
  buyOrder.network = network;
  highlightSelected("buy-step-2", network);
  document.getElementById("buy-step-3").style.display = "block";
}
// Your payment details — edit these to your real info
const myPaymentDetails = {
  bank: {
    name: "YOUR FULL NAME",
    bankName: "YOUR BANK NAME",
    accountNumber: "YOUR ACCOUNT NUMBER",
  },
  mobilemoney: {
    name: "YOUR FULL NAME",
    phone: "YOUR PHONE NUMBER",
    provider: "YOUR PROVIDER (e.g. Telebirr, M-Pesa)",
  },
};
function goToStep4() {
  const amount = document.getElementById("buy-amount").value;
  const payment = document.getElementById("buy-payment").value;
  if (!amount || !payment) {
    alert("Please fill in amount and payment method");
    return;
  }
  if (amount <= 0) {
    alert("Please enter a valid amount");
    return;
  }
  buyOrder.amount = amount;
  buyOrder.payment = payment;

  // Show payment details
  const details = myPaymentDetails[payment];
  let detailsHTML = "";
  if (payment === "bank") {
    detailsHTML = `
      <div class="payment-info-box">
        <p class="payment-info-title">💳 Send payment to this bank account:</p>
        <div class="payment-info-row"><span>Name</span><strong>${details.name}</strong></div>
        <div class="payment-info-row"><span>Bank</span><strong>${details.bankName}</strong></div>
        <div class="payment-info-row"><span>Account</span><strong>${details.accountNumber}</strong></div>
        <div class="payment-info-row"><span>Amount</span><strong>$${amount}</strong></div>
      </div>
    `;
  } else {
    detailsHTML = `
      <div class="payment-info-box">
        <p class="payment-info-title">📱 Send payment via ${details.provider}:</p>
        <div class="payment-info-row"><span>Name</span><strong>${details.name}</strong></div>
        <div class="payment-info-row"><span>Phone</span><strong>${details.phone}</strong></div>
        <div class="payment-info-row"><span>Amount</span><strong>$${amount}</strong></div>
      </div>
    `;
  }

  document.getElementById("buy-summary").innerHTML =
    `<p style="margin-bottom:12px">Buying <strong>${buyOrder.crypto}</strong> (${buyOrder.network})</p>` +
    detailsHTML;
  document.getElementById("buy-step-4").style.display = "block";
}

function submitBuyOrder() {
  const file = document.getElementById("receipt-upload").files[0];
  if (!file) {
    alert("Please upload your payment receipt");
    return;
  }

  // Prevent duplicate submission
  const submitBtn = document.querySelector("#buy-step-4 .submit-btn");
  if (submitBtn.disabled) return;
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  const user = auth.currentUser;
  const reader = new FileReader();
  reader.onload = function (e) {
    const receiptBase64 = e.target.result;

    // Check if same receipt already uploaded
    db.collection("orders")
      .where("userId", "==", user.uid)
      .where("receiptImage", "==", receiptBase64)
      .get()
      .then((snapshot) => {
        if (!snapshot.empty) {
          alert("⚠️ This receipt has already been uploaded before!");
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Order";
          return;
        }
        // Save order
        return db
          .collection("orders")
          .add({
            userId: user.uid,
            userEmail: user.email,
            type: "buy",
            crypto: buyOrder.crypto,
            network: buyOrder.network,
            amount: buyOrder.amount,
            paymentMethod: buyOrder.payment,
            receiptImage: receiptBase64,
            status: "pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          })
          .then(() => {
            alert("✅ Buy order submitted! We will process it shortly.");
            document
              .querySelectorAll(".section")
              .forEach((s) => (s.style.display = "none"));
            loadOrders();
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Order";
          });
      })
      .catch((err) => {
        alert(err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Order";
      });
  };
  reader.readAsDataURL(file);
}

// ---- SELL FLOW ----
function selectSellCrypto(crypto) {
  sellOrder.crypto = crypto;
  highlightSelected("sell-step-1", crypto);
  document.getElementById("sell-step-2").style.display = "block";
}

function selectSellNetwork(network) {
  sellOrder.network = network;
  highlightSelected("sell-step-2", network);
  document.getElementById("sell-step-3").style.display = "block";
}

function goToSellStep4() {
  const amount = document.getElementById("sell-amount").value;
  const payment = document.getElementById("sell-payment").value;
  const account = document.getElementById("sell-account").value;
  if (!amount || !payment || !account) {
    alert("Please fill in all fields");
    return;
  }
  sellOrder.amount = amount;
  sellOrder.payment = payment;
  sellOrder.account = account;
  const addressKey = `${sellOrder.crypto}-${sellOrder.network}`;
  const address = walletAddresses[addressKey] || "Address not available";
  document.getElementById(
    "sell-summary"
  ).textContent = `Selling ${sellOrder.crypto} (${sellOrder.network}) — $${sellOrder.amount}`;
  document.getElementById("wallet-address-display").textContent = address;
  document.getElementById("sell-step-4").style.display = "block";
}

function copyAddress() {
  const address = document.getElementById("wallet-address-display").textContent;
  navigator.clipboard.writeText(address);
  alert("Address copied!");
}

function submitSellOrder() {
  const user = auth.currentUser;
  db.collection("orders")
    .add({
      userId: user.uid,
      userEmail: user.email,
      type: "sell",
      crypto: sellOrder.crypto,
      network: sellOrder.network,
      amount: sellOrder.amount,
      paymentMethod: sellOrder.payment,
      paymentAccount: sellOrder.account,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      alert("✅ Sell order submitted! We will send your money shortly.");
      document
        .querySelectorAll(".section")
        .forEach((s) => (s.style.display = "none"));
      loadOrders();
    })
    .catch((err) => alert(err.message));
}

// ---- ORDERS ----
function loadOrders() {
  const user = auth.currentUser;
  if (!user) return;
  db.collection("orders")
    .where("userId", "==", user.uid)
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {
      const list = document.getElementById("orders-list");
      if (snapshot.empty) {
        list.innerHTML = "<p>No orders yet.</p>";
        return;
      }
      list.innerHTML = "";
      snapshot.forEach((doc) => {
        const o = doc.data();
        const div = document.createElement("div");
        div.className = "order-card";
        div.innerHTML = `
          <span class="order-type ${o.type}">${o.type.toUpperCase()}</span>
          <span>${o.crypto} (${o.network})</span>
          <span>$${o.amount}</span>
          <span class="status-badge ${o.status}">${o.status}</span>
        `;
        list.appendChild(div);
      });
    });
}

// ---- HELPERS ----
function highlightSelected(stepId, value) {
  document.querySelectorAll(`#${stepId} .crypto-btn`).forEach((btn) => {
    btn.style.background = btn.textContent.trim() === value ? "#4CAF50" : "";
    btn.style.color = btn.textContent.trim() === value ? "white" : "";
  });
}

// Update onAuthStateChanged to show user email and load orders
auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById("auth-screen").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("user-email-display").textContent = user.email;
    loadOrders();
  } else {
    document.getElementById("auth-screen").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
  }
});
// ---- ANIMATED BACKGROUND ----
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const symbols = ["₿", "Ξ", "₮", "◎", "⬡", "✦", "◈"];
const particles = [];

for (let i = 0; i < 30; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    size: Math.random() * 14 + 8,
    speedX: (Math.random() - 0.5) * 0.4,
    speedY: (Math.random() - 0.5) * 0.4,
    opacity: Math.random() * 0.12 + 0.03,
    color: ["#4F8EF7", "#A78BFA", "#F0B90B", "#10b981"][
      Math.floor(Math.random() * 4)
    ],
  });
}

function animateBg() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p) => {
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.font = `${p.size}px Inter`;
    ctx.fillText(p.symbol, p.x, p.y);
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.x > canvas.width + 20) p.x = -20;
    if (p.x < -20) p.x = canvas.width + 20;
    if (p.y > canvas.height + 20) p.y = -20;
    if (p.y < -20) p.y = canvas.height + 20;
  });
  ctx.globalAlpha = 1;
  requestAnimationFrame(animateBg);
}
animateBg();
