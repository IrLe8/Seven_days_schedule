// 1. Вставьте сюда вашу ссылку на CSV из Google Таблиц
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0kuJR4SlQqXz7Dwoi9FB9_EY3htkgkF-dYnrtZ-3fwRXsgozUOGoDowse7cYenNfFHSU9YV2FEVkZ/pub?gid=590384500&single=true&output=csv"; 

let allEvents = [];
let currentDate = new Date(); // Хранит текущий просматриваемый месяц

// Вспомогательная функция очистки текста от кавычек Google Таблиц и невидимых символов \r
const clean = str => str ? str.replace(/^"|"$/g, '').replace(/\r/g, '').trim() : '';

// Функция приведения времени "8:00" -> "08:00" для корректной сортировки
const formatTime = timeStr => {
  if (!timeStr || !timeStr.includes(':')) return '00:00';
  const [hours, minutes] = timeStr.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

async function fetchEvents() {
  try {
    const response = await fetch(`${csvUrl}&_cb=${Date.now()}`);
    const text = await response.text();
    const lines = text.split('\n');
    
    allEvents = [];
    
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      if (!currentLine) continue;
      
      const cols = currentLine.split(',');
      
      if (cols.length >= 5) {
        const titleText = clean(cols[0]);
        const typeText = clean(cols[1]).toLowerCase();
        const rawDate = clean(cols[2]); 
        const rawStart = clean(cols[3]); 
        const rawEnd = clean(cols[4]);   
        
        if (!titleText || !rawDate) continue;
        
        const dateParts = rawDate.split('.');
        if (dateParts.length !== 3) continue;
        const day = dateParts[0].padStart(2, '0');
        const month = dateParts[1].padStart(2, '0');
        const year = dateParts[2];
        const formattedDate = `${year}-${month}-${day}`;
        
        const startTime = formatTime(rawStart);
        const endTime = formatTime(rawEnd);
        
        const isRent = typeText === 'аренда';
        
        allEvents.push({
          id: `event-${i}-${Date.now()}`, // Уникальный ID для каждого события
          title: titleText,
          start: formattedDate, 
          time: startTime,      
          endTime: endTime,     
          isRent: isRent
        });
      }
    }
    renderCalendar();
  } catch (e) {
    console.error("Не удалось загрузить данные из таблицы:", e);
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
    
    const dayEvents = allEvents
      .filter(e => e.start === currentFullDate)
      .sort((a, b) => a.time.localeCompare(b.time)); 
    
    let eventsHTML = '';
    dayEvents.forEach(ev => {
      let badgeStyle = '';
      if (ev.isRent) {
        badgeStyle = 'background: #ffebee; color: #c62828; border-left: 3px solid #d32f2f; cursor: pointer;';
      } else {
        badgeStyle = 'background: #f3e5f5; color: #4a148c; border-left: 3px solid #7b1fa2; cursor: pointer;';
      }

      // Добавили onclick функцию, передающую ID события, и курсор-указатель
      eventsHTML += `<div class="event-item" style="${badgeStyle}" title="${ev.time}-${ev.endTime} ${ev.title}" onclick="openEventModal('${ev.id}')">
        ${ev.title}
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

// Функция открытия модального окна
function openEventModal(eventId) {
  const event = allEvents.find(e => e.id === eventId);
  if (!event) return;

  // Переворачиваем дату обратно для показа (из YYYY-MM-DD в ДД.ММ.ГГГГ)
  const [year, month, day] = event.start.split('-');
  const humanDate = `${day}.${month}.${year}`;

  // Подставляем данные в окошко
  document.getElementById('modalTitle').innerText = event.title;
  document.getElementById('modalDate').innerText = humanDate;
  
  // Формируем красивую строку времени "08:00 - 10:00"
  document.getElementById('modalTimeRange').innerText = `${event.time} - ${event.endTime}`;

  // Показываем окно
  const modal = document.getElementById('eventModal');
  modal.style.display = 'block'; 
}

document.addEventListener('DOMContentLoaded', () => {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const modal = document.getElementById('eventModal');
  const closeBtn = document.querySelector('.close-button');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });
  }

  // Закрытие окна при клике на крестик
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  // Закрытие окна при клике на любое пустое место экрана вокруг окошка
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

fetchEvents();
