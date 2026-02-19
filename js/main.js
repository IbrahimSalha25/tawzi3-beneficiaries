// ============================================
// Main Application Module
// ============================================

// Global State
let currentUser = null;
let currentCampId = null;
let currentDocId = null;

// ============================================
// Toast Notification System
// ============================================

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success' | 'error' | 'warning' | 'info'
 * @param {number} duration - Duration in milliseconds (default 3500)
 */
function showToast(message, type = "info", duration = 3500) {
  const container = document.getElementById("toast-container");

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;

  // Click to dismiss
  toast.addEventListener("click", () => dismissToast(toast));

  container.appendChild(toast);

  // Auto dismiss
  setTimeout(() => dismissToast(toast), duration);
}

/**
 * Dismiss a toast with animation
 * @param {HTMLElement} toast - Toast element to dismiss
 */
function dismissToast(toast) {
  if (toast.classList.contains("toast-out")) return;
  toast.classList.add("toast-out");
  setTimeout(() => toast.remove(), 300);
}

// ============================================
// Modal System
// ============================================

/**
 * Open a modal by ID
 * @param {string} modalId - The ID of the modal overlay element
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  // Add animation delay for content
  requestAnimationFrame(() => {
    modal.style.opacity = "1";
  });
}

/**
 * Close a modal by ID
 * @param {string} modalId - The ID of the modal overlay element
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove("active");
  document.body.style.overflow = "";
}

/**
 * Setup backdrop click to close modals
 */
function initModalBackdropClose() {
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });
}

// ============================================
// Navigation
// ============================================

/**
 * Initialize tab navigation
 */
function initNavigation() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update active nav button
      document
        .querySelectorAll(".nav-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Show corresponding section
      document
        .querySelectorAll(".section")
        .forEach((s) => s.classList.remove("active"));
      const sectionId = btn.dataset.section;
      document.getElementById(sectionId).classList.add("active");

      // Reload parcels when switching to parcels tab
      if (sectionId === "parcels") {
        loadParcels();
      }
    });
  });
}

// ============================================
// Dark Mode
// ============================================

/**
 * Initialize dark mode toggle
 * Persists user preference in localStorage
 */
function initDarkMode() {
  const toggle = document.getElementById("theme-toggle");
  const switchEl = document.getElementById("theme-switch");

  // Load saved preference
  const savedTheme = localStorage.getItem("tawzi3_theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    switchEl.classList.add("active");
  }

  toggle.addEventListener("click", () => {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";

    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      switchEl.classList.remove("active");
      localStorage.setItem("tawzi3_theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      switchEl.classList.add("active");
      localStorage.setItem("tawzi3_theme", "dark");
    }
  });
}

// ============================================
// Show App (post-login)
// ============================================

/**
 * Transition from login screen to main app
 */
function showApp() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app").style.display = "block";

  // Load data
  loadBeneficiaryInfo();
  loadParcels();
}

// ============================================
// QR Code Generation
// ============================================

/**
 * Generate and display the beneficiary QR code
 * Contains: beneficiary_id, head_name, campId
 * Uses compact keys and low error correction to avoid QR overflow
 */
function generateQRCode() {
  const qrContainer = document.getElementById("qr-code");
  qrContainer.innerHTML = "";

  // Use short keys to reduce QR data length
  const qrData = JSON.stringify({
    id: currentUser.id || currentDocId,
    name: currentUser.head_name,
    camp: currentCampId,
  });

  try {
    new QRCode(qrContainer, {
      text: currentUser.head_id_number,
      width: 220,
      height: 220,
      colorDark: "#1a302aff",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.L, // Low correction = more data capacity
    });
  } catch (e) {
    // Fallback: use only the beneficiary ID if data is still too long
    console.warn(
      "QR with full data failed, using ID-only fallback:",
      e.message,
    );
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text: String(currentUser.head_id_number || currentDocId),
      width: 220,
      height: 220,
      colorDark: "#1b4136",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.L,
    });
  }

  document.getElementById("qr-name").textContent =
    currentUser.head_name || "---";
  document.getElementById("qr-id-text").textContent =
    "رقم الهوية: " + (currentUser.head_id_number || "---");

  openModal("qr-modal");
}

// ============================================
// Change Password
// ============================================

/**
 * Initialize the change password flow
 * If no password_hash → verify phone → set new password
 * If password_hash exists → verify old password → set new password
 */
