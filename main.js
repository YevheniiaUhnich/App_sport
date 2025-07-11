// Application state
let exercises = [];
let runningTime = 0;
let runningHistory = {}; // Store running data by date

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  updateCurrentDate();
  loadFromStorage();
  renderExercises();
  updateStats();
  drawRunningChart();
}

// Date functionality
function updateCurrentDate() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const dateString = now.toLocaleDateString("uk-UA", options);
  document.getElementById("currentDate").textContent = dateString;
}

function formatDate(date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD format
}

function getDateString(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDate(date);
}

// Running functionality
function completeRunning() {
  const timeInput = document.getElementById("runningTime");
  const time = parseInt(timeInput.value) || 0;

  if (time > 0) {
    runningTime = time;

    // Save to running history
    const today = getDateString();
    runningHistory[today] = (runningHistory[today] || 0) + time;

    saveToStorage();
    updateStats();
    drawRunningChart();

    // Add completion animation
    const button = event.target;
    button.style.background = "#00ff88";
    button.innerHTML = "✓";

    setTimeout(() => {
      button.style.background = "";
      button.innerHTML = "✓";
    }, 1000);

    showNotification("Біг виконано! 🏃‍♂️");
    timeInput.value = ""; // Clear input after completion
  } else {
    showNotification("Введіть час виконання!", "error");
  }
}

// Running chart functionality
function drawRunningChart() {
  const canvas = document.getElementById("runningChart");
  const ctx = canvas.getContext("2d");

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Get last 7 days data
  const chartData = [];
  const labels = [];

  for (let i = 6; i >= 0; i--) {
    const dateStr = getDateString(i);
    const date = new Date();
    date.setDate(date.getDate() - i);

    chartData.push(runningHistory[dateStr] || 0);
    labels.push(date.toLocaleDateString("uk-UA", { weekday: "short" }));
  }

  // Chart dimensions
  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;
  const maxValue = Math.max(...chartData, 30); // Minimum scale of 30 minutes

  // Draw grid lines
  ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
  ctx.lineWidth = 1;

  // Horizontal grid lines
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + chartWidth, y);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = "#888888";
    ctx.font = "12px Segoe UI";
    ctx.textAlign = "right";
    const value = Math.round(maxValue - (maxValue / 5) * i);
    ctx.fillText(value + " хв", padding - 10, y + 4);
  }

  // Vertical grid lines and X-axis labels
  for (let i = 0; i < 7; i++) {
    const x = padding + (chartWidth / 6) * i;
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, padding + chartHeight);
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = "#888888";
    ctx.font = "12px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x, padding + chartHeight + 20);
  }

  // Draw chart line
  if (chartData.some((value) => value > 0)) {
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 3;
    ctx.beginPath();

    let firstPoint = true;
    for (let i = 0; i < chartData.length; i++) {
      const x = padding + (chartWidth / 6) * i;
      const y = padding + chartHeight - (chartData[i] / maxValue) * chartHeight;

      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }

      // Draw data points
      ctx.fillStyle = "#00ffff";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.stroke();
  }

  // Chart title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText("Хвилини бігу за останні 7 днів", canvas.width / 2, 20);
}

// Exercise form functionality
function showAddForm() {
  const form = document.getElementById("addForm");
  form.classList.add("active");
  document.getElementById("exerciseName").focus();
}

function hideAddForm() {
  const form = document.getElementById("addForm");
  form.classList.remove("active");
  clearForm();
}

function clearForm() {
  document.getElementById("exerciseName").value = "";
  document.getElementById("exerciseReps").value = "";
  document.getElementById("exerciseSets").value = "";
  document.getElementById("exerciseTime").value = "";
}

