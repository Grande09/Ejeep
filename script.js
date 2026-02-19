// LocalStorage keys
const STORAGE_KEY = "ejeepReservations";
const SUBSCRIPTION_KEY = "ejeepSubscription";

/**
 * Read reservations from LocalStorage
 */
function getReservations() {
  const saved = localStorage.getItem(STORAGE_KEY);
  try {
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Save reservations to LocalStorage
 */
function saveReservations(reservations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
}

/**
 * Format currency in PHP peso
 */
function formatPeso(amount) {
  return "₱" + amount.toFixed(2);
}

/**
 * Get subscription type from LocalStorage
 */
function getSubscription() {
  const saved = localStorage.getItem(SUBSCRIPTION_KEY);
  return saved || "free";
}

/**
 * Save subscription type to LocalStorage
 */
function saveSubscription(type) {
  localStorage.setItem(SUBSCRIPTION_KEY, type);
  updatePremiumBadge();
}

/**
 * Update premium badge visibility
 */
function updatePremiumBadge() {
  const badge = document.getElementById("premiumBadge");
  const bookingBadge = document.getElementById("bookingPremiumBadge");
  
  if (badge) {
    badge.style.display = getSubscription() === "premium" ? "inline-flex" : "none";
  }
  
  if (bookingBadge) {
    bookingBadge.style.display = getSubscription() === "premium" ? "inline-flex" : "none";
  }
}

/**
 * Get discount percentage for premium users
 */
function getDiscountPercentage() {
  return getSubscription() === "premium" ? 7.5 : 0; // 7.5% average of 5-10%
}

/**
 * Get base fare per route
 */
function getRouteBaseFare(route) {
  switch (route) {
    case "city-center":
      return 20;
    case "university":
      return 15;
    case "business-district":
      return 25;
    case "suburb":
      return 30;
    default:
      return 0;
  }
}

/**
 * Map route code to label
 */
function routeLabel(route) {
  switch (route) {
    case "city-center":
      return "City Center Loop";
    case "university":
      return "University Route";
    case "business-district":
      return "Business District";
    case "suburb":
      return "Suburb Express";
    default:
      return route;
  }
}

/**
 * Render reservations to UI
 */
function renderReservations() {
  const container = document.getElementById("reservationsContainer");
  const noResEl = document.getElementById("noReservations");
  const reservations = getReservations();

  container.innerHTML = "";

  if (!reservations.length) {
    noResEl.style.display = "block";
    return;
  }

  noResEl.style.display = "none";

  reservations.forEach((res) => {
    const card = document.createElement("div");
    card.className = "card res-card";

    const header = document.createElement("div");
    header.className = "res-header";

    const route = document.createElement("div");
    route.className = "res-route";
    route.textContent = routeLabel(res.route);

    const badge = document.createElement("span");
    badge.className = "res-badge";
    badge.textContent = `${res.seats} seat${res.seats > 1 ? "s" : ""}`;

    header.appendChild(route);
    header.appendChild(badge);

    const body = document.createElement("div");
    body.className = "res-body";

    const rows = [
      ["Name", res.fullName],
      ["Contact", res.contactNumber],
      ["Date", res.travelDate],
      ["Time", res.travelTime],
    ];

    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "row";

      const labelSpan = document.createElement("span");
      labelSpan.className = "label";
      labelSpan.textContent = label;

      const valueSpan = document.createElement("span");
      valueSpan.textContent = value;

      row.appendChild(labelSpan);
      row.appendChild(valueSpan);
      body.appendChild(row);
    });

    if (res.notes) {
      const notesRow = document.createElement("div");
      notesRow.className = "row";
      const labelSpan = document.createElement("span");
      labelSpan.className = "label";
      labelSpan.textContent = "Notes";
      const valueSpan = document.createElement("span");
      valueSpan.textContent = res.notes;
      notesRow.appendChild(labelSpan);
      notesRow.appendChild(valueSpan);
      body.appendChild(notesRow);
    }

    const footer = document.createElement("div");
    footer.className = "res-footer";

    const fareEl = document.createElement("div");
    fareEl.className = "res-fare";
    fareEl.textContent = formatPeso(res.totalFare);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => handleDeleteReservation(res.id));

    footer.appendChild(fareEl);
    footer.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);

    container.appendChild(card);
  });
}

