const State = {
    canvas: document.getElementById('editor-canvas'),
    items: [],
    selectedId: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    mode: '2d'
};

function showDashboard() {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
}

function openModule(mode) {
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    setMode(mode);
}

function openScanner() {
    document.getElementById('scan-overlay').style.display = 'flex';
}

async function handleScan() {
    const input = document.getElementById('ai-input');
    if (!input.files.length) return;
    const formData = new FormData();
    formData.append('file', input.files[0]);
    document.getElementById('scan-overlay').innerHTML = "<h2>Սկանավորվում է...</h2>";
    
    const res = await fetch('/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
        document.getElementById('scan-overlay').style.display = 'none';
        openModule('2d');
        const scale = 0.8;
        data.lines.forEach(line => {
            const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
            l.setAttribute("x1", line.x1 * scale + 100); l.setAttribute("y1", line.y1 * scale + 100);
            l.setAttribute("x2", line.x2 * scale + 100); l.setAttribute("y2", line.y2 * scale + 100);
            l.setAttribute("stroke", "#1e293b"); l.setAttribute("stroke-width", "6");
            l.classList.add("wall-line");
            State.canvas.appendChild(l);
        });
    }
}

// Հուսալի նկարների բազա
const ASSETS = {
    bed: { img: 'https://i.ibb.co/L5hY5M7/bed-top.png', w: 140, h: 180 },
    sofa: { img: 'https://i.ibb.co/v4S6C2P/sofa-top.png', w: 180, h: 90 },
    table: { img: 'https://i.ibb.co/f4pSjP0/table-top.png', w: 110, h: 110 },
    plant: { img: 'https://i.ibb.co/mS6C9Wp/plant-top.png', w: 60, h: 60 }
};

window.addFurniture = (type) => {
    const config = ASSETS[type];
    const id = 'f-' + Date.now();
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", id);
    group.setAttribute("transform", "translate(400, 300) rotate(0)");

    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", config.img);
    img.setAttribute("width", config.w); img.setAttribute("height", config.h);
    img.style.cursor = 'move';

    group.appendChild(img);
    group.onmousedown = (e) => { State.selectedId = id; State.isDragging = true; };
    State.canvas.appendChild(group);
    State.items.push({ id, x: 400, y: 300, r: 0, w: config.w, h: config.h });
    applyStyles(id);
};

window.setMode = (mode) => {
    State.mode = mode;
    document.getElementById('btn-2d').classList.toggle('active', mode === '2d');
    document.getElementById('btn-3d').classList.toggle('active', mode === '3d');
    
    if (mode === '3d') {
        State.canvas.style.background = "#1a1a1a";
        State.canvas.style.transform = "rotateX(50deg) rotateZ(-25deg) scale(0.75)";
        document.querySelectorAll('.wall-line').forEach(w => {
            w.setAttribute("stroke", "#475569"); w.setAttribute("stroke-width", "20");
        });
    } else {
        State.canvas.style.background = "#ffffff";
        State.canvas.style.transform = "rotateX(0deg) rotateZ(0deg) scale(1)";
        document.querySelectorAll('.wall-line').forEach(w => {
            w.setAttribute("stroke", "#1e293b"); w.setAttribute("stroke-width", "6");
        });
    }
    State.items.forEach(i => applyStyles(i.id));
};

function applyStyles(id) {
    const el = document.getElementById(id);
    const img = el.querySelector('image');
    if (State.mode === '2d') {
        img.style.filter = "grayscale(1) brightness(0.4) contrast(10) invert(1)";
        el.style.filter = "none";
    } else {
        img.style.filter = "none";
        el.style.filter = "drop-shadow(10px 20px 15px rgba(0,0,0,0.6))";
    }
}

// Drag & Keyboard Controls
window.onmousemove = (e) => {
    if (!State.isDragging || !State.selectedId) return;
    const item = State.items.find(i => i.id === State.selectedId);
    const CTM = State.canvas.getScreenCTM();
    item.x = (e.clientX - CTM.e) / CTM.a - item.w/2;
    item.y = (e.clientY - CTM.f) / CTM.d - item.h/2;
    document.getElementById(item.id).setAttribute("transform", `translate(${item.x}, ${item.y}) rotate(${item.r}, ${item.w/2}, ${item.h/2})`);
};

window.onmouseup = () => State.isDragging = false;
window.onkeydown = (e) => {
    if (!State.selectedId) return;
    const item = State.items.find(i => i.id === State.selectedId);
    if (e.key === 'r') item.r = (item.r + 15) % 360;
    if (e.key === 'Delete') document.getElementById(item.id).remove();
    document.getElementById(item.id).setAttribute("transform", `translate(${item.x}, ${item.y}) rotate(${item.r}, ${item.w/2}, ${item.h/2})`);
};
