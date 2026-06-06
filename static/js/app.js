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

function startApp(mode) {
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    setMode(mode);
}

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
    img.setAttribute("width", config.w);
    img.setAttribute("height", config.h);
    img.style.cursor = 'move';
    img.classList.add('furniture-img');

    group.appendChild(img);
    group.onmousedown = (e) => startDrag(e, id);
    State.canvas.appendChild(group);
    State.items.push({ id, x: 400, y: 300, r: 0, w: config.w, h: config.h });
    applyStylesToItem(id);
};

window.setMode = (mode) => {
    State.mode = mode;
    document.getElementById('btn-2d').classList.toggle('active', mode === '2d');
    document.getElementById('btn-3d').classList.toggle('active', mode === '3d');
    
    const canvas = State.canvas;
    if (mode === '3d') {
        canvas.style.background = "#1a1a1a"; // Մուգ հատակ, ինչպես 2-րդ նկարում
        canvas.style.transform = "rotateX(50deg) rotateZ(-25deg) scale(0.75)";
        canvas.style.boxShadow = "40px 60px 100px rgba(0,0,0,0.5)";
        document.getElementById('canvas-area').style.background = "#0f172a";
    } else {
        canvas.style.background = "#ffffff"; // Սպիտակ Blueprint, ինչպես 1-ին նկարում
        canvas.style.transform = "rotateX(0deg) rotateZ(0deg) scale(1)";
        canvas.style.boxShadow = "none";
        document.getElementById('canvas-area').style.background = "#e2e8f0";
    }
    
    State.items.forEach(item => applyStylesToItem(item.id));
};

function applyStylesToItem(id) {
    const el = document.getElementById(id);
    const img = el.querySelector('image');
    if (State.mode === '2d') {
        // Blueprint ոճ. սև-սպիտակ ուրվագծեր
        img.style.filter = "grayscale(1) brightness(0.5) contrast(10) invert(1)"; 
        el.style.filter = "none";
    } else {
        // Realistic ոճ. իրական գույներ և խորը ստվերներ
        img.style.filter = "none";
        el.style.filter = "drop-shadow(10px 20px 15px rgba(0,0,0,0.6))";
    }
}

// Drag logic
function startDrag(e, id) {
    State.selectedId = id; State.isDragging = true;
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
    if (e.key === 'Delete') { document.getElementById(item.id).remove(); State.items = State.items.filter(i => i.id !== item.id); }
    document.getElementById(item.id).setAttribute("transform", `translate(${item.x}, ${item.y}) rotate(${item.r}, ${item.w/2}, ${item.h/2})`);
};
