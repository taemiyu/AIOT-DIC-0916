/**
 * Personal Hub & Dynamic Clock Center
 * Clean Vanilla JavaScript Implementation
 */

// ==========================================================================
// State & Storage Keys
// ==========================================================================
const STORAGE_KEYS = {
  USER_NAME: 'personal_hub_username',
  TIME_FORMAT: 'personal_hub_time_format', // '12' or '24'
  FOCUS_TEXT: 'personal_hub_focus_text',
  FOCUS_DONE: 'personal_hub_focus_done'
};

const DEFAULT_NAME = 'Chou Yu';

// Curated Wisdom & Sparks
const QUOTES = [
  { text: "Time is what we want most, but what we use worst.", author: "William Penn" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Simplicity is the prerequisite for reliability.", author: "Edsger W. Dijkstra" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" }
];

// DOM Elements
const elements = {
  // Name & Greeting
  userName: document.getElementById('user-name'),
  nameInput: document.getElementById('name-input'),
  editNameBtn: document.getElementById('edit-name-btn'),
  greetingIcon: document.getElementById('greeting-icon'),
  greetingPeriod: document.getElementById('greeting-period'),
  dynamicSubtitle: document.getElementById('dynamic-subtitle'),
  
  // Clock
  clockHours: document.getElementById('clock-hours'),
  clockMinutes: document.getElementById('clock-minutes'),
  clockSeconds: document.getElementById('clock-seconds'),
  clockPeriod: document.getElementById('clock-period'),
  secondsProgressBar: document.getElementById('seconds-progress-bar'),
  secondsCounter: document.getElementById('seconds-counter'),
  formatToggle: document.getElementById('format-toggle'),
  formatLabel: document.getElementById('format-label'),
  tzText: document.getElementById('tz-text'),
  copyTimeBtn: document.getElementById('copy-time-btn'),

  // Calendar
  dateWeekday: document.getElementById('date-weekday'),
  dateCalendar: document.getElementById('date-calendar'),
  dayOfYearChip: document.getElementById('day-of-year-chip'),
  weekChip: document.getElementById('week-chip'),

  // Focus
  focusInput: document.getElementById('focus-input'),
  saveFocusBtn: document.getElementById('save-focus-btn'),
  focusDisplayBox: document.getElementById('focus-display-box'),
  savedFocusText: document.getElementById('saved-focus-text'),
  focusCheckbox: document.getElementById('focus-checkbox'),
  clearFocusBtn: document.getElementById('clear-focus-btn'),
  focusInputWrapper: document.querySelector('.focus-input-wrapper'),

  // Quotes
  quoteText: document.getElementById('quote-text'),
  quoteAuthor: document.getElementById('quote-author'),
  refreshQuoteBtn: document.getElementById('refresh-quote-btn'),

  // Toast
  toast: document.getElementById('toast'),
  toastMsg: document.getElementById('toast-msg')
};

// ==========================================================================
// Toast Notifications
// ==========================================================================
let toastTimer = null;
function showToast(message) {
  if (!elements.toast || !elements.toastMsg) return;
  elements.toastMsg.textContent = message;
  elements.toast.classList.add('show');
  
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 2600);
}

// ==========================================================================
// Name Editing & Persistence
// ==========================================================================
function initNameSystem() {
  let savedName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
  if (!savedName || savedName === 'Alex Morgan' || savedName === 'Yu Chou') {
    savedName = DEFAULT_NAME;
    localStorage.setItem(STORAGE_KEYS.USER_NAME, DEFAULT_NAME);
  }
  elements.userName.textContent = savedName;

  function enterEditMode() {
    elements.nameInput.value = elements.userName.textContent;
    elements.userName.classList.add('hidden');
    elements.nameInput.classList.remove('hidden');
    elements.nameInput.focus();
    elements.nameInput.select();
  }

  function commitNameEdit() {
    const trimmed = elements.nameInput.value.trim();
    const finalName = trimmed.length > 0 ? trimmed : DEFAULT_NAME;
    elements.userName.textContent = finalName;
    localStorage.setItem(STORAGE_KEYS.USER_NAME, finalName);
    elements.nameInput.classList.add('hidden');
    elements.userName.classList.remove('hidden');
    showToast(`Name saved as "${finalName}"`);
  }

  function cancelNameEdit() {
    elements.nameInput.classList.add('hidden');
    elements.userName.classList.remove('hidden');
  }

  elements.userName.addEventListener('click', enterEditMode);
  elements.userName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      enterEditMode();
    }
  });

  elements.editNameBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (elements.nameInput.classList.contains('hidden')) {
      enterEditMode();
    } else {
      commitNameEdit();
    }
  });

  elements.nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitNameEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelNameEdit();
    }
  });

  elements.nameInput.addEventListener('blur', () => {
    // Slight timeout to avoid race with button clicks
    setTimeout(commitNameEdit, 150);
  });
}

