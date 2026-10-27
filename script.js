// 1. Вставьте сюда вашу ссылку на CSV из Google Таблиц
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0kuJR4SlQqXz7Dwoi9FB9_EY3htkgkF-dYnrtZ-3fwRXsgozUOGoDowse7cYenNfFHSU9YV2FEVkZ/pub?gid=590384500&single=true&output=csv";
let allEvents = [];
let currentDate = new Date(); // Хранит текущий просматриваемый месяц

// Переменные для отслеживания текущего открытого списка событий
let currentModalEvents = [];
let currentModalIndex = 0;

const clean = str => str ? str.replace(/^"|"$/g, '').replace(/\r/g, '').trim() : '';

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
          id: `event-${i}-${Date.now()}`,
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
      let badgeClass = ev.isRent ? 'event-item event-red' : 'event-item event-purple';
      eventsHTML += `<div class="${badgeClass}" title="${ev.title}" onclick="openEventModal('${ev.id}', '${currentFullDate}')">
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

// Открытие окна с учетом контекста всего дня
function openEventModal(eventId, dateString) {
  currentModalEvents = allEvents
    .filter(e => e.start === dateString)
    .sort((a, b) => a.time.localeCompare(b.time));
    
  currentModalIndex = currentModalEvents.findIndex(e => e.id === eventId);
  
  if (currentModalIndex === -1) return;
  
  updateModalContent();
  
  const modal = document.getElementById('eventModal');
  modal.style.display = 'block'; 
}

// Обновление контента внутри окна при листании
function updateModalContent() {
  const event = currentModalEvents[currentModalIndex];
  if (!event) return;

  const [year, month, day] = event.start.split('-');
  const humanDate = `${day}.${month}.${year}`;

  document.getElementById('modalTitle').innerText = event.title;
  document.getElementById('modalDate').innerText = humanDate;
  document.getElementById('modalTimeRange').innerText = `${event.time} - ${event.endTime}`;

  const modalHeader = document.getElementById('modalHeader');
  if (event.isRent) {
    modalHeader.className = 'modal-header style-rent';
  } else {
    modalHeader.className = 'modal-header style-purple';
  }

  // ИСПРАВЛЕНО: Вместо скрытия меняем прозрачность и активность кнопок
  const prevArrow = document.getElementById('modalPrevBtn');
  const nextArrow = document.getElementById('modalNextBtn');
  
  if (prevArrow && nextArrow) {
    if (currentModalIndex > 0) {
      prevArrow.disabled = false;
      prevArrow.style.opacity = '1';
      prevArrow.style.pointerEvents = 'auto';
    } else {
      prevArrow.disabled = true;
      prevArrow.style.opacity = '0.2'; // Делаем блеклой
      prevArrow.style.pointerEvents = 'none'; // Запрещаем клики
    }

    if (currentModalIndex < currentModalEvents.length - 1) {
      nextArrow.disabled = false;
      nextArrow.style.opacity = '1';
      nextArrow.style.pointerEvents = 'auto';
    } else {
      nextArrow.disabled = true;
      nextArrow.style.opacity = '0.2'; // Делаем блеклой
      nextArrow.style.pointerEvents = 'none'; // Запрещаем клики
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const modal = document.getElementById('eventModal');
  const closeBtn = document.querySelector('.close-button');
  const prevArrow = document.getElementById('modalPrevBtn');
  const nextArrow = document.getElementById('modalNextBtn');

  if (prevBtn) prevBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
  if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });

  if (prevArrow) {
    prevArrow.addEventListener('click', (e) => {
      e.stopPropagation(); // Защита от всплытия клика
      if (currentModalIndex > 0) {
        currentModalIndex--;
        updateModalContent();
      }
    });
  }

  if (nextArrow) {
    nextArrow.addEventListener('click', (e) => {
      e.stopPropagation(); // Защита от всплытия клика
      if (currentModalIndex < currentModalEvents.length - 1) {
        currentModalIndex++;
        updateModalContent();
      }
    });
  }

  // ИСПРАВЛЕНО: удален обработчик window клика по серой вуали, 
  // чтобы окно случайно не закрывалось при быстром тапе по стрелкам.
});

fetchEvents();
