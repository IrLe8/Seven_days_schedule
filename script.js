// Родная публичная ссылка на ваш документ в формате CSV
const baseCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0kuJR4SlQqXz7Dwoi9FB9_EY3htkgkF-dYnrtZ-3fwRXsgozUOGoDowse7cYenNfFHSU9YV2FEVkZ/pub?"; 

let allEvents = [];
let currentDate = new Date(); 

const clean = str => str ? str.replace(/^"|"$/g, '').trim() : '';

// Защищенная функция нормализации дат (обрабатывает и точки, и дефисы)
function normalizeDate(rawDate) {
  if (!rawDate) return '';
  
  if (rawDate.includes('.')) {
    const parts = rawDate.split('.');
    if (parts.length === 3) {
      return `${parts[2].trim()}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  if (rawDate.includes('-')) {
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      return `${parts[0].trim()}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  
  return rawDate;
}

function toggleStatusMessage(show, text = "") {
  const msgEl = document.getElementById('statusMessage');
  if (msgEl) {
    msgEl.innerText = text;
    msgEl.style.display = show ? 'block' : 'none';
  }
}

async function fetchEvents() {
  const year = currentDate.getFullYear();
  const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0'); 
  const sheetName = `${monthStr}.${year}`; 

  // Запрос к публичному CSV с указанием конкретного листа
  const finalUrl = `${baseCsvUrl}gid=0&single=true&output=csv&sheet=${encodeURIComponent(sheetName)}`;

  try {
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error("Лист не найден");
    
    const text = await response.text();
    
    // Если Google отдал ошибку или пустой HTML
    if (text.includes("<!DOCTYPE") || text.trim() === "") {
      throw new Error("Неверный формат данных");
    }
    
    const lines = text.split('\n');
    allEvents = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Разбиваем строку CSV с учетом возможных кавычек
      const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      
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
    
    // Сортировка по времени внутри дня
    allEvents.sort((a, b) => a.time.localeCompare(b.time));
    
    toggleStatusMessage(false); 
    renderCalendar();
    
  } catch (e) {
    console.warn(`Не удалось загрузить расписание для листа ${sheetName}:`, e);
    allEvents = []; 
    toggleStatusMessage(true, "Расписания на этот месяц еще нет.");
    renderCalendar();
  }
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const title = document.getElementById('monthTitle');
  
  if (!grid || !title) return;
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
