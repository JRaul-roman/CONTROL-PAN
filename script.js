const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS_OF_WEEK = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

let appData = {};
let currentMonth = 0; // 0-indexed (Jan = 0)

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    loadData();
    renderSidebar();
    renderMonth(currentMonth);
    setupEventListeners();
}

function loadData() {
    const storedData = localStorage.getItem('panData2026');
    if (storedData) {
        appData = JSON.parse(storedData);
    } else {
        generateEmptyData();
    }
}

function generateEmptyData() {
    appData = {};
    for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(2026, m + 1, 0).getDate();
        appData[m] = {};
        for (let d = 1; d <= daysInMonth; d++) {
            appData[m][d] = {
                barras: 0,
                bocadillos: 0
            };
        }
    }
    saveData();
}

function saveData() {
    localStorage.setItem('panData2026', JSON.stringify(appData));
    updateStats();
}

function renderSidebar() {
    const nav = document.getElementById('monthNav');
    nav.innerHTML = '';

    MONTHS.forEach((month, index) => {
        const btn = document.createElement('button');
        btn.className = `month-btn ${index === currentMonth ? 'active' : ''}`;
        btn.innerHTML = `<span>${month}</span> <i class="fa-solid fa-chevron-right" style="font-size: 0.7em; opacity: 0.5;"></i>`;
        btn.onclick = () => {
            currentMonth = index;
            renderSidebar(); // Re-render to update active class
            renderMonth(currentMonth);
        };
        nav.appendChild(btn);
    });
    
    updateStats();
}

function renderMonth(monthIndex) {
    const container = document.getElementById('daysContainer');
    const title = document.getElementById('currentMonthTitle');
    
    container.innerHTML = '';
    title.textContent = MONTHS[monthIndex];

    const daysInMonth = new Date(2026, monthIndex + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(2026, monthIndex, d);
        const dayName = DAYS_OF_WEEK[date.getDay()];
        const dayData = appData[monthIndex][d];

        const card = document.createElement('div');
        card.className = 'day-card';
        
        // Highlight weekends
        if (date.getDay() === 0 || date.getDay() === 6) {
            card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            card.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
        }

        card.innerHTML = `
            <div class="day-header">
                <span class="day-number">${d}</span>
                <span class="day-name">${dayName.substring(0, 3)}</span>
            </div>
            <div class="day-inputs">
                <div class="input-group barras">
                    <span class="input-label"><i class="fa-solid fa-baguette" style="color: var(--accent-color); font-size: 0.8em;"></i> Barras</span>
                    <div class="quantity-control">
                        <button class="stepper-btn" onclick="updateValueRelative(${monthIndex}, ${d}, 'barras', -1)"><i class="fa-solid fa-minus"></i></button>
                        <span class="quantity-badge">${dayData.barras}</span>
                        <button class="stepper-btn" onclick="updateValueRelative(${monthIndex}, ${d}, 'barras', 1)"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
                <div class="input-group bocadillos">
                    <span class="input-label"><i class="fa-solid fa-burger" style="color: var(--success); font-size: 0.8em;"></i> Bocadillos</span>
                    <div class="quantity-control">
                        <button class="stepper-btn" onclick="updateValueRelative(${monthIndex}, ${d}, 'bocadillos', -1)"><i class="fa-solid fa-minus"></i></button>
                        <span class="quantity-badge">${dayData.bocadillos}</span>
                        <button class="stepper-btn" onclick="updateValueRelative(${monthIndex}, ${d}, 'bocadillos', 1)"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    }
    
    updateStats();
}

function updateValue(month, day, type, value) {
    appData[month][day][type] = parseInt(value) || 0;
    saveData();
}

function updateValueRelative(month, day, type, change) {
    const current = appData[month][day][type];
    const newValue = Math.max(0, current + change); // Prevent negative
    appData[month][day][type] = newValue;
    saveData();
    // Re-render only this month to reflect changes (simple brute force for now)
    renderMonth(month);
    // Note: optimization could be to just update the specific DOM element, 
    // but renderMonth is fast enough for this scale.
}

function updateStats() {
    // Monthly Stats
    let mBarras = 0;
    let mBocadillos = 0;
    const daysInMonth = new Date(2026, currentMonth + 1, 0).getDate();
    
    for (let d = 1; d <= daysInMonth; d++) {
        mBarras += appData[currentMonth][d].barras;
        mBocadillos += appData[currentMonth][d].bocadillos;
    }

    document.getElementById('monthTotalBarras').textContent = mBarras.toLocaleString();
    document.getElementById('monthTotalBocadillos').textContent = mBocadillos.toLocaleString();

    // Yearly Stats
    let yBarras = 0;
    let yBocadillos = 0;

    for (let m = 0; m < 12; m++) {
        const dCount = new Date(2026, m + 1, 0).getDate();
        for (let d = 1; d <= dCount; d++) {
            yBarras += appData[m][d].barras;
            yBocadillos += appData[m][d].bocadillos;
        }
    }

    document.getElementById('totalYearBarras').textContent = yBarras.toLocaleString();
    document.getElementById('totalYearBocadillos').textContent = yBocadillos.toLocaleString();
}

function setupEventListeners() {
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('resetBtn').addEventListener('click', () => {
        if(confirm('¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.')) {
            generateEmptyData();
            renderMonth(currentMonth);
        }
    });
}

function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Mes,Dia,Barras,Bocadillos\n";

    for (let m = 0; m < 12; m++) {
        const dCount = new Date(2026, m + 1, 0).getDate();
        for (let d = 1; d <= dCount; d++) {
            const date = `${d}/${m+1}/2026`;
            const row = [
                date,
                MONTHS[m],
                d,
                appData[m][d].barras,
                appData[m][d].bocadillos
            ].join(",");
            csvContent += row + "\n";
        }
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "control_pan_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
