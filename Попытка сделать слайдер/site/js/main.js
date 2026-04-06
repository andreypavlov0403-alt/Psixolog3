/**
 * main.js — Екатерина Князькова | Психолог
 */

// ═══════════════════════════════════════════
// АВТОСКРОЛЛ К ОПЛАТЕ ПРИ ЗАГРУЗКЕ
// ═══════════════════════════════════════════
window.addEventListener('load', () => {
  const payment = document.querySelector('#payment');
  if (payment) {
    setTimeout(() => {
      payment.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  }
});

// ═══════════════════════════════════════════
// БУРГЕР-МЕНЮ
// ═══════════════════════════════════════════
const burgerBtn  = document.getElementById('burger-btn');
const mainNav    = document.getElementById('main-nav');

function openMenu() {
  burgerBtn.classList.add('open');
  mainNav.classList.add('open');
  burgerBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  burgerBtn.classList.remove('open');
  mainNav.classList.remove('open');
  burgerBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

burgerBtn.addEventListener('click', () => {
  burgerBtn.classList.contains('open') ? closeMenu() : openMenu();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

// ═══════════════════════════════════════════
// АВТОФОРМАТ ТЕЛЕФОНА
// ═══════════════════════════════════════════
const phoneInputEl = document.getElementById('phone');
phoneInputEl.addEventListener('input', function () {
  let val = this.value.replace(/\D/g, '');
  if (val.startsWith('8')) val = '7' + val.slice(1);
  if (!val.startsWith('7')) val = '7' + val;
  val = val.slice(0, 11);
  let fmt = '+7';
  if (val.length > 1) fmt += ' (' + val.slice(1, 4);
  if (val.length >= 4) fmt += ') ' + val.slice(4, 7);
  if (val.length >= 7) fmt += '-' + val.slice(7, 9);
  if (val.length >= 9) fmt += '-' + val.slice(9, 11);
  this.value = fmt;
});
phoneInputEl.addEventListener('keydown', function (e) {
  if (e.key === 'Backspace' && this.value === '+7') {
    e.preventDefault();
    this.value = '';
  }
});
phoneInputEl.addEventListener('focus', function () {
  if (!this.value) this.value = '+7 ';
});
phoneInputEl.addEventListener('blur', function () {
  if (this.value === '+7 ' || this.value === '+7') this.value = '';
});

// ═══════════════════════════════════════════
// СКРОЛЛ ДИПЛОМОВ — PDF.js превью + лайтбокс
// ═══════════════════════════════════════════
const DIPLOMAS = [
  { pdf: 'images/diploma_1.pdf', title: 'Диплом магистра с отличием — ПсковГУ, 2025' },
  { pdf: 'images/diploma_2.pdf', title: 'Диплом о профпереподготовке — Московский институт психологии, 2025' },
  { pdf: 'images/diploma_3.pdf', title: 'Диплом о профпереподготовке — Психолог-тренер, 2025' },
  { pdf: 'images/diploma_4.pdf', title: 'Master of Science — Lappeenranta University of Technology, 2009' },
  { pdf: 'images/diploma_5.pdf', title: 'Дополнительный документ' },
  { pdf: 'images/diploma_7.pdf', title: 'Сертификаты — Психотерапия взросления, 2024' },
  { pdf: 'images/diploma_8.pdf', title: 'Сертификаты — Эмоциональный интеллект и терапия чувств, 2024' },
];

const diplomaScrollEl = document.getElementById('diplomas-scroll');
const lbOverlay       = document.getElementById('diploma-lightbox');
const lbCanvas        = document.getElementById('lb-canvas');
const lbTitle         = document.getElementById('lb-title');
const lbClose         = document.getElementById('lb-close');
const lbPrev          = document.getElementById('lb-prev');
const lbNext          = document.getElementById('lb-next');

let lbCurrentIndex = 0;
let lbZoom = 1;
let lbIsDragging = false;
let lbDragStart = { x: 0, y: 0 };
let lbTranslate = { x: 0, y: 0 };

// Рендер превью в слайдере
async function renderDiplomaPreviews() {
  for (let i = 0; i < DIPLOMAS.length; i++) {
    const d = DIPLOMAS[i];
    const item = document.createElement('div');
    item.className = 'diploma-item';

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'diploma-canvas-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'diploma-canvas';
    canvasWrap.appendChild(canvas);

    const caption = document.createElement('p');
    caption.className = 'diploma-caption';
    caption.textContent = d.title;

    item.appendChild(canvasWrap);
    item.appendChild(caption);
    diplomaScrollEl.appendChild(item);

    item.addEventListener('click', () => openLightbox(i));

    try {
      const loadingTask = pdfjsLib.getDocument({ url: d.pdf, cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/', cMapPacked: true });
      const pdf  = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const targetWidth = canvasWrap.clientWidth || 280;
      const naturalVp   = page.getViewport({ scale: 1 });
      const scale       = targetWidth / naturalVp.width;
      const vp          = page.getViewport({ scale });
      canvas.width      = vp.width;
      canvas.height     = vp.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    } catch(e) {
      canvasWrap.innerHTML = '<div class="diploma-canvas-err">📄</div>';
      console.warn('PDF error:', d.pdf, e);
    }
  }
}

// Лайтбокс
async function openLightbox(index) {
  lbCurrentIndex = index;
  lbZoom = 1;
  lbTranslate = { x: 0, y: 0 };
  lbOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  await renderLightboxPage();
}

function closeLightbox() {
  lbOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

async function renderLightboxPage() {
  const d = DIPLOMAS[lbCurrentIndex];
  lbTitle.textContent = d.title;
  applyLbTransform();
  try {
    const pdf  = await pdfjsLib.getDocument(d.pdf).promise;
    const page = await pdf.getPage(1);
    const scale = Math.min(window.innerWidth * 0.9 / page.getViewport({scale:1}).width,
                           window.innerHeight * 0.85 / page.getViewport({scale:1}).height);
    const vp = page.getViewport({ scale: scale * lbZoom });
    lbCanvas.width  = vp.width;
    lbCanvas.height = vp.height;
    await page.render({ canvasContext: lbCanvas.getContext('2d'), viewport: vp }).promise;
  } catch(e) {}
}

function applyLbTransform() {
  lbCanvas.style.transform = `translate(${lbTranslate.x}px, ${lbTranslate.y}px) scale(${lbZoom})`;
}

lbClose.addEventListener('click', closeLightbox);
lbOverlay.addEventListener('click', e => { if (e.target === lbOverlay) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (lbOverlay.classList.contains('hidden')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lbPrev.click();
  if (e.key === 'ArrowRight') lbNext.click();
});

lbPrev.addEventListener('click', () => {
  lbCurrentIndex = (lbCurrentIndex - 1 + DIPLOMAS.length) % DIPLOMAS.length;
  lbZoom = 1; lbTranslate = {x:0,y:0};
  renderLightboxPage();
});
lbNext.addEventListener('click', () => {
  lbCurrentIndex = (lbCurrentIndex + 1) % DIPLOMAS.length;
  lbZoom = 1; lbTranslate = {x:0,y:0};
  renderLightboxPage();
});

// Зум колесом мыши
lbCanvas.addEventListener('wheel', e => {
  e.preventDefault();
  lbZoom = Math.min(4, Math.max(1, lbZoom + (e.deltaY < 0 ? 0.2 : -0.2)));
  if (lbZoom === 1) lbTranslate = {x:0,y:0};
  renderLightboxPage();
}, { passive: false });

// Перетаскивание при зуме
lbCanvas.addEventListener('mousedown', e => {
  if (lbZoom <= 1) return;
  lbIsDragging = true;
  lbDragStart = { x: e.clientX - lbTranslate.x, y: e.clientY - lbTranslate.y };
  lbCanvas.style.cursor = 'grabbing';
});
window.addEventListener('mousemove', e => {
  if (!lbIsDragging) return;
  lbTranslate = { x: e.clientX - lbDragStart.x, y: e.clientY - lbDragStart.y };
  applyLbTransform();
});
window.addEventListener('mouseup', () => {
  lbIsDragging = false;
  lbCanvas.style.cursor = lbZoom > 1 ? 'grab' : 'zoom-in';
});

// Тач-зум (pinch)
let lbTouches = [];
lbCanvas.addEventListener('touchstart', e => { lbTouches = Array.from(e.touches); }, { passive: true });
lbCanvas.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const prev = lbTouches;
    const curr = Array.from(e.touches);
    if (prev.length === 2) {
      const prevDist = Math.hypot(prev[0].clientX - prev[1].clientX, prev[0].clientY - prev[1].clientY);
      const currDist = Math.hypot(curr[0].clientX - curr[1].clientX, curr[0].clientY - curr[1].clientY);
      lbZoom = Math.min(4, Math.max(1, lbZoom * (currDist / prevDist)));
      if (lbZoom === 1) lbTranslate = {x:0,y:0};
      applyLbTransform();
    }
    lbTouches = curr;
  }
}, { passive: false });

// Кнопки скролла слайдера
document.getElementById('diploma-prev').addEventListener('click', () => {
  diplomaScrollEl.scrollBy({ left: -320, behavior: 'smooth' });
});
document.getElementById('diploma-next').addEventListener('click', () => {
  diplomaScrollEl.scrollBy({ left: 320, behavior: 'smooth' });
});

document.addEventListener('DOMContentLoaded', () => {
  if (typeof pdfjsLib !== 'undefined') {
    renderDiplomaPreviews();
  } else {
    window.addEventListener('load', renderDiplomaPreviews);
  }
});

// ═══════════════════════════════════════════
// ПЛАВНЫЙ СКРОЛЛ
// ═══════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ═══════════════════════════════════════════
// АКТИВНЫЙ ПУНКТ МЕНЮ ПРИ СКРОЛЛЕ
// ═══════════════════════════════════════════
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('nav a[href^="#"]');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));

// ═══════════════════════════════════════════
// ФОРМА ЗАПИСИ — 3 ШАГА
// ═══════════════════════════════════════════

// ---- РАСПИСАНИЕ (заглушка) ----
const FREE_SLOTS = {};
const BUSY_SLOTS = {};

(function generateSchedule() {
  const allTimes = ['10:00','11:30','13:00','14:30','16:00','17:30','19:00'];
  const now = new Date();
  for (let i = 1; i <= 45; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const key   = dateKey(d);
    const times = allTimes.filter(() => Math.random() > 0.25);
    if (times.length > 0) FREE_SLOTS[key] = times;
  }
})();

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ---- STATE ----
const state = {
  currentStep: 1,
  fio: '', phone: '', email: '', service: '', serviceLabel: '',
  price: 0, comment: '',
  selectedDate: null, selectedTime: null,
  calYear: new Date().getFullYear(), calMonth: new Date().getMonth(),
};

// ---- DOM refs ----
const stepPanels     = [null,
  document.getElementById('step-1'),
  document.getElementById('step-2'),
  document.getElementById('step-3'),
];
const stepIndicators = [null,
  document.getElementById('step-indicator-1'),
  document.getElementById('step-indicator-2'),
  document.getElementById('step-indicator-3'),
];

const fioInput      = document.getElementById('fio');
const phoneInput    = document.getElementById('phone');
const emailInput    = document.getElementById('email');
const serviceSelect = document.getElementById('service');
const requestTA     = document.getElementById('request');

const calMonthLabel    = document.getElementById('cal-month-label');
const calGrid          = document.getElementById('calendar-grid');
const timeSlotsWrap    = document.getElementById('time-slots-wrap');
const timeSlotsCont    = document.getElementById('time-slots');
const slotsHint        = timeSlotsWrap.querySelector('.slots-hint');
const selectedSlotInfo = document.getElementById('selected-slot-info');
const selectedSlotText = document.getElementById('selected-slot-text');

const btnStep1   = document.getElementById('btn-step1');
const btnStep2   = document.getElementById('btn-step2');
const btnBack1   = document.getElementById('btn-back1');
const btnBack2   = document.getElementById('btn-back2');


const sumFio     = document.getElementById('sum-fio');
const sumPhone   = document.getElementById('sum-phone');
const sumService = document.getElementById('sum-service');
const sumSlot    = document.getElementById('sum-slot');
const sumPrice   = document.getElementById('sum-price');

const successModal = document.getElementById('success-modal');
const modalClose   = document.getElementById('modal-close');
const successText  = document.getElementById('success-text');

// ---- Навигация по шагам ----
function goToStep(n) {
  stepPanels.forEach((p, i) => { if (p) p.classList.toggle('hidden', i !== n); });
  stepIndicators.forEach((ind, i) => {
    if (!ind) return;
    ind.classList.remove('active', 'done');
    if (i === n) ind.classList.add('active');
    else if (i < n) ind.classList.add('done');
  });
  state.currentStep = n;
}

// ---- Валидация шага 1 ----
function validateStep1() {
  let ok = true;

  const fioVal   = fioInput.value.trim();
  const phoneVal = phoneInput.value.trim();
  const emailVal = emailInput.value.trim();
  const svcVal   = serviceSelect.value;

  const fioErr = document.getElementById('fio-error');
  if (!fioVal || fioVal.split(' ').filter(Boolean).length < 2) {
    fioInput.classList.add('error'); fioErr.classList.add('visible'); ok = false;
  } else {
    fioInput.classList.remove('error'); fioErr.classList.remove('visible');
  }

  const phoneErr  = document.getElementById('phone-error');
  const phoneClean = phoneVal.replace(/\D/g,'');
  if (!phoneClean || phoneClean.length < 10) {
    phoneInput.classList.add('error'); phoneErr.classList.add('visible'); ok = false;
  } else {
    phoneInput.classList.remove('error'); phoneErr.classList.remove('visible');
  }

  const emailErr = document.getElementById('email-error');
  if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    emailInput.classList.add('error'); emailErr.classList.add('visible'); ok = false;
  } else {
    emailInput.classList.remove('error'); emailErr.classList.remove('visible');
  }

  const svcErr = document.getElementById('service-error');
  if (!svcVal) {
    serviceSelect.classList.add('error'); svcErr.classList.add('visible'); ok = false;
  } else {
    serviceSelect.classList.remove('error'); svcErr.classList.remove('visible');
  }

  return ok;
}

btnStep1.addEventListener('click', () => {
  if (!validateStep1()) return;
  const opt = serviceSelect.options[serviceSelect.selectedIndex];
  state.fio          = fioInput.value.trim();
  state.phone        = phoneInput.value.trim();
  state.email        = emailInput.value.trim();
  state.service      = serviceSelect.value;
  state.serviceLabel = opt.text;
  state.price        = parseInt(opt.dataset.price || 0, 10);
  state.comment      = requestTA.value.trim();
  goToStep(2);
  renderCalendar();
});

btnBack1.addEventListener('click', () => goToStep(1));

btnStep2.addEventListener('click', () => {
  if (!state.selectedDate || !state.selectedTime) return;
  fillSummary();
  goToStep(3);
});

btnBack2.addEventListener('click', () => goToStep(2));

// ---- Календарь ----
const RU_MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                   'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const RU_DOW    = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

document.getElementById('cal-prev').addEventListener('click', () => {
  state.calMonth--;
  if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
  renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
  state.calMonth++;
  if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
  renderCalendar();
});

function renderCalendar() {
  const year = state.calYear, month = state.calMonth;
  calMonthLabel.textContent = `${RU_MONTHS[month]} ${year}`;
  calGrid.innerHTML = '';

  RU_DOW.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-name';
    el.textContent = d;
    calGrid.appendChild(el);
  });

  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);

  for (let i = 0; i < startDow; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    calGrid.appendChild(el);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d   = new Date(year, month, day);
    const key = dateKey(d);
    const el  = document.createElement('div');
    el.textContent = day;

    const isPast      = d < today;
    const isToday     = d.getTime() === today.getTime();
    const isAvailable = !isPast && FREE_SLOTS[key] && FREE_SLOTS[key].length > 0;
    const isSelected  = state.selectedDate && dateKey(state.selectedDate) === key;

    el.className = 'cal-day';
    if (isPast)           el.classList.add('past');
    else if (isAvailable) el.classList.add('available');
    if (isToday)          el.classList.add('today');
    if (isSelected)       el.classList.add('selected');

    if (isAvailable) el.addEventListener('click', () => selectDate(d));
    calGrid.appendChild(el);
  }

  if (state.selectedDate) renderTimeSlots(state.selectedDate);
}