function addExercise() {
  const nameInput = document.getElementById("exerciseName");
  const repsInput = document.getElementById("exerciseReps");
  const setsInput = document.getElementById("exerciseSets");
  const timeInput = document.getElementById("exerciseTime");

  const name = nameInput.value.trim();
  const reps = parseInt(repsInput.value) || 0;
  const sets = parseInt(setsInput.value) || 0;
  const time = parseInt(timeInput.value) || 0;

  if (name && (reps > 0 || sets > 0 || time > 0)) {
    const exercise = {
      id: Date.now(),
      name: name,
      reps: reps,
      sets: sets,
      time: time,
      completed: false,
      date: new Date().toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };

    exercises.push(exercise);
    saveToStorage();
    renderExercises();
    updateStats();
    hideAddForm();

    showNotification("Вправу додано! 💪");
  } else {
    showNotification(
      "Заповніть назву та принаймні одне поле (рази/серії/час)!",
      "error"
    );
  }
}

// Exercise management
function deleteExercise(id) {
  if (confirm("Ви впевнені, що хочете видалити цю вправу?")) {
    exercises = exercises.filter((exercise) => exercise.id !== id);
    saveToStorage();
    renderExercises();
    updateStats();
    showNotification("Вправу видалено!");
  }
}

function editExercise(id) {
  const exercise = exercises.find((ex) => ex.id === id);
  if (!exercise) return;

  // Hide any existing edit forms
  document.querySelectorAll(".edit-form").forEach((form) => form.remove());

  // Find the exercise card
  const exerciseCard = document.querySelector(`[data-exercise-id="${id}"]`);
  if (!exerciseCard) return;

  // Create edit form
  const editForm = document.createElement("div");
  editForm.className = "edit-form";
  editForm.innerHTML = `
        <div class="edit-form-content">
            <input type="text" id="editName${id}" value="${
    exercise.name
  }" placeholder="Назва вправи" />
            <div class="edit-form-row">
                <input type="number" id="editReps${id}" value="${
    exercise.reps || ""
  }" placeholder="Рази" min="0" />
                <input type="number" id="editSets${id}" value="${
    exercise.sets || ""
  }" placeholder="Серії" min="0" />
                <input type="number" id="editTime${id}" value="${
    exercise.time || ""
  }" placeholder="Час (хв)" min="0" />
            </div>
            <div class="edit-form-actions">
                <button class="btn-save" onclick="saveExerciseEdit(${id})">Зберегти</button>
                <button class="btn-cancel" onclick="cancelExerciseEdit(${id})">Скасувати</button>
            </div>
        </div>
    `;

  // Insert edit form after the exercise card
  exerciseCard.insertAdjacentElement("afterend", editForm);

  // Focus on name input
  document.getElementById(`editName${id}`).focus();

  // Add slide down animation
  editForm.style.animation = "slideDown 0.3s ease";
}

function saveExerciseEdit(id) {
  const exercise = exercises.find((ex) => ex.id === id);
  if (!exercise) return;

  const nameInput = document.getElementById(`editName${id}`);
  const repsInput = document.getElementById(`editReps${id}`);
  const setsInput = document.getElementById(`editSets${id}`);
  const timeInput = document.getElementById(`editTime${id}`);

  const name = nameInput.value.trim();
  const reps = parseInt(repsInput.value) || 0;
  const sets = parseInt(setsInput.value) || 0;
  const time = parseInt(timeInput.value) || 0;

  if (name && (reps > 0 || sets > 0 || time > 0)) {
    exercise.name = name;
    exercise.reps = reps;
    exercise.sets = sets;
    exercise.time = time;

    saveToStorage();
    renderExercises();
    updateStats();

    showNotification("Вправу оновлено! ✏️");
  } else {
    showNotification(
      "Заповніть назву та принаймні одне поле (рази/серії/час)!",
      "error"
    );
  }
}

function cancelExerciseEdit(id) {
  const editForm = document.querySelector(".edit-form");
  if (editForm) {
    editForm.style.animation = "slideUp 0.3s ease";
    setTimeout(() => {
      editForm.remove();
    }, 300);
  }
}
function completeExercise(id) {
  const exercise = exercises.find((ex) => ex.id === id);
  if (exercise) {
    exercise.completed = !exercise.completed;
    saveToStorage();
    renderExercises();
    updateStats();

    const message = exercise.completed
      ? "Вправу виконано! ✅"
      : "Вправу позначено як невиконану";
    showNotification(message);
  }
}

