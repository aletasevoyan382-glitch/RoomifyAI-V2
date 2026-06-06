// State Management
const State = {
    canvas: document.getElementById('editor-canvas'),
    items: [],
    selectedId: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    mode: '2d'
};

const marketingView = document.getElementById('marketing-view');
const appView = document.getElementById('app-view');
const toast = document.getElementById('toast');
const registerForm = document.getElementById('register-form');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');
const stepUpload = document.getElementById('step-upload');
const stepEditor = document.getElementById('step-editor');
const canvasContainer = document.getElementById('canvas-container');

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : '#6366f1';
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showToast("Բարի գալուստ Roomify Ai:");
    marketingView.classList.add('hidden');
    appView.style.display = 'block';
});

dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleFiles(e.target.files);
dropZone.ondragover = (e) => e.preventDefault();
dropZone.ondrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };

async function handleFiles(files) {
    if (!files.length) return;
    uploadStatus.textContent = "Մշակվում է AI-ի կողմից...";
    const formData = new FormData();
    formData.append('file', files[0]);
    try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) initEditor(data.lines, data.image_size);
        else showToast(data.error, 'error');
    } catch (err) { showToast("Վերբեռնման սխալ:", 'error'); }
}

function initEditor(lines, size) {
    stepUpload.classList.add('hidden');
    stepEditor.classList.remove('hidden');
    const scale = Math.min(800 / size.width, 600 / size.height);
    lines.forEach(line => {
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", line.x1 * scale); l.setAttribute("y1", line.y1 * scale);
        l.setAttribute("x2", line.x2 * scale); l.setAttribute("y2", line.y2 * scale);
        l.setAttribute("stroke", "white"); l.setAttribute("stroke-width", "3");
        l.classList.add("wall-line");
        State.canvas.appendChild(l);
    });
}

const FURNITURE_MAP = {
    bed: { img: 'https://cdn-icons-png.flaticon.com/512/2321/2321390.png', w: 120, h: 150 },
    sofa: { img: 'https://cdn-icons-png.flaticon.com/512/2321/2321415.png', w: 150, h: 80 },
    table: { img: 'https://cdn-icons-png.flaticon.com/512/2321/2321405.png', w: 100, h: 100 },
    tv: { img: 'https://cdn-icons-png.flaticon.com/512/2321/2321420.png', w: 100, h: 20 },
    plant: { img: 'https://cdn-icons-png.flaticon.com/512/628/628324.png', w: 50, h: 50 }
};

window.addFurniture = (type) => {
    const config = FURNITURE_MAP[type];
    const id = 'f-' + Date.now();
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", id); group.setAttribute("transform", "translate(100, 100) rotate(0)");
    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", config.img);
    img.setAttribute("width", config.w); img.setAttribute("height", config.h);
    img.style.cursor = 'move';
    group.appendChild(img);
    group.onmousedown = (e) => startDrag(e, id);
    State.canvas.appendChild(group);
    State.items.push({ id, x: 100, y: 100, r: 0, w: config.w, h: config.h });
    selectItem(id);
};

function selectItem(id) {
    State.selectedId = id;
    State.items.forEach(item => {
        const el = document.getElementById(item.id);
        el.style.outline = (item.id === id) ? "2px dashed #6366f1" : "none";
    });
}

function startDrag(e, id) {
    e.stopPropagation(); selectItem(id); State.isDragging = true;
    const item = State.items.find(i => i.id === id);
    State.dragOffset = { x: e.clientX - item.x, y: e.clientY - item.y };
}

window.onmousemove = (e) => {
    if (!State.isDragging || !State.selectedId) return;
    const item = State.items.find(i => i.id === State.selectedId);
    item.x = e.clientX - State.dragOffset.x; item.y = e.clientY - State.dragOffset.y;
    const el = document.getElementById(item.id);
    el.setAttribute("transform", `translate(${item.x}, ${item.y}) rotate(${item.r}, ${item.w/2}, ${item.h/2})`);
};

window.onmouseup = () => { State.isDragging = false; };

window.setMode = (mode) => {
    State.mode = mode;
    if (mode === '3d') {
        canvasContainer.style.perspective = "1000px";
        State.canvas.style.transform = "rotateX(45deg) rotateZ(-20deg) scale(0.8)";
        State.canvas.style.transition = "transform 0.5s ease";
        document.querySelectorAll('.wall-line').forEach(l => { l.setAttribute("stroke-width", "10"); l.setAttribute("stroke", "#475569"); });
    } else {
        State.canvas.style.transform = "rotateX(0deg) rotateZ(0deg) scale(1)";
        document.querySelectorAll('.wall-line').forEach(l => { l.setAttribute("stroke-width", "3"); l.setAttribute("stroke", "white"); });
    }
    showToast(`Միացված է ${mode.toUpperCase()} ռեժիմը`);
};

window.onkeydown = (e) => {
    if (!State.selectedId) return;
    const item = State.items.find(i => i.id === State.selectedId);
    const el = document.getElementById(item.id);
    if (e.key === 'r' || e.key === 'R') item.r = (item.r + 15) % 360;
    else if (e.key === '+') { item.w *= 1.1; item.h *= 1.1; el.querySelector('image').setAttribute("width", item.w); el.querySelector('image').setAttribute("height", item.h); }
    else if (e.key === '-') { item.w *= 0.9; item.h *= 0.9; el.querySelector('image').setAttribute("width", item.w); el.querySelector('image').setAttribute("height", item.h); }
    else if (e.key === 'Delete') { el.remove(); State.items = State.items.filter(i => i.id !== item.id); State.selectedId = null; }
    el.setAttribute("transform", `translate(${item.x}, ${item.y}) rotate(${item.r}, ${item.w/2}, ${item.h/2})`);
};