function selectDate(d) {
  state.selectedDate = d;
  state.selectedTime = null;
  btnStep2.disabled  = true;
  selectedSlotInfo.classList.add('hidden');
  renderCalendar();
  renderTimeSlots(d);
}

function renderTimeSlots(d) {
  const key   = dateKey(d);
  const slots = FREE_SLOTS[key] || [];
  const busy  = BUSY_SLOTS[key] || [];

  if (slots.length === 0) {
    slotsHint.style.display = 'block';
    slotsHint.textContent   = 'На выбранную дату нет свободных слотов';
  } else {
    slotsHint.style.display = 'none';
  }

  timeSlotsCont.innerHTML = '';
  slots.forEach(time => {
    const isBusy = busy.includes(time);
    const btn    = document.createElement('button');
    btn.className   = 'time-slot' + (isBusy ? ' busy' : '');
    btn.textContent = time;
    btn.disabled    = isBusy;
    if (state.selectedTime === time) btn.classList.add('selected');

    if (!isBusy) {
      btn.addEventListener('click', () => {
        state.selectedTime = time;
        document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        btnStep2.disabled = false;
        const dateStr = d.toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' });
        selectedSlotText.textContent = `${dateStr} в ${time}`;
        selectedSlotInfo.classList.remove('hidden');
      });
    }
    timeSlotsCont.appendChild(btn);
  });
}