// Rendering functions
function renderExercises() {
  const container = document.getElementById("exercisesList");
  container.innerHTML = "";

  exercises.forEach((exercise) => {
    const exerciseElement = createExerciseElement(exercise);
    container.appendChild(exerciseElement);
  });
}

function createExerciseElement(exercise) {
  const div = document.createElement("div");
  div.className = `exercise-card ${exercise.completed ? "completed" : ""}`;
  div.setAttribute("data-exercise-id", exercise.id);

  // Create exercise details string
  const details = [];
  if (exercise.reps > 0) details.push(`${exercise.reps} разів`);
  if (exercise.sets > 0) details.push(`${exercise.sets} серій`);
  if (exercise.time > 0) details.push(`${exercise.time} хв`);
  const detailsText = details.join(" • ");

  div.innerHTML = `
        <div class="exercise-info">
            <div class="exercise-main">
                <span class="exercise-name ${
                  exercise.completed ? "completed" : ""
                }">${exercise.name}</span>
                <span class="exercise-details">${detailsText}</span>
                <span class="exercise-date">📅 ${exercise.date}</span>
            </div>
        </div>
        <div class="exercise-actions">
            <button class="btn-complete" onclick="completeExercise(${
              exercise.id
            })" title="Позначити як виконано">
                ${exercise.completed ? "✓" : "○"}
            </button>
            <button class="btn-edit" onclick="editExercise(${
              exercise.id
            })" title="Редагувати">
                ✏️
            </button>
            <button class="btn-delete" onclick="deleteExercise(${
              exercise.id
            })" title="Видалити">
                ✕
            </button>
        </div>
    `;

  // Add completed styling
  if (exercise.completed) {
    div.style.opacity = "0.7";
    div.style.border = "2px solid #00ff88";
    const nameSpan = div.querySelector(".exercise-name");
    nameSpan.style.textDecoration = "line-through";
    nameSpan.style.color = "#00ff88";
  }

  return div;
}

// Counter animation function
function animateCounter(element, start, end, duration = 800, suffix = "") {
  const startTime = performance.now();
  const range = end - start;

  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(start + range * easeOutQuart);

    element.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = end + suffix; // Ensure final value is exact
    }
  }

  requestAnimationFrame(updateCounter);
}

// Statistics with counter animation - ВИПРАВЛЕНО
function updateStats() {
  const totalExercisesElement = document.getElementById("totalExercises");
  const totalTimeElement = document.getElementById("totalTime");
  const totalRepsElement = document.getElementById("totalReps");
  const totalSetsElement = document.getElementById("totalSets");

  // Рахуємо тільки виконані вправи
  const completedExercises = exercises.filter((ex) => ex.completed);

  // Загальна кількість виконаних вправ
  const totalExercisesCount = completedExercises.length;

  // Загальний час виконаних вправ
  const totalExerciseTime = completedExercises.reduce(
    (sum, ex) => sum + (ex.time || 0),
    0
  );

  // Загальна кількість повторень виконаних вправ
  const totalReps = completedExercises.reduce(
    (sum, ex) => sum + (ex.reps || 0),
    0
  );

  // Загальна кількість серій виконаних вправ
  const totalSets = completedExercises.reduce(
    (sum, ex) => sum + (ex.sets || 0),
    0
  );

  // Додаємо час бігу за сьогодні
  const today = getDateString();
  const todayRunningTime = runningHistory[today] || 0;
  const grandTotalTime = totalExerciseTime + todayRunningTime;

  // Додаємо біг до загальної кількості вправ, якщо він був виконаний сьогодні
  const grandTotalExercises =
    totalExercisesCount + (todayRunningTime > 0 ? 1 : 0);

  // Get current values for animation
  const currentExercises = parseInt(totalExercisesElement.textContent) || 0;
  const currentTimeText = totalTimeElement.textContent || "0 хв";
  const currentTime = parseInt(currentTimeText.replace(" хв", "")) || 0;
  const currentReps = parseInt(totalRepsElement.textContent) || 0;
  const currentSets = parseInt(totalSetsElement.textContent) || 0;

  // Only animate if values changed
  if (currentExercises !== grandTotalExercises) {
    animateCounter(
      totalExercisesElement,
      currentExercises,
      grandTotalExercises,
      800
    );
  }

  if (currentTime !== grandTotalTime) {
    animateCounter(totalTimeElement, currentTime, grandTotalTime, 800, " хв");
  }

  if (currentReps !== totalReps) {
    animateCounter(totalRepsElement, currentReps, totalReps, 800);
  }

  if (currentSets !== totalSets) {
    animateCounter(totalSetsElement, currentSets, totalSets, 800);
  }

  // Add pulse effect to stat cards when values change
  if (
    currentExercises !== grandTotalExercises ||
    currentTime !== grandTotalTime ||
    currentReps !== totalReps ||
    currentSets !== totalSets
  ) {
    const statCards = document.querySelectorAll(".stat-card");
    statCards.forEach((card) => {
      card.style.animation = "none";
      card.offsetHeight; // Trigger reflow
      card.style.animation = "statPulse 0.6s ease-out";
    });

    // Add glow effect to numbers
    const statValues = document.querySelectorAll(".stat-value");
    statValues.forEach((value) => {
      value.classList.add("counting");
      setTimeout(() => {
        value.classList.remove("counting");
      }, 800);
    });
  }
}

