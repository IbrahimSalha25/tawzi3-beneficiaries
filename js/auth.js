// ============================================
// Authentication Module
// ============================================

/**
 * Handle user login
 * Uses collectionGroup query on beneficiaries
 * Supports both phone-based and password-based login
 * @param {string} nationalId - The head_id_number
 * @param {string} credential - Phone number or password
 */
async function login(nationalId, credential) {
  const loginBtn = document.getElementById("login-btn");
  const loginSpinner = document.getElementById("login-spinner");
  const loginError = document.getElementById("login-error");

  loginBtn.disabled = true;
  loginSpinner.classList.remove("hidden");
  loginError.style.display = "none";

  try {
    // Query all beneficiaries across all camps by head_id_number
    const snapshot = await db
      .collectionGroup("beneficiaries")
      .where("head_id_number", "==", nationalId)
      .get();

    if (snapshot.empty) {
      throw new Error("رقم الهوية غير موجود في النظام");
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const campId = doc.ref.parent.parent.id;
    const beneficiaryDocId = doc.id;

    // Check authentication method
    if (data.password_hash) {
      // Password-based login: compare SHA-256 hash
      const inputHash = await hashPassword(credential);
      if (inputHash !== data.password_hash) {
        throw new Error("كلمة المرور غير صحيحة");
      }
    } else {
      // Phone-based login: compare main_phone
      if (credential !== data.main_phone) {
        throw new Error("رقم الهاتف غير صحيح");
      }
    }

    // Fetch camp info
    const campDoc = await db.collection("camps").doc(campId).get();
    const campData = campDoc.data();

    // Build user session object
    const userSession = {
      docId: beneficiaryDocId,
      campId: campId,
      campName: campData.camp_name || "",
      campLocation: campData.location || "",
      representativeName: campData.representative_name || "",
      representativePhone: campData.representative_phone || "",
      ...data,
    };

    // Save session to localStorage
    localStorage.setItem("tawzi3_user", JSON.stringify(userSession));
    localStorage.setItem("tawzi3_campId", campId);
    localStorage.setItem("tawzi3_docId", beneficiaryDocId);

    // Set global state and show app
    currentUser = userSession;
    currentCampId = campId;
    currentDocId = beneficiaryDocId;

    showApp();
    showToast("تم تسجيل الدخول بنجاح", "success");
  } catch (error) {
    loginError.textContent = error.message;
    loginError.style.display = "block";
  } finally {
    loginBtn.disabled = false;
    loginSpinner.classList.add("hidden");
  }
}

/**
 * Load user session from localStorage
 * @returns {boolean} - Whether a valid session was found
 */
function loadUserFromStorage() {
  const userData = localStorage.getItem("tawzi3_user");
  const campId = localStorage.getItem("tawzi3_campId");
  const docId = localStorage.getItem("tawzi3_docId");

  if (userData && campId && docId) {
    currentUser = JSON.parse(userData);
    currentCampId = campId;
    currentDocId = docId;
    return true;
  }
  return false;
}

/**
 * Log out the current user
 */
function logout() {
  localStorage.removeItem("tawzi3_user");
  localStorage.removeItem("tawzi3_campId");
  localStorage.removeItem("tawzi3_docId");
  currentUser = null;
  currentCampId = null;
  currentDocId = null;
  location.reload();
}

/**
 * Setup login form event listener
 */
function initLoginForm() {
  const loginForm = document.getElementById("login-form");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nationalId = document.getElementById("national-id").value.trim();
    const credential = document.getElementById("credential").value.trim();

    if (!nationalId || !credential) {
      const loginError = document.getElementById("login-error");
      loginError.textContent = "الرجاء إدخال جميع البيانات";
      loginError.style.display = "block";
      return;
    }

    await login(nationalId, credential);
  });
}