/**
 * Delete reservation by ID
 */
function handleDeleteReservation(id) {
  const current = getReservations();
  const updated = current.filter((r) => r.id !== id);
  saveReservations(updated);
  renderReservations();
}

/**
 * Calculate and display fare based on route and seats
 */
function updateFareDisplay() {
  const routeSelect = document.getElementById("route");
  const seatsInput = document.getElementById("seats");
  const fareAmountEl = document.getElementById("fareAmount");

  const route = routeSelect.value;
  const seats = parseInt(seatsInput.value, 10) || 0;
  const baseFare = getRouteBaseFare(route);
  const discount = getDiscountPercentage();
  
  let total = baseFare * seats;
  if (discount > 0) {
    total = total * (1 - discount / 100);
  }
  
  fareAmountEl.textContent = formatPeso(total || 0);
  
  // Show discount info if premium
  if (discount > 0 && total > 0) {
    const originalTotal = baseFare * seats;
    const saved = originalTotal - total;
    fareAmountEl.innerHTML = `${formatPeso(total)} <small style="color: var(--green-dark); font-size: 0.75rem; display: block; margin-top: 0.2rem;">You save ${formatPeso(saved)} (${discount}% off)</small>`;
  }
}

/**
 * Show / hide loading overlay
 */
function setLoading(show) {
  const overlay = document.getElementById("loadingOverlay");
  if (show) {
    overlay.classList.add("active");
  } else {
    overlay.classList.remove("active");
  }
}

/**
 * Show confirmation modal with message
 */
function showConfirmationModal(message) {
  const modal = document.getElementById("confirmationModal");
  const messageEl = document.getElementById("modalMessage");
  messageEl.textContent = message;
  modal.classList.add("active");
}

/**
 * Close confirmation modal
 */
function closeModal() {
  const modal = document.getElementById("confirmationModal");
  modal.classList.remove("active");
}

/**
 * Validate form fields; returns { valid, data }
 */
function validateForm() {
  const form = document.getElementById("bookingForm");
  const fullName = form.fullName.value.trim();
  const contactNumber = form.contactNumber.value.trim();
  const travelDate = form.travelDate.value;
  const travelTime = form.travelTime.value;
  const route = form.route.value;
  const seats = form.seats.value;
  const notes = form.notes.value.trim();

  // Clear old errors
  document.querySelectorAll(".error-msg").forEach((el) => (el.textContent = ""));
  document
    .querySelectorAll("input, select, textarea")
    .forEach((el) => el.classList.remove("error"));

  let valid = true;

  function setError(fieldName, message) {
    const msgEl = document.querySelector(`.error-msg[data-for="${fieldName}"]`);
    const inputEl = document.getElementById(fieldName);
    if (msgEl) msgEl.textContent = message;
    if (inputEl) inputEl.classList.add("error");
    valid = false;
  }

  if (!fullName) {
    setError("fullName", "Name is required.");
  }

  if (!contactNumber) {
    setError("contactNumber", "Contact number is required.");
  } else if (!/^0\d{9,10}$/.test(contactNumber)) {
    setError("contactNumber", "Enter a valid PH mobile number (e.g. 09XXXXXXXXX).");
  }

  if (!travelDate) {
    setError("travelDate", "Please select a date.");
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(travelDate);
    if (selectedDate < today) {
      setError("travelDate", "Date cannot be in the past.");
    }
  }

  if (!travelTime) {
    setError("travelTime", "Please select a time.");
  }

  if (!route) {
    setError("route", "Please choose a route.");
  }

  const seatsNum = parseInt(seats, 10);
  if (!seats || Number.isNaN(seatsNum)) {
    setError("seats", "Please enter number of seats.");
  } else if (seatsNum < 1 || seatsNum > 10) {
    setError("seats", "Seats must be between 1 and 10.");
  }

  const baseFare = getRouteBaseFare(route);
  const discount = getDiscountPercentage();
  let totalFare = baseFare * (seatsNum || 0);
  
  if (discount > 0) {
    totalFare = totalFare * (1 - discount / 100);
  }

  return {
    valid,
    data: {
      fullName,
      contactNumber,
      travelDate,
      travelTime,
      route,
      seats: seatsNum,
      notes,
      totalFare: Math.round(totalFare * 100) / 100, // Round to 2 decimals
    },
  };
}

