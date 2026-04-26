// ============================================
// Parcels Module
// ============================================

/**
 * Load all parcels for the logged-in beneficiary.
 *
 * Data model (Firestore):
 *   camps/{campId}/distribution/{distId}
 *     - beneficiary_uuid    : string  (UUID of the beneficiary, = currentUser.uuid)
 *     - parcel_uuid         : string  (UUID matching parcels.uuid field)
 *     - status              : string  ("تم الاستلام" | "لم يستلم")
 *     - distribution_date   : string
 *     - uuid                : string  (own doc UUID)
 *     - created_at          : string
 *     - updated_at          : timestamp
 *     - user                : string
 *     - synced              : number
 *
 *   camps/{campId}/parcels/{parcelDocId}
 *     - uuid           : string  (UUID identifier, matches distribution.parcel_uuid)
 *     - name           : string
 *     - description    : string
 *     - type_parcel    : string
 *     - status         : string  ("نشط" | "انتهى")
 *     - date           : string
 *
 * Logic:
 *   1. Query distribution where beneficiary_uuid == currentUser.uuid
 *   2. For each distribution → get parcel where uuid == dist.parcel_uuid
 *   3. Skip parcels where parcel.status == "انتهى" AND dist.status == "لم يستلم"
 *   4. Sort results by parcel date DESC
 */
