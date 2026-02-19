// ============================================
// Parcels Module
// ============================================

/**
 * Load all parcels for the logged-in beneficiary
 * 1. Fetches distributions from camps/{campId}/distribution
 * 2. For each distribution, fetches the parcel from camps/{campId}/parcels
 * 3. Excludes parcels where parcel.status == "انتهى" AND distribution.status == "لم يستلم"
 * 4. Sorts by parcel date DESC
 */
async function loadParcels() {
  const spinner = document.getElementById("parcels-spinner");
  const content = document.getElementById("parcels-content");
  const grid = document.getElementById("parcels-grid");

  spinner.classList.remove("hidden");
  content.classList.add("hidden");

  try {
    // Debug: Log current user session data
    console.log("=== PARCELS LOADING DEBUG ===");
    console.log("currentCampId:", currentCampId);
    console.log("currentDocId:", currentDocId);
    console.log("currentUser.id:", currentUser.id);
    console.log("currentUser.head_id_number:", currentUser.head_id_number);
    console.log("Full currentUser:", JSON.parse(JSON.stringify(currentUser)));

    // Step 1: Get all distributions for the logged beneficiary
    // Try multiple possible beneficiary_id values
    const possibleIds = [
      currentUser.id,
      currentDocId,
      currentUser.head_id_number,
      Number(currentUser.id),
      Number(currentDocId),
      Number(currentUser.head_id_number),
    ].filter(Boolean);

    // Remove duplicates
    const uniqueIds = [...new Set(possibleIds.map(String))];
    console.log(
      "Searching distributions with beneficiary_id values:",
      uniqueIds,
    );

    // First, let's see ALL distributions in this camp for debugging
    const allDistSnapshot = await db
      .collection("camps")
      .doc(currentCampId)
      .collection("distribution")
      .get();

    console.log("Total distributions in camp:", allDistSnapshot.size);
    allDistSnapshot.docs.forEach((doc) => {
      const d = doc.data();
      console.log(
        "Distribution doc:",
        doc.id,
        "beneficiary_id:",
        d.beneficiary_id,
        "type:",
        typeof d.beneficiary_id,
        "parcel_id:",
        d.parcel_id,
      );
    });

    // Try the primary query
    let distSnapshot = await db
      .collection("camps")
      .doc(currentCampId)
      .collection("distribution")
      .where("beneficiary_id", "==", currentUser.id || currentDocId)
      .get();

    console.log(
      "Primary query result (beneficiary_id == '" +
        (currentUser.id || currentDocId) +
        "'):",
      distSnapshot.size,
      "docs",
    );

    // If empty, try with numeric ID
    if (distSnapshot.empty && currentUser.id) {
      console.log(
        "Trying with numeric beneficiary_id:",
        Number(currentUser.id),
      );
      distSnapshot = await db
        .collection("camps")
        .doc(currentCampId)
        .collection("distribution")
        .where("beneficiary_id", "==", Number(currentUser.id))
        .get();
      console.log("Numeric query result:", distSnapshot.size, "docs");
    }

    // If still empty, try with head_id_number
    if (distSnapshot.empty && currentUser.head_id_number) {
      console.log("Trying with head_id_number:", currentUser.head_id_number);
      distSnapshot = await db
        .collection("camps")
        .doc(currentCampId)
        .collection("distribution")
        .where("beneficiary_id", "==", currentUser.head_id_number)
        .get();
      console.log("head_id_number query result:", distSnapshot.size, "docs");
    }

    // If still empty, try with docId
    if (distSnapshot.empty) {
      console.log("Trying with currentDocId:", currentDocId);
      distSnapshot = await db
        .collection("camps")
        .doc(currentCampId)
        .collection("distribution")
        .where("beneficiary_id", "==", currentDocId)
        .get();
      console.log("docId query result:", distSnapshot.size, "docs");
    }

    if (distSnapshot.empty) {
      console.log("No distributions found for any beneficiary_id variant");
      grid.innerHTML = `
        <div class="parcels-empty">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <p>لا توجد طرود حالياً</p>
        </div>
      `;
      spinner.classList.add("hidden");
      content.classList.remove("hidden");
      return;
    }

    console.log("Found", distSnapshot.size, "distributions. Processing...");

    // Step 2: Fetch parcel details for each distribution
    const parcelsData = [];

    for (const distDoc of distSnapshot.docs) {
      const dist = distDoc.data();
      console.log(
        "Processing distribution:",
        distDoc.id,
        "parcel_id:",
        dist.parcel_id,
        "type:",
        typeof dist.parcel_id,
      );

      // Fetch the parcel document
      const parcelRef = db
        .collection("camps")
        .doc(currentCampId)
        .collection("parcels")
        .doc(String(dist.parcel_id));

      console.log("Fetching parcel at path:", parcelRef.path);
      const parcelDoc = await parcelRef.get();

      if (!parcelDoc.exists) {
        console.warn("Parcel doc NOT FOUND at:", parcelRef.path);

        // Debug: list all parcels in this camp
        const allParcels = await db
          .collection("camps")
          .doc(currentCampId)
          .collection("parcels")
          .get();
        console.log("All parcels in camp (" + allParcels.size + "):");
        allParcels.docs.forEach((p) => {
          console.log("  Parcel doc ID:", p.id, "data:", p.data());
        });
        continue;
      }

      const parcel = parcelDoc.data();
      console.log(
        "Parcel found:",
        parcelDoc.id,
        "name:",
        parcel.name,
        "status:",
        parcel.status,
      );

      // Step 3: Exclude parcels where parcel.status == "انتهى" AND distribution.status == "لم يستلم"
      if (parcel.status === "انتهى" && dist.status === "لم يستلم") {
        console.log("Excluded (finished + not received):", parcel.name);
        continue;
      }

      parcelsData.push({
        parcelId: parcelDoc.id,
        parcelName: parcel.name || "---",
        parcelDescription: parcel.description || "",
        parcelType: parcel.type_parcel || "---",
        parcelStatus: parcel.status || "---",
        parcelDate: parcel.date || "---",
        distributionStatus: dist.status || "---",
        distributionDate: dist.distribution_date || "---",
      });
    }

    // Step 4: Sort by date DESC
    parcelsData.sort((a, b) => {
      const dateA = a.parcelDate || "";
      const dateB = b.parcelDate || "";
      return dateB.localeCompare(dateA);
    });

    console.log("Final parcels to render:", parcelsData.length, parcelsData);
    console.log("=== END PARCELS DEBUG ===");

    // Render the grid
    grid.innerHTML = "";

    if (parcelsData.length === 0) {
      grid.innerHTML = `
        <div class="parcels-empty">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <p>لا توجد طرود حالياً</p>
        </div>
      `;
    } else {
      for (const item of parcelsData) {
        const card = document.createElement("div");
        card.className = "parcel-card";
        card.innerHTML = `
          <div class="parcel-header">
            <div class="parcel-name">${escapeHtml(item.parcelName)}</div>
            <span class="parcel-badge ${getStatusBadgeClass(item.distributionStatus)}">
              ${escapeHtml(item.distributionStatus)}
            </span>
          </div>
          <div class="parcel-meta">
            <div class="parcel-meta-item">
              <span class="meta-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
              <span>النوع: ${escapeHtml(item.parcelType)}</span>
            </div>
            <div class="parcel-meta-item">
              <span class="meta-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
              <span>التاريخ: ${escapeHtml(item.parcelDate)}</span>
            </div>
            <div class="parcel-meta-item">
              <span class="meta-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></span>
              <span>حالة الطرد: ${escapeHtml(item.parcelStatus)}</span>
            </div>
          </div>
        `;
        card.addEventListener("click", () => showParcelDetails(item));
        grid.appendChild(card);
      }
    }

    spinner.classList.add("hidden");
    content.classList.remove("hidden");
  } catch (error) {
    console.error("Error loading parcels:", error);
    console.error("Error stack:", error.stack);
    showToast("حدث خطأ أثناء تحميل الطرود", "error");
    spinner.classList.add("hidden");
  }
}

/**
 * Show full parcel details in a modal
 * @param {Object} item - Parcel + distribution data
 */
function showParcelDetails(item) {
  document.getElementById("detail-parcel-name").textContent = item.parcelName;
  document.getElementById("detail-parcel-type").textContent = item.parcelType;
  document.getElementById("detail-parcel-status").textContent =
    item.parcelStatus;
  document.getElementById("detail-parcel-date").textContent = item.parcelDate;
  document.getElementById("detail-parcel-desc").textContent =
    item.parcelDescription || "لا يوجد وصف";
  document.getElementById("detail-dist-status").textContent =
    item.distributionStatus;
  document.getElementById("detail-dist-date").textContent =
    item.distributionDate;
  openModal("parcel-modal");
}

/**
 * Get the CSS badge class based on distribution status
 * @param {string} status - The distribution status
 * @returns {string} - CSS class name
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case "استلم":
      return "badge-received";
    case "لم يستلم":
      return "badge-pending";
    default:
      return "badge-active";
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Raw text
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
