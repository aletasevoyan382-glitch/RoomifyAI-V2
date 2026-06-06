const State = {
    canvas: document.getElementById('editor-canvas'),
    items: [],
    selectedId: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    mode: '2d'
};

// 1. Auth & Navigation
document.getElementById('register-form').onsubmit = (e) => {
    e.preventDefault();
    showToast("Բարի գալուստ Roomify Ai Pro:");
    document.getElementById('marketing-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
};

function openModule(mode) {
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    if (mode === '3d') setTimeout(() => setMode('3d'), 500);
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3000);
}

// 2. Pro Assets (Icons8 - Ամենահուսալի աղբյուրը)
const ASSETS = {
    bed: { img: 'https://img.icons8.com/ios-filled/200/2563eb/double-bed.png', w: 140, h: 180 },
    sofa: { img: 'https://img.icons8.com/ios-filled/200/2563eb/sofa.png', w: 180, h: 90 },
    table: { img: 'https://img.icons8.com/ios-filled/200/2563eb/table.png', w: 100, h: 100 },
    plant: { img: 'https://img.icons8.com/ios-filled/200/2563eb/potted-plant.png', w: 60, h: 60 }
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
    img.style.filter = "drop-shadow(4px 4px 8px rgba(0,0,0,0.2))";

    group.appendChild(img);
    group.onmousedown = (e) => { selectItem(id); State.isDragging = true; };
    State.canvas.appendChild(group);
    State.items.push({ id, x: 400, y: 300, r: 0, w: config.w, h: config.h });
};

// 3. 3D Volume Logic
window.setMode = (mode) => {
    State.mode = mode;
    document.getElementById('btn-2d').classList.toggle('active', mode === '2d');
    document.getElementById('btn-3d').classList.toggle('active', mode === '3d');
    
    if (mode === '3d') {
        State.canvas.style.transform = "rotateX(50deg) rotateZ(-25deg) scale(0.8)";
        State.canvas.style.boxShadow = "30px 50px 100px rgba(0,0,0,0.2)";
        State.items.forEach(item => {
            const el = document.getElementById(item.id);
            el.style.filter = "drop-shadow(10px 20px 15px rgba(0,0,0,0.4))"; // Ծավալի էֆեկտ
        });
    } else {
        State.canvas.style.transform = "rotateX(0deg) rotateZ(0deg) scale(1)";
        State.items.forEach(item => {
            document.getElementById(item.id).style.filter = "drop-shadow(4px 4px 8px rgba(0,0,0,0.2))";
        });
    }
};

// 4. Drag & Controls
function selectItem(id) {
    State.selectedId = id;
    State.items.forEach(i => {
        const el = document.getElementById(i.id);
        el.style.outline = (i.id === id) ? "2px solid #3b82f6" : "none";
    });
}

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
    if (e.key === 'Delete') { document.getElementById(item.id).remove(); State.items = State.items.filter(i => i.id !== item.id); State.selectedId = null; return; }
    document.getElementById(item.id).setAttribute("transform", `translate(${item.x}, ${item.y}) rotate(${item.r}, ${item.w/2}, ${item.h/2})`);
};
