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
    // Step 1: Get all distributions for the logged beneficiary
    const distSnapshot = await db
      .collection("camps")
      .doc(currentCampId)
      .collection("distribution")
      .where("beneficiary_id", "==", currentUser.id || currentDocId)
      .get();

    if (distSnapshot.empty) {
      grid.innerHTML = `
        <div class="parcels-empty">
          <div class="empty-icon">📦</div>
          <p>لا توجد طرود حالياً</p>
        </div>
      `;
      spinner.classList.add("hidden");
      content.classList.remove("hidden");
      return;
    }

    // Step 2: Fetch parcel details for each distribution
    const parcelsData = [];

    for (const distDoc of distSnapshot.docs) {
      const dist = distDoc.data();

      // Fetch the parcel document
      const parcelRef = db
        .collection("camps")
        .doc(currentCampId)
        .collection("parcels")
        .doc(String(dist.parcel_id));

      const parcelDoc = await parcelRef.get();

      if (!parcelDoc.exists) continue;

      const parcel = parcelDoc.data();

      // Step 3: Exclude parcels where parcel.status == "انتهى" AND distribution.status == "لم يستلم"
      if (parcel.status === "انتهى" && dist.status === "لم يستلم") {
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

    // Render the grid
    grid.innerHTML = "";

    if (parcelsData.length === 0) {
      grid.innerHTML = `
        <div class="parcels-empty">
          <div class="empty-icon">📦</div>
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
              <span class="meta-icon">📋</span>
              <span>النوع: ${escapeHtml(item.parcelType)}</span>
            </div>
            <div class="parcel-meta-item">
              <span class="meta-icon">📅</span>
              <span>التاريخ: ${escapeHtml(item.parcelDate)}</span>
            </div>
            <div class="parcel-meta-item">
              <span class="meta-icon">📦</span>
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
