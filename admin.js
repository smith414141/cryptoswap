// ---- ADMIN EMAIL — change this to your email ----
const ADMIN_EMAIL = "@gmail.com";

let allOrders = [];
let currentFilter = "all";

// ---- ADMIN LOGIN ----
function adminLogin() {
  const email = document.getElementById("theismael050@gmail.com").value;
  const password = document.getElementById("12345678").value;

  if (email !== ADMIN_EMAIL) {
    showToast("Access denied", "error");
    return;
  }

  auth
    .signInWithEmailAndPassword(email, password)
    .then(() => {
      showToast("Welcome back, Admin 👋", "success");
    })
    .catch((err) => showToast(err.message, "error"));
}

function adminLogout() {
  auth.signOut();
}

// ---- AUTH STATE ----
auth.onAuthStateChanged((user) => {
  if (user && user.email === ADMIN_EMAIL) {
    document.getElementById("admin-login").style.display = "none";
    document.getElementById("admin-dashboard").style.display = "block";
    loadAdminOrders();
    listenForNewOrders();
  } else if (user && user.email !== ADMIN_EMAIL) {
    auth.signOut();
    showToast("Not authorized", "error");
  } else {
    document.getElementById("admin-login").style.display = "flex";
    document.getElementById("admin-dashboard").style.display = "none";
  }
});

// ---- LOAD ALL ORDERS (REAL TIME) ----
function loadAdminOrders() {
  db.collection("orders")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      allOrders = [];
      snapshot.forEach((doc) => {
        allOrders.push({ id: doc.id, ...doc.data() });
      });
      updateStats();
      renderOrders(currentFilter);
    });
}

// ---- LISTEN FOR NEW ORDERS ----
let isFirstLoad = true;
function listenForNewOrders() {
  db.collection("orders")
    .where("status", "==", "pending")
    .onSnapshot((snapshot) => {
      if (isFirstLoad) {
        isFirstLoad = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const o = change.doc.data();
          showToast(
            `🔔 New ${o.type.toUpperCase()} order — ${o.crypto} $${o.amount}`,
            "new-order"
          );
        }
      });
    });
}

// ---- STATS ----
function updateStats() {
  const pending = allOrders.filter((o) => o.status === "pending").length;
  const completed = allOrders.filter((o) => o.status === "completed").length;
  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-completed").textContent = completed;
  document.getElementById("stat-total").textContent = allOrders.length;
}

// ---- FILTER ----
function filterOrders(filter, btn) {
  currentFilter = filter;
  document
    .querySelectorAll(".filter-tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  renderOrders(filter);
}

// ---- RENDER ORDERS ----
function renderOrders(filter) {
  const container = document.getElementById("admin-orders");
  const filtered =
    filter === "all" ? allOrders : allOrders.filter((o) => o.status === filter);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">No ${filter} orders</div>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (order) => `
    <div class="admin-card" id="card-${order.id}">

      <div class="admin-card-header">
        <div class="admin-card-left">
          <span class="order-type ${
            order.type
          }">${order.type.toUpperCase()}</span>
          <span class="order-crypto">${order.crypto}</span>
          <span class="order-network">${order.network}</span>
        </div>
        <div class="admin-card-right">
          <span class="status-badge ${order.status}">${order.status}</span>
          <span class="order-time">${formatTime(order.createdAt)}</span>
        </div>
      </div>

      <div class="admin-card-body">
        <div class="order-detail-grid">
          <div class="order-detail">
            <span>Amount</span>
            <strong>$${order.amount}</strong>
          </div>
          <div class="order-detail">
            <span>Payment</span>
            <strong>${order.paymentMethod}</strong>
          </div>
          <div class="order-detail">
            <span>User</span>
            <strong>${order.userEmail}</strong>
          </div>
          ${
            order.paymentAccount
              ? `
          <div class="order-detail">
            <span>Their Account</span>
            <strong>${order.paymentAccount}</strong>
          </div>`
              : ""
          }
        </div>

        ${
          order.receiptImage
            ? `
        <div class="receipt-container">
          <p class="receipt-label">Payment Receipt</p>
          <img src="${order.receiptImage}" class="receipt-img" onclick="openImage('${order.receiptImage}')" />
        </div>`
            : ""
        }
      </div>

      ${
        order.status === "pending"
          ? `
      <div class="admin-actions">
        <button class="btn-confirm" onclick="updateOrder('${order.id}', 'confirmed')">
          ✓ Confirm Payment
        </button>
        <button class="btn-cancel" onclick="updateOrder('${order.id}', 'cancelled')">
          ✕ Cancel
        </button>
      </div>`
          : ""
      }

      ${
        order.status === "confirmed"
          ? `
      <div class="admin-actions">
        <button class="btn-complete" onclick="updateOrder('${order.id}', 'completed')">
          ⚡ Mark Complete
        </button>
        <button class="btn-cancel" onclick="updateOrder('${order.id}', 'cancelled')">
          ✕ Cancel
        </button>
      </div>`
          : ""
      }

    </div>
  `
    )
    .join("");
}

// ---- UPDATE ORDER STATUS ----
function updateOrder(orderId, newStatus) {
  db.collection("orders")
    .doc(orderId)
    .update({
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      const messages = {
        confirmed: "✅ Payment confirmed!",
        completed: "⚡ Order completed!",
        cancelled: "❌ Order cancelled",
      };
      showToast(
        messages[newStatus],
        newStatus === "cancelled" ? "error" : "success"
      );
    })
    .catch((err) => showToast(err.message, "error"));
}

// ---- OPEN IMAGE FULLSCREEN ----
function openImage(src) {
  const overlay = document.createElement("div");
  overlay.className = "img-overlay";
  overlay.innerHTML = `<img src="${src}" /><div class="img-close" onclick="this.parentElement.remove()">✕</div>`;
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
  document.body.appendChild(overlay);
}

// ---- FORMAT TIME ----
function formatTime(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---- FANCY TOAST NOTIFICATIONS ----
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = {
    success: "✅",
    error: "❌",
    "new-order": "🔔",
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || "💬"}</div>
    <div class="toast-message">${message}</div>
    <div class="toast-close" onclick="this.parentElement.remove()">✕</div>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add("toast-show"), 10);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove("toast-show");
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
