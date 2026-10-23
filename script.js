// 1. Вставьте сюда базовую ссылку публикации вашего ВЕСЬ ДОКУМЕНТ (удалите всё, что идет после знака вопроса, кроме id)
// Ссылка должна выглядеть примерно так: https://google.com?
const baseCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0kuJR4SlQqXz7Dwoi9FB9_EY3htkgkF-dYnrtZ-3fwRXsgozUOGoDowse7cYenNfFHSU9YV2FEVkZ/pub?gid=590384500&single=true&output=csv"; 

let allEvents = [];
let currentDate = new Date(); // Хранит текущий просматриваемый месяц

const clean = str => str ? str.replace(/^"|"$/g, '').trim() : '';

// Функция загрузки данных для конкретного месяца
async function fetchEvents() {
  const year = currentDate.getFullYear();
  // Получаем номер месяца с ведущим нулем (например, "10" для октября)
  const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0'); 
  const sheetName = `${monthStr}.${year}`; // Формируем имя листа, например "10.2026"

  // Формируем секретную ссылку Google для скачивания конкретного листа по его имени
  const finalUrl = `${baseCsvUrl}gid=0&single=true&output=csv&sheet=${encodeURIComponent(sheetName)}`;

  try {
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error("Лист не найден");
    
    const text = await response.text();
    const lines = text.split('\n');
    
    allEvents = [];
    
    // Читаем строки со второй (i = 1)
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const cols = lines[i].split(',');
      if (cols.length >= 2) {
        const title = clean(cols[0]);
        const date = clean(cols[1]); // Например: "2026-10-28"
        const time = cols[2] ? clean(cols[2]) : ''; // Например: "14:30"
        
        allEvents.push({
          title: time ? `[${time}] ${title}` : title, // Автоматически добавляем время к названию на сетке
          start: date
        });
      }
    }
    renderCalendar();
  } catch (e) {
    console.warn(`Не удалось загрузить лист ${sheetName}. Возможно, он еще не создан в таблице.`);
    allEvents = []; // Если листа нет, просто показываем пустой календарь для этого месяца
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

// При переключении месяца мы НЕ ПРОСТО перерисовываем, а ЗАГРУЖАЕМ новый CSV-лист
document.getElementById('prevBtn').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  fetchEvents(); 
});

document.getElementById('nextBtn').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  fetchEvents();
});

fetchEvents();
