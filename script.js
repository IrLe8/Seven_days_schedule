// 1. Вставьте сюда базовую ссылку публикации ВАШЕГО ДОКУМЕНТА ЦЕЛИКОМ (формат CSV)
// Замените блок ВАШ_ID_ТАБЛИЦЫ на реальные символы из вашей ссылки Google
const baseCsvUrl = "https://google.com?"; 

let allEvents = [];
let currentDate = new Date(); // Хранит активный открытый месяц календаря

// Функция очистки от технических кавычек Google Таблиц
const clean = str => str ? str.replace(/^"|"$/g, '').trim() : '';

// Функция скрытия и показа плашки-уведомления
function toggleStatusMessage(show, text = "") {
  const msgEl = document.getElementById('statusMessage');
  if (show) {
    msgEl.innerText = text;
    msgEl.style.display = 'block';
  } else {
    msgEl.style.display = 'none';
  }
}

// Загрузка данных нужного листа из Google Таблицы
async function fetchEvents() {
  const year = currentDate.getFullYear();
  const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0'); // Всегда 2 знака ("01", "10")
  const sheetName = `${monthStr}.${year}`; // Формируем имя нужной вкладки, например "10.2026"

  // Ссылка, которая запрашивает у Google конкретную вкладку по имени
  const finalUrl = `${baseCsvUrl}gid=0&single=true&output=csv&sheet=${encodeURIComponent(sheetName)}`;

  try {
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error("Лист не найден");
    
    const text = await response.text();
    const lines = text.split('\n');
    
    allEvents = [];
    
    // Перебираем строки таблицы со второй строки (i = 1), пропуская шапку
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const cols = lines[i].split(',');
      if (cols.length >= 2) {
        const title = clean(cols[0]); // Колонка A: Название / Тренер
        const date = clean(cols[1]);  // Колонка B: Дата (YYYY-MM-DD)
        const time = cols[2] ? clean(cols[2]) : ''; // Колонка C: Время (HH:MM)
        
        allEvents.push({
          title: time ? `[${time}] ${title}` : title, // Если время указано, прикрепляем к названию
          start: date
        });
      }
    }
    
    toggleStatusMessage(false); // Убираем сообщение об ошибке, если вкладка успешно прочитана
    renderCalendar();
    
  } catch (e) {
    console.warn(`Лист ${sheetName} не найден в таблице.`);
    allEvents = []; // Очищаем массив, чтобы не показывать занятия прошлых месяцев
    
    // Показываем плашку-помощник для менеджеров
    toggleStatusMessage(true, `Расписание на этот месяц еще не создано. Для вывода данных создайте вкладку с именем "${sheetName}" в Google Таблице.`);
    renderCalendar();
  }
}

// Построение сетки календаря
function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const title = document.getElementById('monthTitle');
  
  grid.innerHTML = ''; // Стираем старую сетку перед перерисовкой

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", 
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  title.innerText = `${monthNames[month]} ${year}`;

  // Выводим шапку дней недели
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  weekDays.forEach(day => {
    grid.innerHTML += `<div class="day-name">${day}</div>`;
  });

  // Расчет отступов пустых ячеек
  const firstDayIndex = new Date(year, month, 1).getDay(); 
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Корректируем под СНГ (Пн = 0)
  const totalDays = new Date(year, month + 1, 0).getDate(); 

  // Выводим пустые карточки дней до старта месяца
  for (let i = 0; i < startOffset; i++) {
    grid.innerHTML += `<div class="day-cell empty"></div>`;
  }

  // Начинаем выводить реальные числа месяца
  for (let day = 1; day <= totalDays; day++) {
    // Собираем системную дату дня в формате YYYY-MM-DD
    const currentFullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Отбираем занятия из таблицы на этот день
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

// Слушатели кликов по кнопкам навигации
document.getElementById('prevBtn').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  fetchEvents(); // Запрашиваем новый CSV при переходе
});

document.getElementById('nextBtn').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  fetchEvents(); // Запрашиваем новый CSV при переходе
});

// Первичный автоматический запуск кода при загрузке сайта
fetchEvents();