// Storage functionality
function saveToStorage() {
  const data = {
    exercises: exercises,
    runningTime: runningTime,
    runningHistory: runningHistory,
    date: new Date().toDateString(),
  };
  localStorage.setItem("athleteDiary", JSON.stringify(data));
}

function loadFromStorage() {
  const saved = localStorage.getItem("athleteDiary");
  if (saved) {
    const data = JSON.parse(saved);
    const today = new Date().toDateString();

    // Always load running history (persistent across days)
    runningHistory = data.runningHistory || {};

    // Load exercises only if it's the same day
    if (data.date === today) {
      exercises = data.exercises || [];
      runningTime = data.runningTime || 0;

      // Update running time display
      if (runningTime > 0) {
        document.getElementById("runningTime").value = runningTime;
      }
    } else {
      // New day, reset daily data but keep history
      exercises = [];
      runningTime = 0;
      saveToStorage();
    }
  }
}

// Notification system
function showNotification(message, type = "success") {
  // Remove existing notifications
  const existing = document.querySelector(".notification");
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Styling
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === "error" ? "#ff4444" : "#00ff88"};
        color: #0a0a0a;
        padding: 15px 20px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Add CSS animations for notifications and stats
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateY(0);
            max-height: 200px;
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
            max-height: 0;
        }
    }
    
    @keyframes statPulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
            border-color: #00ffff;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }
        100% {
            transform: scale(1);
        }
    }
    
    .stat-value {
        transition: color 0.3s ease;
    }
    
    .stat-card:hover .stat-value {
        color: #00ff88 !important;
        text-shadow: 0 0 10px #00ff88;
    }
    
    .stat-value.counting {
        animation: numberGlow 0.8s ease-out;
    }
    
    @keyframes numberGlow {
        0% {
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
        }
        50% {
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.6);
        }
        100% {
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
        }
    }
`;
document.head.appendChild(style);

// Keyboard shortcuts
document.addEventListener("keydown", function (e) {
  // Ctrl + N to add new exercise
  if (e.ctrlKey && e.key === "n") {
    e.preventDefault();
    showAddForm();
  }

  // Escape to close form
  if (e.key === "Escape") {
    hideAddForm();
  }

  // Enter to save when in form
  if (
    e.key === "Enter" &&
    document.getElementById("addForm").classList.contains("active")
  ) {
    if (
      e.target.id === "exerciseName" ||
      e.target.id === "exerciseReps" ||
      e.target.id === "exerciseSets" ||
      e.target.id === "exerciseTime"
    ) {
      addExercise();
    }
  }
});

// Make functions globally available
window.showAddForm = showAddForm;
window.hideAddForm = hideAddForm;
window.addExercise = addExercise;
window.deleteExercise = deleteExercise;
window.editExercise = editExercise;
window.saveExerciseEdit = saveExerciseEdit;
window.cancelExerciseEdit = cancelExerciseEdit;
window.completeExercise = completeExercise;
window.completeRunning = completeRunning;
