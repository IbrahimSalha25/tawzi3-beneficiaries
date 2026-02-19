// ============================================
// Complaints Module
// ============================================

/**
 * Submit a complaint to Firestore
 * Path: camps/{campId}/beneficiaries/{beneficiaryDocId}/complaints
 * Auto-sets status = "pending" and created_at = serverTimestamp
 */
async function submitComplaint() {
  const textarea = document.getElementById("complaint-text");
  const text = textarea.value.trim();
  const submitBtn = document.getElementById("submit-complaint-btn");

  if (!text) {
    showToast("الرجاء كتابة نص الشكوى", "warning");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "جارٍ الإرسال...";

  try {
    // Write complaint to the correct subcollection path
    await db
      .collection("camps")
      .doc(currentCampId)
      .collection("beneficiaries")
      .doc(currentDocId)
      .collection("complaints")
      .add({
        complaint_text: text,
        status: "pending",
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
      });

    showToast("تم إرسال الشكوى بنجاح ✓", "success");
    textarea.value = "";
    closeModal("complaint-modal");
  } catch (error) {
    console.error("Error submitting complaint:", error);
    showToast("حدث خطأ أثناء إرسال الشكوى", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "إرسال الشكوى";
  }
}
