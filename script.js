// 1. Вставьте сюда вашу ссылку на CSV из Google Таблиц
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0kuJR4SlQqXz7Dwoi9FB9_EY3htkgkF-dYnrtZ-3fwRXsgozUOGoDowse7cYenNfFHSU9YV2FEVkZ/pub?"; 

let allEvents = [];
let currentDate = new Date(); // Хранит текущий просматриваемый месяц

// Функция загрузки данных из Google Таблицы
async function fetchEvents() {
  try {
    const response = await fetch(csvUrl);
    const text = await response.text();
    const lines = text.split('\n');
    
    allEvents = [];
    // Читаем строки таблицы, пропуская заголовки (i = 1)
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const cols = lines[i].split(',');
      if (cols.length >= 2) {
        allEvents.push({
          title: cols[0].replace(/^"|"$/g, '').trim(),
          start: cols[1].replace(/^"|"$/g, '').trim().split('T')[0] // Берём только дату YYYY-MM-DD
        });
      }
    }
    renderCalendar();
  } catch (e) {
    console.error("Не удалось загрузить данные из таблицы:", e);
    renderCalendar(); // Рисуем пустой календарь при ошибке сети
  }
}

// Функция сборки и отрисовки сетки
function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const title = document.getElementById('monthTitle');
  
  grid.innerHTML = ''; // Очищаем старую сетку

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Названия месяцев для отображения в шапке
  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", 
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  title.innerText = `${monthNames[month]} ${year}`;

  // Выводим дни недели
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  weekDays.forEach(day => {
    grid.innerHTML += `<div class="day-name">${day}</div>`;
  });

  // Логика расчета сетки дней
  const firstDayIndex = new Date(year, month, 1).getDay(); 
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Сдвиг для СНГ (Пн = 0)
  const totalDays = new Date(year, month + 1, 0).getDate(); // Дней в текущем месяце

  // Отрисовка пустых полей до начала месяца
  for (let i = 0; i < startOffset; i++) {
    grid.innerHTML += `<div class="day-cell empty"></div>`;
  }

  // Отрисовка дней месяца с событиями
  for (let day = 1; day <= totalDays; day++) {
    const currentFullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Фильтруем события из таблицы на этот день
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

// Навешиваем слушатели на кнопки смены месяцев
document.getElementById('prevBtn').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('nextBtn').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

// Первичный запуск при открытии страницы
fetchEvents();
