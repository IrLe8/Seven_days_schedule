// 1. Вставьте сюда вашу ссылку на CSV из Google Таблиц
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0kuJR4SlQqXz7Dwoi9FB9_EY3htkgkF-dYnrtZ-3fwRXsgozUOGoDowse7cYenNfFHSU9YV2FEVkZ/pub?gid=590384500&single=true&output=csv"; 

let allEvents = [];
let currentDate = new Date(); // Хранит текущий просматриваемый месяц

// Вспомогательная функция очистки текста от кавычек Google Таблиц
const clean = str => str ? str.replace(/^"|"$/g, '').trim() : '';

async function fetchEvents() {
  try {
    const response = await fetch(csvUrl);
    const text = await response.text();
    const lines = text.split('\n');
    
    allEvents = [];
    
    // Читаем строки, пропуская строку №1 с заголовками (title, start, end)
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const cols = lines[i].split(',');
      if (cols.length >= 2) {
        const rawStart = clean(cols[1]); // Получаем "2026-10-28 8:00"
        
        // Разделяем по ПРОБЕЛУ, чтобы забрать только дату YYYY-MM-DD
        const datePart = rawStart.split(' ')[0]; 
        
        allEvents.push({
          title: clean(cols[0]),
          start: datePart 
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
  
  grid.innerHTML = ''; // Очищаем сетку

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

  // Отрисовка дней прошлого месяца (пустые ячейки)
  for (let i = 0; i < startOffset; i++) {
    grid.innerHTML += `<div class="day-cell empty"></div>`;
  }

  // Отрисовка дней текущего месяца
  for (let day = 1; day <= totalDays; day++) {
    // Собираем дату в формате YYYY-MM-DD для сравнения (с ведущими нулями)
    const currentFullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Ищем события, у которых дата совпадает с днем календаря
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
  renderCalendar();
});

document.getElementById('nextBtn').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

fetchEvents();
