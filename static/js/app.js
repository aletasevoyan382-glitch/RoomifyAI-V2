// State Management
const State = {
    user: null,
    canvas: document.getElementById('editor-canvas'),
    items: [],
    selectedId: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
};

// UI Elements
const marketingView = document.getElementById('marketing-view');
const appView = document.getElementById('app-view');
const toast = document.getElementById('toast');
const registerForm = document.getElementById('register-form');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');
const stepUpload = document.getElementById('step-upload');
const stepEditor = document.getElementById('step-editor');

// Helper: Toast
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : '#6366f1';
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

// 1. Registration Logic
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
    };

    try {
        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.success) {
            showToast("Բարի գալուստ Roomify AI:");
            marketingView.classList.add('hidden');
            appView.style.display = 'block';
        } else {
            showToast(result.message, 'error');
        }
    } catch (err) {
        showToast("Կապի սխալ:", 'error');
    }
});

// 2. Upload Logic
dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => handleFiles(e.target.files);

dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = '#6366f1'; };
dropZone.ondragleave = () => { dropZone.style.borderColor = 'rgba(255,255,255,0.1)'; };
dropZone.ondrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };

async function handleFiles(files) {
    if (!files.length) return;
    const file = files[0];
    
    uploadStatus.textContent = "Մշակվում է AI-ի կողմից...";
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            initEditor(data.lines, data.image_size);
        } else {
            showToast(data.error, 'error');
            uploadStatus.textContent = "";
        }
    } catch (err) {
        showToast("Վերբեռնման սխալ:", 'error');
        uploadStatus.textContent = "";
    }
}

// 3. Editor Logic (SVG Based)
function initEditor(lines, size) {
    stepUpload.classList.add('hidden');
    stepEditor.classList.remove('hidden');

    // Scale canvas to fit room
    const scale = Math.min(800 / size.width, 600 / size.height);
    
    // Render Walls
    lines.forEach(line => {
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", line.x1 * scale);
        l.setAttribute("y1", line.y1 * scale);
        l.setAttribute("x2", line.x2 * scale);
        l.setAttribute("y2", line.y2 * scale);
        l.setAttribute("stroke", "gray");
        l.setAttribute("stroke-width", "2");
        l.setAttribute("stroke-dasharray", "5,5");
        State.canvas.appendChild(l);
    });
}

const FURNITURE_MAP = {
    bed: { icon: '🛏️', w: 80, h: 100 },
    sofa: { icon: '🛋️', w: 100, h: 60 },
    table: { icon: '🪑', w: 60, h: 60 },
    tv: { icon: '📺', w: 80, h: 15 },
    plant: { icon: '🪴', w: 40, h: 40 }
};

window.addFurniture = (type) => {
    const config = FURNITURE_MAP[type];
    const id = 'f-' + Date.now();
    
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", id);
    group.setAttribute("transform", "translate(100, 100) rotate(0)");
    group.style.cursor = 'move';

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", config.w);
    rect.setAttribute("height", config.h);
    rect.setAttribute("fill", "rgba(99, 102, 241, 0.2)");
    rect.setAttribute("stroke", "#6366f1");
    rect.setAttribute("stroke-width", "2");
    rect.setAttribute("rx", "5");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.textContent = config.icon;
    text.setAttribute("x", config.w / 2);
    text.setAttribute("y", config.h / 2 + 10);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "30px");

    group.appendChild(rect);
    group.appendChild(text);
    
    group.onmousedown = (e) => startDrag(e, id);
    State.canvas.appendChild(group);

    State.items.push({ id, x: 100, y: 100, r: 0, w: config.w, h: config.h });
    selectItem(id);
};

function selectItem(id) {
    State.selectedId = id;
    State.items.forEach(item => {
        const el = document.getElementById(item.id);
        el.querySelector('rect').setAttribute("stroke", item.id === id ? "white" : "#6366f1");
        el.querySelector('rect').setAttribute("stroke-width", item.id === id ? "3" : "2");
    });
}

function startDrag(e, id) {
    e.stopPropagation();
    selectItem(id);
    State.isDragging = true;
    const item = State.items.find(i => i.id === id);
    State.dragOffset = { x: e.clientX - item.x, y: e.clientY - item.y };
}

window.onmousemove = (e) => {
    if (!State.isDragging || !State.selectedId) return;
    const item = State.items.find(i => i.id === State.selectedId);
    item.x = e.clientX - State.dragOffset.x;
    item.y = e.clientY - State.dragOffset.y;
    
    const el = document.getElementById(item.id);
    el.setAttribute("transform", `translate(${item.x}, ${item.y}) rotate(${item.r})`);
};

window.onmouseup = () => { State.isDragging = false; };

// Keyboard Controls
window.onkeydown = (e) => {
    if (!State.selectedId) return;
    const item = State.items.find(i => i.id === State.selectedId);
    const el = document.getElementById(item.id);

    if (e.key === 'r' || e.key === 'R') {
        item.r = (item.r + 15) % 360;
    } else if (e.key === '+') {
        item.w *= 1.1; item.h *= 1.1;
        el.querySelector('rect').setAttribute("width", item.w);
        el.querySelector('rect').setAttribute("height", item.h);
        el.querySelector('text').setAttribute("x", item.w/2);
        el.querySelector('text').setAttribute("y", item.h/2 + 10);
    } else if (e.key === '-') {
        item.w *= 0.9; item.h *= 0.9;
        el.querySelector('rect').setAttribute("width", item.w);
        el.querySelector('rect').setAttribute("height", item.h);
        el.querySelector('text').setAttribute("x", item.w/2);
        el.querySelector('text').setAttribute("y", item.h/2 + 10);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
        el.remove();
        State.items = State.items.filter(i => i.id !== item.id);
        State.selectedId = null;
    }
    
    el.setAttribute("transform", `translate(${item.x}, ${item.y}) rotate(${item.r})`);
};

