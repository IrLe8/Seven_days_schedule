// Вставьте сюда общую ссылку на документ (из адресной строки браузера) или ID
const spreadsheetId = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0kuJR4SlQqXz7Dwoi9FB9_EY3htkgkF-dYnrtZ-3fwRXsgozUOGoDowse7cYenNfFHSU9YV2FEVkZ/pub?output=csv"; 

let allEvents = [];
let currentDate = new Date(); 

const clean = str => str ? str.replace(/^"|"$/g, '').replace(/\r/g, '').trim() : '';

// Динамически загружает данные конкретной вкладки по её названию
async function fetchEventsForCurrentMonth() {
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const sheetName = `${month}.${year}`; // Формируем строку вида "10.2026"
  
  const notificationElement = document.getElementById('calendarNotification');
  const gridElement = document.getElementById('calendarGrid');
  
  if (notificationElement) notificationElement.style.display = 'none';
  if (gridElement) gridElement.style.opacity = '1';

  try {
    // Скачиваем CSV конкретного листа по его имени
    const csvUrl = `https://google.com{spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&_cb=${Date.now()}`;
    const response = await fetch(csvUrl);
    
    if (!response.ok) throw new Error("Sheet not found");
    
    const text = await response.text();
    const lines = text.split('\n');
    
    allEvents = [];
    
    // Парсим строки аналогично прошлой версии
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      if (!currentLine) continue;
      
      const cols = currentLine.split(',');
      if (cols.length >= 3) {
        const titleText = clean(cols[0]);
        const typeText = clean(cols[1]).toLowerCase();
        const rawStart = clean(cols[2]);
        
        if (!titleText) continue;
        
        const dateTimeParts = rawStart.split(' ');
        const datePart = dateTimeParts[0];
        let timePart = dateTimeParts[1] || '00:00';
        
        if (timePart && timePart.includes(':')) {
          const [hours, minutes] = timePart.split(':');
          timePart = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
        
        allEvents.push({
          title: titleText,
          start: datePart,
          time: timePart,
          isRent: typeText === 'аренда'
        });
      }
    }
    renderCalendar();
  } catch (e) {
    // Если вкладки с таким месяцем нет — выводим предупреждение
    allEvents = [];
    renderCalendar();
    if (notificationElement) {
      notificationElement.innerText = "Расписания на этот месяц еще нет";
      notificationElement.style.display = 'block';
    }
    if (gridElement) gridElement.style.opacity = '0.4'; // Визуально приглушаем пустую сетку
  }
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const title = document.getElementById('monthTitle');
  if (!grid || !title) return;
  
  grid.innerHTML = '';
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  title.innerText = `${monthNames[month]} ${year}`;

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  weekDays.forEach(day => { grid.innerHTML += `<div class="day-name">${day}</div>`; });

  const firstDayIndex = new Date(year, month, 1).getDay(); 
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 
  const totalDays = new Date(year, month + 1, 0).getDate(); 

  for (let i = 0; i < startOffset; i++) {
    grid.innerHTML += `<div class="day-cell empty"></div>`;
  }

  for (let day = 1; day <= totalDays; day++) {
    const currentFullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = allEvents
      .filter(e => e.start === currentFullDate)
      .sort((a, b) => a.time.localeCompare(b.time));
    
    let eventsHTML = '';
    dayEvents.forEach(ev => {
      let badgeStyle = ev.isRent 
        ? 'background: #ffebee; color: #c62828; border-left: 3px solid #d32f2f;' 
        : 'background: #f3e5f5; color: #4a148c; border-left: 3px solid #7b1fa2;';

      eventsHTML += `<div class="event-item" style="${badgeStyle}" title="${ev.time} ${ev.title}">
        <strong>${ev.time}</strong> ${ev.title}
      </div>`;
    });

    grid.innerHTML += `
      <div class="day-cell">
        <div class="day-number">${day}</div>
        <div class="event-list">${eventsHTML}</div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('prevBtn')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    fetchEventsForCurrentMonth();
  });

  document.getElementById('nextBtn')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    fetchEventsForCurrentMonth();
  });
});

fetchEventsForCurrentMonth();
