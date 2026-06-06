const State = {
    canvas: document.getElementById('editor-canvas'),
    items: [],
    selectedId: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    mode: '2d'
};

// 1. Module Management
function initModule(mode) {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    if (mode === '3d') setTimeout(() => setMode('3d'), 500);
}

function openScanner() {
    document.getElementById('scan-overlay').style.display = 'flex';
}

async function handleAIScan() {
    const fileInput = document.getElementById('ai-file-input');
    if (!fileInput.files.length) return alert("Խնդրում ենք ընտրել նկար:");
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    document.getElementById('scan-overlay').innerHTML = "<h2>Սկանավորվում է...</h2>";

    try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
            document.getElementById('scan-overlay').style.display = 'none';
            initModule('2d');
            drawWalls(data.lines, data.image_size);
        }
    } catch (err) { alert("Սխալ սկանավորման ժամանակ:"); }
}

function drawWalls(lines, size) {
    const scale = Math.min(800 / size.width, 600 / size.height);
    lines.forEach(line => {
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", line.x1 * scale + 100);
        l.setAttribute("y1", line.y1 * scale + 100);
        l.setAttribute("x2", line.x2 * scale + 100);
        l.setAttribute("y2", line.y2 * scale + 100);
        l.setAttribute("stroke", "#1e293b");
        l.setAttribute("stroke-width", "8");
        l.classList.add("wall");
        State.canvas.appendChild(l);
    });
}

// 2. Furniture Management
const FURNITURE_DATA = {
    bed: { img: 'https://i.ibb.co/L5hY5M7/bed-top.png', w: 140, h: 180 },
    sofa: { img: 'https://i.ibb.co/v4S6C2P/sofa-top.png', w: 180, h: 90 },
    table: { img: 'https://i.ibb.co/f4pSjP0/table-top.png', w: 110, h: 110 },
    tv: { img: 'https://i.ibb.co/v4S6C2P/sofa-top.png', w: 150, h: 20 }
};

window.addFurniture = (type) => {
    const config = FURNITURE_DATA[type];
    const id = 'f-' + Date.now();
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", id);
    group.setAttribute("transform", "translate(300, 250) rotate(0)");

    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", config.img);
    img.setAttribute("width", config.w);
    img.setAttribute("height", config.h);
    img.style.cursor = 'move';
    img.style.filter = "drop-shadow(5px 5px 10px rgba(0,0,0,0.3))";

    group.appendChild(img);
    group.onmousedown = (e) => startDrag(e, id);
    State.canvas.appendChild(group);
    State.items.push({ id, x: 300, y: 250, r: 0, w: config.w, h: config.h });
};

// 3. 3D Mode Logic
window.setMode = (mode) => {
    State.mode = mode;
    document.getElementById('btn-2d').classList.toggle('active', mode === '2d');
    document.getElementById('btn-3d').classList.toggle('active', mode === '3d');
    
    if (mode === '3d') {
        State.canvas.style.transform = "rotateX(55deg) rotateZ(-30deg) scale(0.8)";
        document.querySelectorAll('.wall').forEach(w => {
            w.setAttribute("stroke-width", "25");
            w.setAttribute("stroke", "#475569");
        });
    } else {
        State.canvas.style.transform = "rotateX(0deg) rotateZ(0deg) scale(1)";
        document.querySelectorAll('.wall').forEach(w => {
            w.setAttribute("stroke-width", "8");
            w.setAttribute("stroke", "#1e293b");
        });
    }
};

// ... (Drag & Key logic same as previous but optimized for 3D perspective)
function startDrag(e, id) {
    State.selectedId = id;
    State.isDragging = true;
    const item = State.items.find(i => i.id === id);
    const CTM = State.canvas.getScreenCTM();
    State.dragOffset = { x: (e.clientX - CTM.e) / CTM.a - item.x, y: (e.clientY - CTM.f) / CTM.d - item.y };
}

window.onmousemove = (e) => {
    if (!State.isDragging || !State.selectedId) return;
    const item = State.items.find(i => i.id === State.selectedId);
    const CTM = State.canvas.getScreenCTM();
    item.x = (e.clientX - CTM.e) / CTM.a - State.dragOffset.x;
    item.y = (e.clientY - CTM.f) / CTM.d - State.dragOffset.y;
    document.getElementById(item.id).setAttribute("transform", `translate(${item.x}, ${item.y}) rotate(${item.r}, ${item.w/2}, ${item.h/2})`);
};

window.onmouseup = () => State.isDragging = false;

window.onkeydown = (e) => {
    if (!State.selectedId) return;
    const item = State.items.find(i => i.id === State.selectedId);
    if (e.key === 'r') item.r = (item.r + 15) % 360;
    document.getElementById(item.id).setAttribute("transform", `translate(${item.x}, ${item.y}) rotate(${item.r}, ${item.w/2}, ${item.h/2})`);
};
