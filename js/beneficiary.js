// ============================================
// Beneficiary Profile Module
// ============================================

/**
 * Load and display all beneficiary information
 * Fetches fresh data from Firestore and populates the profile UI
 */
async function loadBeneficiaryInfo() {
  const spinner = document.getElementById("info-spinner");
  const content = document.getElementById("info-content");

  spinner.classList.remove("hidden");
  content.classList.add("hidden");

  try {
    // Fetch beneficiary document
    const doc = await db
      .collection("camps")
      .doc(currentCampId)
      .collection("beneficiaries")
      .doc(currentDocId)
      .get();

    if (!doc.exists) {
      showToast("لم يتم العثور على بيانات المستفيد", "error");
      return;
    }

    const data = doc.data();

    // Profile header
    document.getElementById("profile-name").textContent =
      data.head_name || "---";
    document.getElementById("profile-id-display").textContent =
      data.head_id_number || "---";

    // Camp information
    document.getElementById("camp-name").textContent =
      currentUser.campName || "---";
    document.getElementById("camp-location").textContent =
      currentUser.campLocation || "---";
    document.getElementById("camp-representative").textContent =
      currentUser.representativeName || "---";
    document.getElementById("camp-rep-phone").textContent =
      currentUser.representativePhone || "---";

    // Personal information
    document.getElementById("head-name").textContent = data.head_name || "---";
    document.getElementById("head-id").textContent =
      data.head_id_number || "---";
    document.getElementById("head-phone").textContent =
      data.main_phone || "---";

    // Family composition - demographic breakdown
    const males02 = Number(data.males_0_2) || 0;
    const males517 = Number(data.males_5_17) || 0;
    const males1760 = Number(data.males_17_60) || 0;
    const males60plus = Number(data.males_60_plus) || 0;
    const females02 = Number(data.females_0_2) || 0;
    const females517 = Number(data.females_5_17) || 0;
    const females1760 = Number(data.females_17_60) || 0;
    const females60plus = Number(data.females_60_plus) || 0;
    const disabledCount = Number(data.disabled_count) || 0;

    // Calculate total family members dynamically
    const totalMembers =
      males02 +
      males517 +
      males1760 +
      males60plus +
      females02 +
      females517 +
      females1760 +
      females60plus;

    // Use family_count from DB if available, otherwise use calculated total
    const familyCount = data.family_count || totalMembers;

    document.getElementById("family-total").textContent = familyCount;
    document.getElementById("males-0-2").textContent = males02;
    document.getElementById("males-5-17").textContent = males517;
    document.getElementById("males-17-60").textContent = males1760;
    document.getElementById("males-60-plus").textContent = males60plus;
    document.getElementById("females-0-2").textContent = females02;
    document.getElementById("females-5-17").textContent = females517;
    document.getElementById("females-17-60").textContent = females1760;
    document.getElementById("females-60-plus").textContent = females60plus;
    document.getElementById("disabled-count").textContent = disabledCount;

    // Original location
    document.getElementById("governorate").textContent =
      data.governorate || "---";
    document.getElementById("town").textContent = data.town || "---";
    document.getElementById("landmark").textContent = data.landmark || "---";

    // Update settings page user name
    document.getElementById("user-name-display").textContent =
      data.head_name || "---";

    spinner.classList.add("hidden");
    content.classList.remove("hidden");
  } catch (error) {
    console.error("Error loading beneficiary info:", error);
    showToast("حدث خطأ أثناء تحميل البيانات", "error");
    spinner.classList.add("hidden");
  }
}