async function loadParcels() {
  const spinner = document.getElementById("parcels-spinner");
  const content = document.getElementById("parcels-content");
  const grid = document.getElementById("parcels-grid");

  spinner.classList.remove("hidden");
  content.classList.add("hidden");

  try {
    // ── Step 1: Fetch distributions for the current beneficiary ──────────────
    // beneficiary_uuid in distribution is stored as the Firestore document ID.
    const distSnapshot = await db
      .collection("camps")
      .doc(currentCampId)
      .collection("distribution")
      .where("beneficiary_uuid", "==", currentUser.uuid)
      .get();

    // ── No distributions found ───────────────────────────────────────────────
    if (distSnapshot.empty) {
      grid.innerHTML = _emptyParcelsHTML();
      spinner.classList.add("hidden");
      content.classList.remove("hidden");
      return;
    }

    // ── Step 2: Fetch parcel details for each distribution ───────────────────
    const parcelsData = [];

    for (const distDoc of distSnapshot.docs) {
      const dist = distDoc.data();
      const parcelUuidVal = dist.parcel_uuid;

      if (!parcelUuidVal) continue;

      // parcels are linked by their 'uuid' field (not the Firestore document ID)
      const parcelSnap = await db
        .collection("camps")
        .doc(currentCampId)
        .collection("parcels")
        .where("uuid", "==", parcelUuidVal)
        .get();

      if (parcelSnap.empty) continue;

      const parcelDoc = parcelSnap.docs[0];
      const parcel = parcelDoc.data();

      // ── Step 3: Exclude expired & un-received parcels ──────────────────────
      if (parcel.status === "انتهى" && dist.status === "لم يستلم") continue;

      parcelsData.push({
        parcelId: parcelDoc.id,
        parcelName: parcel.name || "---",
        parcelDescription: parcel.description || "",
        parcelType: parcel.type_parcel || "---",
        parcelStatus: parcel.status || "---",
        parcelDateRaw: parcel.date || "",
        parcelDate: formatArabicDate(parcel.date),
        distributionStatus: dist.status || "---",
        distributionDateRaw: dist.distribution_date || "",
        distributionDate: formatArabicDate(dist.distribution_date),
      });
    }

    // ── Step 4: Sort by parcel date DESC ─────────────────────────────────────
    parcelsData.sort((a, b) =>
      (b.parcelDateRaw || "").localeCompare(a.parcelDateRaw || "")
    );

    // ── Render ────────────────────────────────────────────────────────────────
    grid.innerHTML = "";

    if (parcelsData.length === 0) {
      grid.innerHTML = _emptyParcelsHTML();
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
  } catch (error) {
    console.error("loadParcels error:", error);
    showToast("حدث خطأ أثناء تحميل الطرود", "error");
  } finally {
    spinner.classList.add("hidden");
    content.classList.remove("hidden");
  }
}

/**
 * Returns the HTML for the empty-parcels state.
 * @returns {string}
 */
function _emptyParcelsHTML() {
  return `
    <div class="parcels-empty">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      </div>
      <p>لا توجد طرود حالياً</p>
    </div>
  `;
}

// ============================================
// Parcel Details Modal
// ============================================

/**
 * Show full parcel details in a modal.
 * @param {Object} item - Parcel + distribution data object
 */
// Global storage for queue timers (keyed by parcelId)
window._queueTimers = window._queueTimers || {};
// Track which parcel is currently being viewed
window._activeQueueParcelId = null;

function showParcelDetails(item) {
  document.getElementById("detail-parcel-name").textContent = item.parcelName;
  document.getElementById("detail-parcel-type").textContent = item.parcelType;
  document.getElementById("detail-parcel-status").textContent = item.parcelStatus;
  document.getElementById("detail-parcel-date").textContent = item.parcelDate;
  document.getElementById("detail-parcel-desc").textContent = item.parcelDescription || "لا يوجد وصف";
  document.getElementById("detail-dist-status").textContent = item.distributionStatus;
  document.getElementById("detail-dist-date").textContent = item.distributionDate;

  // ── Queue Status Card (always visible) ──────────────────────────────────────
  const queueCard = document.getElementById("queue-status-card");
  queueCard.style.display = "block";

  // Generate a queue ticket from beneficiary id
  const userIdStr = (currentUser && currentUser.national_id) || "000";
  const ticketLetter = String.fromCharCode(65 + (userIdStr.charCodeAt(0) % 26));
  const ticketNum = (parseInt(userIdStr.slice(-3), 10) % 500) || 1;
  document.getElementById("queue-number").textContent = ticketLetter + "-" + ticketNum;

  // Simulated queue metrics based on a hash of parcel id
  const seed = item.parcelId
    ? item.parcelId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    : 42;
  const peopleAhead = (seed % 8) + 1;
  const avgService = ((seed % 4) + 3);
  const waitMinutes = peopleAhead * avgService;

  document.getElementById("queue-people-ahead").textContent = "يوجد " + peopleAhead + " أشخاص أمامك";
  document.getElementById("queue-avg-service").textContent = "متوسط الخدمة: " + avgService + " دقائق";

  // ── Persistent Live Countdown Timer ─────────────────────────────────────────
  const timerId = item.parcelId || "default";
  window._activeQueueParcelId = timerId;

  // Initialize timer for this parcel if first time
  if (!window._queueTimers[timerId]) {
    window._queueTimers[timerId] = {
      totalSeconds: waitMinutes * 60,
      totalSecondsInitial: waitMinutes * 60,
      intervalId: null,
    };
  }

  const timerState = window._queueTimers[timerId];

  // Function to render current timer state to the DOM
  function renderTimerToDOM() {
    if (timerState.totalSeconds <= 0) {
      document.getElementById("queue-wait-time").textContent = "حان دورك! 🎉";
      document.getElementById("queue-progress-fill").style.width = "100%";
      return;
    }
    const mins = Math.floor(timerState.totalSeconds / 60);
    const secs = timerState.totalSeconds % 60;
    const timeText = mins > 0
      ? mins + " دقيقة و " + secs + " ثانية"
      : secs + " ثانية";
    document.getElementById("queue-wait-time").textContent = timeText;

    const elapsed = timerState.totalSecondsInitial - timerState.totalSeconds;
    const progressPct = Math.min(100, Math.round((elapsed / timerState.totalSecondsInitial) * 100));
    document.getElementById("queue-progress-fill").style.width = progressPct + "%";
  }

  // Show current state immediately
  renderTimerToDOM();

  // Start background interval only if not already running
  if (!timerState.intervalId) {
    timerState.intervalId = setInterval(function () {
      // Always count down in memory
      if (timerState.totalSeconds > 0) {
        timerState.totalSeconds--;
      } else {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
      }

      // Only update DOM if this parcel is currently being viewed
      if (window._activeQueueParcelId === timerId) {
        renderTimerToDOM();
      }
    }, 1000);
  }

  openModal("parcel-modal");
}

// ============================================
// Helpers
// ============================================

/**
 * CSS badge class based on distribution status.
 * @param {string} status
 * @returns {string}
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case "تم الاستلام": return "badge-received";
    case "لم يستلم": return "badge-pending";
    default: return "badge-active";
  }
}

/**
 * Escape HTML to prevent XSS.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format a date string into a readable Arabic locale format.
 * @param {string} dateString
 * @returns {string}
 */
function formatArabicDate(dateString) {
  if (!dateString || dateString === "---" || !dateString.trim()) return "---";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
}