function initChangePassword() {
  const btn = document.getElementById("change-password-btn");
  btn.addEventListener("click", () => {
    const hasPassword = currentUser.password_hash ? true : false;

    // Show appropriate step
    const step1 = document.getElementById("password-step-verify");
    const step2 = document.getElementById("password-step-new");

    if (hasPassword) {
      // User has a password, show verification step
      document.getElementById("verify-label").textContent =
        "كلمة المرور الحالية";
      document.getElementById("verify-input").type = "password";
      document.getElementById("verify-input").placeholder =
        "أدخل كلمة المرور الحالية";
      document.getElementById("password-info-text").textContent =
        "أدخل كلمة المرور الحالية للمتابعة";
    } else {
      // No password, verify phone number
      document.getElementById("verify-label").textContent = "رقم الهاتف للتحقق";
      document.getElementById("verify-input").type = "tel";
      document.getElementById("verify-input").placeholder =
        "أدخل رقم الهاتف المسجل";
      document.getElementById("password-info-text").textContent =
        "أدخل رقم الهاتف المسجل لإنشاء كلمة مرور جديدة";
    }

    // Reset form
    document.getElementById("verify-input").value = "";
    document.getElementById("new-password-input").value = "";
    document.getElementById("confirm-password-input").value = "";

    step1.classList.add("active");
    step2.classList.remove("active");

    openModal("password-modal");
  });
}

/**
 * Verify the current credential (phone or password)
 * Then show the new password form
 */
async function verifyCurrentCredential() {
  const input = document.getElementById("verify-input").value.trim();
  const verifyBtn = document.getElementById("verify-btn");

  if (!input) {
    showToast("الرجاء إدخال البيانات المطلوبة", "warning");
    return;
  }

  verifyBtn.disabled = true;
  verifyBtn.textContent = "جارٍ التحقق...";

  try {
    if (currentUser.password_hash) {
      // Verify existing password via SHA-256
      const inputHash = await hashPassword(input);
      if (inputHash !== currentUser.password_hash) {
        showToast("كلمة المرور الحالية غير صحيحة", "error");
        return;
      }
    } else {
      // Verify phone number
      if (input !== currentUser.main_phone) {
        showToast("رقم الهاتف غير صحيح", "error");
        return;
      }
    }

    // Show new password step
    document.getElementById("password-step-verify").classList.remove("active");
    document.getElementById("password-step-new").classList.add("active");
    showToast("تم التحقق بنجاح", "success");
  } catch (error) {
    console.error("Error verifying credential:", error);
    showToast("حدث خطأ أثناء التحقق", "error");
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.textContent = "تحقق";
  }
}

/**
 * Save the new password (SHA-256 hashed) to Firestore
 */
async function saveNewPassword() {
  const newPassword = document
    .getElementById("new-password-input")
    .value.trim();
  const confirmPassword = document
    .getElementById("confirm-password-input")
    .value.trim();
  const saveBtn = document.getElementById("save-password-btn");

  if (!newPassword || newPassword.length < 6) {
    showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "warning");
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast("كلمتا المرور غير متطابقتين", "error");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "جارٍ الحفظ...";

  try {
    const hashedPassword = await hashPassword(newPassword);

    // Update password_hash in Firestore
    await db
      .collection("camps")
      .doc(currentCampId)
      .collection("beneficiaries")
      .doc(currentDocId)
      .update({ password_hash: hashedPassword });

    // Update local session
    currentUser.password_hash = hashedPassword;
    localStorage.setItem("tawzi3_user", JSON.stringify(currentUser));

    showToast("تم تغيير كلمة المرور بنجاح ✓", "success");
    closeModal("password-modal");
  } catch (error) {
    console.error("Error saving password:", error);
    showToast("حدث خطأ أثناء حفظ كلمة المرور", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "حفظ كلمة المرور";
  }
}

// ============================================
// Splash Screen & Initialization
// ============================================

/**
 * Initialize the application
 * Handles splash screen, session check, and event binding
 */
function initApp() {
  // Apply saved dark mode preference immediately
  const savedTheme = localStorage.getItem("tawzi3_theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  // Splash screen timing
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    splash.classList.add("fade-out");

    setTimeout(() => {
      splash.style.display = "none";

      // Check for existing session
      if (loadUserFromStorage()) {
        showApp();
      } else {
        document.getElementById("login-screen").style.display = "flex";
      }
    }, 600);
  }, 2000);

  // Initialize all modules
  initLoginForm();
  initNavigation();
  initDarkMode();
  initModalBackdropClose();
  initChangePassword();

  // QR Code button
  document.getElementById("qr-btn").addEventListener("click", generateQRCode);

  // Complaint button
  document.getElementById("complaint-btn").addEventListener("click", () => {
    document.getElementById("complaint-text").value = "";
    openModal("complaint-modal");
  });

  // Logout button
  document.getElementById("logout-btn").addEventListener("click", () => {
    showToast("تم تسجيل الخروج", "info");
    setTimeout(logout, 500);
  });
}

// Start the app when DOM is ready
document.addEventListener("DOMContentLoaded", initApp);
