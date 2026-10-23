// Базовая ссылка вашей публичной таблицы
const baseCsvUrl = "https://google.com?"; 

let allEvents = [];
let currentDate = new Date(); 

const clean = str => str ? str.replace(/^"|"$/g, '').trim() : '';

// Исправленная функция нормализации дат
function normalizeDate(rawDate) {
  if (!rawDate) return '';
  
  // Если дата введена через точки (например, 28.10.2026 или 1.11.2026)
  if (rawDate.includes('.')) {
    const parts = rawDate.split('.');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');   // Первый элемент - день
      const month = parts[1].padStart(2, '0'); // Второй элемент - месяц
      const year = parts[2];                   // Третий элемент - год
      return `${year}-${month}-${day}`;
    }
  }
  
  // Если дата идет через дефисы (например, 2026-10-28)
  if (rawDate.includes('-')) {
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  return rawDate;
}

function toggleStatusMessage(show, text = "") {
  const msgEl = document.getElementById('statusMessage');
  if (show) {
    msgEl.innerText = text;
    msgEl.style.display = 'block';
  } else {
    msgEl.style.display = 'none';
  }
}

async function fetchEvents() {
  const year = currentDate.getFullYear();
  const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0'); 
  const sheetName = `${monthStr}.${year}`; 

  const finalUrl = `${baseCsvUrl}gid=0&single=true&output=csv&sheet=${encodeURIComponent(sheetName)}`;

  try {
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error("Лист не найден");
    
    const text = await response.text();
    const lines = text.split('\n');
    
    allEvents = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const cols = lines[i].split(',');
      if (cols.length >= 2) {
        const title = clean(cols[0]); 
        const rawDate = clean(cols[1]);  
        const time = cols[2] ? clean(cols[2]) : ''; 
        
        const validatedDate = normalizeDate(rawDate);
        
        allEvents.push({
          title: time ? `[${time}] ${title}` : title, 
          start: validatedDate,
          time: time
        });
      }
    }
    
    allEvents.sort((a, b) => a.time.localeCompare(b.time));
    
    toggleStatusMessage(false); 
    renderCalendar();
    
  } catch (e) {
    console.warn(`Лист ${sheetName} не найден:`, e);
    allEvents = []; 
    toggleStatusMessage(true, "Расписания на этот месяц еще нет.");
    renderCalendar();
  }
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const title = document.getElementById('monthTitle');
  
  grid.innerHTML = ''; 

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", 
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  title.innerText = `${monthNames[month]} ${year}`;

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  weekDays.forEach(day => {
    grid.innerHTML += `<div class="day-name">${day}</div>`;
  });

  const firstDayIndex = new Date(year, month, 1).getDay(); 
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 
  const totalDays = new Date(year, month + 1, 0).getDate(); 

  for (let i = 0; i < startOffset; i++) {
    grid.innerHTML += `<div class="day-cell empty"></div>`;
  }

  for (let day = 1; day <= totalDays; day++) {
    const currentFullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = allEvents.filter(e => e.start === currentFullDate);
    
    let eventsHTML = '';
    dayEvents.forEach(ev => {
      eventsHTML += `<div class="event-item" title="${ev.title}">${ev.title}</div>`;
    });

    grid.innerHTML += `
      <div class="day-cell">
        <div class="day-number">${day}</div>
        <div class="event-list">${eventsHTML}</div>
      </div>
    `;
  }
}

document.getElementById('prevBtn').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  fetchEvents(); 
});

document.getElementById('nextBtn').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  fetchEvents();
});

fetchEvents();