/**
 * Handle form submit
 */
function handleFormSubmit(event) {
  event.preventDefault();
  const { valid, data } = validateForm();
  if (!valid) return;

  // Show loading spinner
  setLoading(true);

  // Simulate short delay for UX
  setTimeout(() => {
    const current = getReservations();
    const newReservation = {
      id: Date.now().toString(),
      ...data,
    };

    current.push(newReservation);
    saveReservations(current);
    renderReservations();

    // Hide loading and show success modal
    setLoading(false);

    const message = `Your reservation for ${data.seats} seat${
      data.seats > 1 ? "s" : ""
    } on ${data.travelDate} at ${data.travelTime} has been recorded.`;
    showConfirmationModal(message);

    // Reset form
    document.getElementById("bookingForm").reset();
    updateFareDisplay();
  }, 800);
}

/**
 * Initialize app
 */
function init() {
  // Year in footer
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Render existing reservations
  renderReservations();
  updateFareDisplay();
  
  // Update premium badge on load
  updatePremiumBadge();

  // Form submit
  const form = document.getElementById("bookingForm");
  form.addEventListener("submit", handleFormSubmit);

  // Fare update events
  document.getElementById("route").addEventListener("change", updateFareDisplay);
  document.getElementById("seats").addEventListener("input", updateFareDisplay);

  // Hero "Book Now" scroll to booking section
  const heroBtn = document.getElementById("heroBookBtn");
  heroBtn.addEventListener("click", () => {
    const section = document.getElementById("book");
    section.scrollIntoView({ behavior: "smooth" });
  });

  // Hero "View Plans" scroll to plans section
  const viewPlansBtn = document.getElementById("viewPlansBtn");
  if (viewPlansBtn) {
    viewPlansBtn.addEventListener("click", () => {
      const section = document.getElementById("plans");
      section.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Subscription plan selection
  const selectFreeBtn = document.getElementById("selectFreeBtn");
  const selectPremiumBtn = document.getElementById("selectPremiumBtn");

  if (selectFreeBtn) {
    selectFreeBtn.addEventListener("click", () => {
      saveSubscription("free");
      showConfirmationModal("You are now on the Free Plan. Enjoy basic reservation access!");
      updateFareDisplay();
    });
  }

  if (selectPremiumBtn) {
    selectPremiumBtn.addEventListener("click", () => {
      saveSubscription("premium");
      showConfirmationModal("Welcome to Premium! You now have unlimited bookings and discounted fares (5-10% off).");
      updateFareDisplay();
    });
  }

  // Mobile menu toggle
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });

  // Close mobile menu when clicking a link
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("show");
    });
  });

  // Modal controls
  const modalClose = document.getElementById("closeModal");
  const modalOkBtn = document.getElementById("modalOkBtn");

  modalClose.addEventListener("click", closeModal);
  modalOkBtn.addEventListener("click", closeModal);

  // Close modal when clicking outside content
  document.getElementById("confirmationModal").addEventListener("click", (e) => {
    if (e.target.id === "confirmationModal") {
      closeModal();
    }
  });
}

// Run after DOM is loaded
document.addEventListener("DOMContentLoaded", init);