const State = {
    canvas: document.getElementById('editor-canvas'),
    items: [],
    selectedId: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    mode: '2d'
};

function startApp() {
    document.getElementById('marketing-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
}

const FURNITURE_DATA = {
    bed: { img: 'https://i.ibb.co/L5hY5M7/bed-top.png', w: 140, h: 180 },
    sofa: { img: 'https://i.ibb.co/v4S6C2P/sofa-top.png', w: 180, h: 90 },
    table: { img: 'https://i.ibb.co/f4pSjP0/table-top.png', w: 110, h: 110 },
    plant: { img: 'https://i.ibb.co/mS6C9Wp/plant-top.png', w: 60, h: 60 }
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

    group.appendChild(img);
    group.onmousedown = (e) => startDrag(e, id);
    State.canvas.appendChild(group);

    State.items.push({ id, x: 300, y: 250, r: 0, w: config.w, h: config.h });
    selectItem(id);
};

function selectItem(id) {
    State.selectedId = id;
    document.getElementById('inspector-msg').classList.add('hidden');
    document.getElementById('controls').classList.remove('hidden');
    
    State.items.forEach(item => {
        const el = document.getElementById(item.id);
        el.style.filter = (item.id === id) ? "drop-shadow(0 0 8px #2563eb)" : "none";
    });
}

function startDrag(e, id) {
    e.stopPropagation();
    selectItem(id);
    State.isDragging = true;
    const item = State.items.find(i => i.id === id);
    const CTM = State.canvas.getScreenCTM();
    State.dragOffset = {
        x: (e.clientX - CTM.e) / CTM.a - item.x,
        y: (e.clientY - CTM.f) / CTM.d - item.y
    };
}

window.onmousemove = (e) => {
    if (!State.isDragging || !State.selectedId) return;
    const item = State.items.find(i => i.id === State.selectedId);
    const CTM = State.canvas.getScreenCTM();
    item.x = (e.clientX - CTM.e) / CTM.a - State.dragOffset.x;
    item.y = (e.clientY - CTM.f) / CTM.d - State.dragOffset.y;
    
    updateTransform(item);
};

function updateTransform(item) {
    const el = document.getElementById(item.id);
    el.setAttribute("transform", `translate(${item.x}, ${item.y}) rotate(${item.r}, ${item.w/2}, ${item.h/2})`);
}

window.onmouseup = () => { State.isDragging = false; };

window.setMode = (mode) => {
    State.mode = mode;
    document.getElementById('btn-2d').classList.toggle('active', mode === '2d');
    document.getElementById('btn-3d').classList.toggle('active', mode === '3d');
    
    const canvas = State.canvas;
    if (mode === '3d') {
        canvas.style.transform = "rotateX(50deg) rotateZ(-25deg) scale(0.75)";
        canvas.style.transition = "0.6s cubic-bezier(0.4, 0, 0.2, 1)";
        canvas.style.boxShadow = "40px 60px 100px rgba(0,0,0,0.3)";
    } else {
        canvas.style.transform = "rotateX(0deg) rotateZ(0deg) scale(1)";
    }
};

window.onkeydown = (e) => {
    if (!State.selectedId) return;
    const item = State.items.find(i => i.id === State.selectedId);
    if (e.key === 'r' || e.key === 'R') item.r = (item.r + 15) % 360;
    else if (e.key === '+') { item.w *= 1.1; item.h *= 1.1; const img = document.getElementById(item.id).querySelector('image'); img.setAttribute("width", item.w); img.setAttribute("height", item.h); }
    else if (e.key === '-') { item.w *= 0.9; item.h *= 0.9; const img = document.getElementById(item.id).querySelector('image'); img.setAttribute("width", item.w); img.setAttribute("height", item.h); }
    updateTransform(item);
};

window.deleteSelected = () => {
    if (!State.selectedId) return;
    document.getElementById(State.selectedId).remove();
    State.items = State.items.filter(i => i.id !== State.selectedId);
    State.selectedId = null;
    document.getElementById('inspector-msg').classList.remove('hidden');
    document.getElementById('controls').classList.add('hidden');
};