// ---- Итог (шаг 3) ----
function fillSummary() {
  sumFio.textContent   = state.fio;
  sumPhone.textContent = state.phone;
  sumService.textContent = state.serviceLabel;
  const dateStr = state.selectedDate.toLocaleDateString('ru-RU', {
    weekday:'long', day:'numeric', month:'long'
  });
  sumSlot.textContent  = `${dateStr} в ${state.selectedTime}`;
  sumPrice.textContent = state.price ? `${state.price.toLocaleString('ru-RU')} ₽` : '—';
}

// ---- Оплата ЮКасса ----
// TODO: интеграция YooKassa Checkout Widget
// 1. Добавить в <head>: <script src="https://yookassa.ru/checkout-widget/v1/checkout-widget.js">
// 2. Создать платёж на сервере: POST https://api.yookassa.ru/v3/payments
//    Authorization: Basic base64(shopId:secretKey)
//    Body: { amount: { value: "3500.00", currency: "RUB" }, confirmation: { type: "embedded" } }
// 3. Получить confirmation_token, передать в виджет:
//    const checkout = new window.YooMoneyCheckoutWidget({ confirmation_token: token })
//    checkout.render('yoo-payment-widget')

const yooPayBtn = document.getElementById('yoo-pay-btn');
yooPayBtn.addEventListener('click', () => {
  successText.textContent =
    `Запись на ${state.serviceLabel.split('—')[0].trim()} подтверждена. ` +
    `Ждём вас: ${sumSlot.textContent}. Подтверждение придёт в Telegram.`;
  successModal.classList.remove('hidden');
});

// ---- Модальное окно — закрытие ----
modalClose.addEventListener('click', () => {
  successModal.classList.add('hidden');
  fioInput.value = ''; phoneInput.value = ''; emailInput.value = '';
  serviceSelect.value = ''; requestTA.value = '';
  Object.assign(state, {
    fio:'', phone:'', email:'', service:'', serviceLabel:'',
    price:0, comment:'', selectedDate:null, selectedTime:null,
    calYear: new Date().getFullYear(), calMonth: new Date().getMonth(),
  });
  selectedSlotInfo.classList.add('hidden');
  btnStep2.disabled = true;
  goToStep(1);
});

successModal.addEventListener('click', e => {
  if (e.target === successModal) modalClose.click();
});
