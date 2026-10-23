// Ваша публичная ссылка на CSV
const baseCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0kuJR4SlQqXz7Dwoi9FB9_EY3htkgkF-dYnrtZ-3fwRXsgozUOGoDowse7cYenNfFHSU9YV2FEVkZ/pub?output=csv"; 

let calendar;
const clean = str => str ? str.replace(/^"|"$/g, '').trim() : '';

// Надежная функция нормализации даты
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

// Главная функция загрузки данных из вкладки месяца
async function loadMonthEvents(date) {
  const year = date.getFullYear();
  const monthStr = String(date.getMonth() + 1).padStart(2, '0');
  const sheetName = `${monthStr}.${year}`;

  const finalUrl = `${baseCsvUrl}gid=0&single=true&output=csv&sheet=${encodeURIComponent(sheetName)}`;

  try {
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error("Лист не найден");
    
    const text = await response.text();
    if (text.includes("<!DOCTYPE") || text.trim() === "") throw new Error("Неверный формат");

    const lines = text.split(/\r?\n/);
    const events = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      
      if (cols.length >= 2) {
        const title = clean(cols[0]);
        const rawDate = clean(cols[1]);
        const time = cols[2] ? clean(cols[2]) : '';
        
        const validatedDate = normalizeDate(rawDate);
        
        events.push({
          title: time ? `[${time}] ${title}` : title,
          start: validatedDate,
          allDay: time ? false : true, // Если времени нет, событие на весь день
          rawTime: time
        });
      }
    }

    // Сортировка событий по времени
    events.sort((a, b) => a.rawTime.localeCompare(b.rawTime));
    
    toggleStatusMessage(false);
    return events;

  } catch (e) {
    console.warn(`Нет данных для листа ${sheetName}`);
    toggleStatusMessage(true, "Расписания на этот месяц еще нет.");
    return [];
  }
}

// Инициализация календаря при старте страницы
document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'ru',      // Русский интерфейс
    firstDay: 1,       // Неделя начинается с Понедельника
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''        // Убираем лишние кнопки переключения видов
    },
    // Этот метод срабатывает автоматически при открытии сайта и смене месяцев кнопками
    events: async function(fetchInfo, successCallback, failureCallback) {
      const activeDate = calendar ? calendar.getDate() : new Date();
      const currentEvents = await loadMonthEvents(activeDate);
      successCallback(currentEvents);
    }
  });

  calendar.render();
});