// ==========================================================================
// Real-Time Clock & Timezone
// ==========================================================================
let is24HourFormat = localStorage.getItem(STORAGE_KEYS.TIME_FORMAT) === '24';

function updateTimeFormatDisplay() {
  elements.formatLabel.textContent = is24HourFormat ? '24h' : '12h';
  localStorage.setItem(STORAGE_KEYS.TIME_FORMAT, is24HourFormat ? '24' : '12');
}

function calculateDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function calculateWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function updateGreeting(hours) {
  let period = 'Good day';
  let icon = '✨';
  let subtitle = 'Welcome to your personal space. Take a breath and make today remarkable.';

  if (hours >= 5 && hours < 12) {
    period = 'Good morning';
    icon = '🌅';
    subtitle = 'A fresh dawn is here. Let\'s make today purposeful, focused, and inspiring.';
  } else if (hours >= 12 && hours < 17) {
    period = 'Good afternoon';
    icon = '☀️';
    subtitle = 'Keep up the momentum. Remember to stay hydrated and celebrate small wins.';
  } else if (hours >= 17 && hours < 22) {
    period = 'Good evening';
    icon = '🌆';
    subtitle = 'The evening lights are on. Wrap up your goals and unwind with clarity.';
  } else {
    period = 'Good night';
    icon = '🌙';
    subtitle = 'The world is quiet. Rest, restore your mind, and prepare for tomorrow.';
  }

  elements.greetingPeriod.textContent = period;
  elements.greetingIcon.textContent = icon;
  elements.dynamicSubtitle.textContent = subtitle;
}

function updateClock() {
  const now = new Date();
  const rawHours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ms = now.getMilliseconds();

  // Greeting
  updateGreeting(rawHours);

  // Hours formatting
  let displayHours = rawHours;
  let ampm = '';

  if (is24HourFormat) {
    displayHours = String(rawHours).padStart(2, '0');
    elements.clockPeriod.textContent = '24H';
  } else {
    ampm = rawHours >= 12 ? 'PM' : 'AM';
    displayHours = rawHours % 12;
    displayHours = displayHours ? displayHours : 12; // 0 becomes 12
    displayHours = String(displayHours).padStart(2, '0');
    elements.clockPeriod.textContent = ampm;
  }

  const displayMinutes = String(minutes).padStart(2, '0');
  const displaySeconds = String(seconds).padStart(2, '0');

  // Update DOM digits
  elements.clockHours.textContent = displayHours;
  elements.clockMinutes.textContent = displayMinutes;
  elements.clockSeconds.textContent = displaySeconds;

  // Seconds Progress Bar & Counter
  const progressPercent = ((seconds + ms / 1000) / 60) * 100;
  elements.secondsProgressBar.style.width = `${progressPercent.toFixed(2)}%`;
  elements.secondsCounter.textContent = `${displaySeconds}s`;

  // Date Information
  const weekdayOptions = { weekday: 'long' };
  const calendarOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  elements.dateWeekday.textContent = now.toLocaleDateString(undefined, weekdayOptions);
  elements.dateCalendar.textContent = now.toLocaleDateString(undefined, calendarOptions);

  // Day & Week metrics
  elements.dayOfYearChip.textContent = `Day ${calculateDayOfYear(now)}`;
  elements.weekChip.textContent = `Week ${calculateWeekNumber(now)}`;
}

function initTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMinutes = -new Date().getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const offsetString = `UTC${sign}${offsetHours}`;
    elements.tzText.textContent = `${offsetString} • ${tz.split('/')[1] || tz}`;
  } catch (e) {
    elements.tzText.textContent = 'UTC Local';
  }
}

function initClockControls() {
  updateTimeFormatDisplay();

  elements.formatToggle.addEventListener('click', () => {
    is24HourFormat = !is24HourFormat;
    updateTimeFormatDisplay();
    updateClock();
    showToast(`Switched to ${is24HourFormat ? '24-hour' : '12-hour'} format`);
  });

  elements.copyTimeBtn.addEventListener('click', async () => {
    const now = new Date();
    const timeString = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    try {
      await navigator.clipboard.writeText(timeString);
      showToast(`Copied timestamp: ${timeString}`);
    } catch (err) {
      // Fallback
      showToast(`Current time: ${timeString}`);
    }
  });

  // Start smooth clock ticking
  updateClock();
  setInterval(updateClock, 100);
}

// ==========================================================================
// Today's Focus Widget
// ==========================================================================
function initFocusSystem() {
  const savedFocus = localStorage.getItem(STORAGE_KEYS.FOCUS_TEXT);
  const isDone = localStorage.getItem(STORAGE_KEYS.FOCUS_DONE) === 'true';

  function renderFocus(text, done) {
    if (text) {
      elements.savedFocusText.textContent = text;
      elements.focusCheckbox.checked = done;
      if (done) {
        elements.savedFocusText.classList.add('completed');
      } else {
        elements.savedFocusText.classList.remove('completed');
      }
      elements.focusDisplayBox.classList.remove('hidden');
      elements.focusInputWrapper.classList.add('hidden');
    } else {
      elements.focusDisplayBox.classList.add('hidden');
      elements.focusInputWrapper.classList.remove('hidden');
      elements.focusInput.value = '';
    }
  }

  function saveFocus() {
    const text = elements.focusInput.value.trim();
    if (text) {
      localStorage.setItem(STORAGE_KEYS.FOCUS_TEXT, text);
      localStorage.setItem(STORAGE_KEYS.FOCUS_DONE, 'false');
      renderFocus(text, false);
      showToast('Today\'s focus locked in! 🎯');
    }
  }

  elements.saveFocusBtn.addEventListener('click', saveFocus);
  elements.focusInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveFocus();
    }
  });

  elements.focusCheckbox.addEventListener('change', () => {
    const checked = elements.focusCheckbox.checked;
    localStorage.setItem(STORAGE_KEYS.FOCUS_DONE, String(checked));
    if (checked) {
      elements.savedFocusText.classList.add('completed');
      showToast('Focus completed! Fantastic job! 🎉');
    } else {
      elements.savedFocusText.classList.remove('completed');
    }
  });

  elements.clearFocusBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.FOCUS_TEXT);
    localStorage.removeItem(STORAGE_KEYS.FOCUS_DONE);
    renderFocus(null, false);
    showToast('Focus cleared');
  });

  renderFocus(savedFocus, isDone);
}

// ==========================================================================
// Quotes & Inspiration
// ==========================================================================
let currentQuoteIdx = 0;

function setQuote(idx) {
  const quote = QUOTES[idx];
  elements.quoteText.style.opacity = '0';
  elements.quoteAuthor.style.opacity = '0';

  setTimeout(() => {
    elements.quoteText.textContent = `"${quote.text}"`;
    elements.quoteAuthor.textContent = `— ${quote.author}`;
    elements.quoteText.style.opacity = '1';
    elements.quoteAuthor.style.opacity = '1';
  }, 150);
}

function initQuotesSystem() {
  currentQuoteIdx = Math.floor(Math.random() * QUOTES.length);
  setQuote(currentQuoteIdx);

  elements.refreshQuoteBtn.addEventListener('click', () => {
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * QUOTES.length);
    } while (nextIdx === currentQuoteIdx && QUOTES.length > 1);
    currentQuoteIdx = nextIdx;
    setQuote(currentQuoteIdx);
  });
}

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initNameSystem();
  initTimezone();
  initClockControls();
  initFocusSystem();
  initQuotesSystem();
});
