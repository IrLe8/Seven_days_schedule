// 1. Вставьте сюда вашу ссылку на CSV из Google Таблиц
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0kuJR4SlQqXz7Dwoi9FB9_EY3htkgkF-dYnrtZ-3fwRXsgozUOGoDowse7cYenNfFHSU9YV2FEVkZ/pub?gid=590384500&single=true&output=csv"; 

let allEvents = [];
let currentDate = new Date(); // Хранит текущий просматриваемый месяц

// Вспомогательная функция очистки текста от кавычек Google Таблиц и невидимых символов \r
const clean = str => str ? str.replace(/^"|"$/g, '').replace(/\r/g, '').trim() : '';

async function fetchEvents() {
  try {
    // Добавляем к ссылке случайный параметр против жесткого кэширования браузером
    const response = await fetch(`${csvUrl}&_cb=${Date.now()}`);
    const text = await response.text();
    
    // Делим строки с учетом возможных символов \r\n
    const lines = text.split('\n');
    
    allEvents = [];
    
    // Читаем строки, пропуская строку №1 с заголовками (title, type, start, end)
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      if (!currentLine) continue;
      
      const cols = currentLine.split(',');
      
      // Проверяем, что в строке есть хотя бы название и дата (теперь дата сместилась в cols[2])
      if (cols.length >= 3) {
        const titleText = clean(cols[0]);
        const typeText = clean(cols[1]).toLowerCase(); // Переводим в нижний регистр для надежности проверки
        const rawStart = clean(cols[2]); 
        
        // Если названия нет (как в строке 2 на вашем скриншоте) — просто пропускаем эту строку
        if (!titleText) continue;
        
        // Разделяем по ПРОБЕЛУ, чтобы забрать только дату YYYY-MM-DD
        const datePart = rawStart.split(' ')[0]; 
        
        // Проверяем тип события для окрашивания
        const isRent = typeText === 'аренда';
        
        allEvents.push({
          title: titleText,
          start: datePart,
          isRent: isRent // Сохраняем признак аренды (true или false)
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
  
  if (!grid || !title) return; // Защита от ошибок, если элементы еще не созданы
  
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
      // Определяем цвет плашки и текста в зависимости от статуса аренды
      let badgeStyle = '';
      if (ev.isRent) {
        // Красный стиль для аренды
        badgeStyle = 'background: #ffebee; color: #c62828; border-left: 3px solid #d32f2f;';
      } else {
        // Фиолетовый стиль для пустых ячеек
        badgeStyle = 'background: #f3e5f5; color: #4a148c; border-left: 3px solid #7b1fa2;';
      }

      eventsHTML += `<div class="event-item" style="${badgeStyle}" title="${ev.title}">${ev.title}</div>`;
    });

    grid.innerHTML += `
      <div class="day-cell">
        <div class="day-number">${day}</div>
        <div class="event-list">${eventsHTML}</div>
      </div>
    `;
  }
}

// Навешиваем события только после проверки существования элементов в DOM
document.addEventListener('DOMContentLoaded', () => {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

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
});

fetchEvents();
