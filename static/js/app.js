// State Management
const State = {
    user: null,
    canvas: document.getElementById('editor-canvas'),
    threeContainer: document.getElementById('three-container'),
    items: [],
    walls: [],
    selectedId: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    mode: '2d',
    three: {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        furnitureMeshes: {}
    }
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
    showToast("Բարի գալուստ Roomify Ai Pro:");
    marketingView.classList.add('hidden');
    appView.style.display = 'block';
});

// 2. Upload & AI Logic
dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleFiles(e.target.files);
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = '#6366f1'; };
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

// 3. Editor Logic
function initEditor(lines, size) {
    stepUpload.classList.add('hidden');
    stepEditor.classList.remove('hidden');
    const scale = Math.min(800 / size.width, 600 / size.height);
    
    State.walls = lines.map(line => ({
        x1: line.x1 * scale, y1: line.y1 * scale,
        x2: line.x2 * scale, y2: line.y2 * scale
    }));

    State.walls.forEach(line => {
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", line.x1); l.setAttribute("y1", line.y1);
        l.setAttribute("x2", line.x2); l.setAttribute("y2", line.y2);
        l.setAttribute("stroke", "#1e293b"); l.setAttribute("stroke-width", "4");
        State.canvas.appendChild(l);
    });

    initThree();
}

const ASSETS = {
    bed: { img: 'https://img.icons8.com/ios-filled/200/2563eb/double-bed.png', color: 0x5e35b1, w: 120, h: 160, depth: 50 },
    sofa: { img: 'https://img.icons8.com/ios-filled/200/2563eb/sofa.png', color: 0x1e88e5, w: 180, h: 80, depth: 60 },
    table: { img: 'https://img.icons8.com/ios-filled/200/2563eb/table.png', color: 0x795548, w: 100, h: 100, depth: 75 },
    tv: { img: 'https://img.icons8.com/ios-filled/200/2563eb/tv.png', color: 0x212121, w: 120, h: 20, depth: 100 },
    plant: { img: 'https://img.icons8.com/ios-filled/200/2563eb/potted-plant.png', color: 0x43a047, w: 50, h: 50, depth: 60 }
};

window.addFurniture = (type) => {
    const config = ASSETS[type];
    const id = 'f-' + Date.now();
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", id);
    group.setAttribute("transform", "translate(100, 100) rotate(0)");

    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", config.img);
    img.setAttribute("width", config.w); img.setAttribute("height", config.h);
    img.style.cursor = 'move';

    group.appendChild(img);
    group.onmousedown = (e) => { selectItem(id); State.isDragging = true; };
    State.canvas.appendChild(group);

    const item = { id, type, x: 100, y: 100, r: 0, w: config.w, h: config.h };
    State.items.push(item);
    addFurniture3D(item);
    selectItem(id);
};

function selectItem(id) {
    State.selectedId = id;
    State.items.forEach(i => {
        document.getElementById(i.id).style.outline = (i.id === id) ? "2px solid #3b82f6" : "none";
    });
}

window.onmousemove = (e) => {
    if (!State.isDragging || !State.selectedId) return;
    const item = State.items.find(i => i.id === State.selectedId);
    const CTM = State.canvas.getScreenCTM();
    item.x = (e.clientX - CTM.e) / CTM.a - item.w/2;
    item.y = (e.clientY - CTM.f) / CTM.d - item.h/2;
    syncItemTo3D(item);
};

function syncItemTo3D(item) {
    const el = document.getElementById(item.id);
    el.setAttribute("transform", `translate(${item.x}, ${item.y}) rotate(${item.r}, ${item.w/2}, ${item.h/2})`);
    
    const mesh = State.three.furnitureMeshes[item.id];
    if (mesh) {
        mesh.position.x = item.x + item.w/2 - 400;
        mesh.position.z = item.y + item.h/2 - 300;
        mesh.rotation.y = -item.r * (Math.PI / 180);
    }
}

window.onmouseup = () => State.isDragging = false;

// 4. Three.js Integration
function initThree() {
    const width = 800, height = 600;
    State.three.scene = new THREE.Scene();
    State.three.scene.background = new THREE.Color(0xf1f5f9);

    State.three.camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    State.three.camera.position.set(0, 800, 1000);

    State.three.renderer = new THREE.WebGLRenderer({ antialias: true });
    State.three.renderer.setSize(width, height);
    State.three.renderer.shadowMap.enabled = true;
    State.threeContainer.appendChild(State.three.renderer.domElement);

    State.three.controls = new THREE.OrbitControls(State.three.camera, State.three.renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    State.three.scene.add(ambientLight);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(500, 1000, 500);
    sun.castShadow = true;
    State.three.scene.add(sun);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(2000, 2000);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    State.three.scene.add(floor);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    State.walls.forEach(w => {
        const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
        const len = Math.sqrt(dx*dx + dy*dy);
        const wallGeo = new THREE.BoxGeometry(len, 250, 10);
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set((w.x1 + w.x2)/2 - 400, 125, (w.y1 + w.y2)/2 - 300);
        wall.rotation.y = -Math.atan2(dy, dx);
        wall.castShadow = true;
        wall.receiveShadow = true;
        State.three.scene.add(wall);
    });

    function animate() {
        requestAnimationFrame(animate);
        State.three.controls.update();
        State.three.renderer.render(State.three.scene, State.three.camera);
    }
    animate();
}

function addFurniture3D(item) {
    const config = ASSETS[item.type];
    const geo = new THREE.BoxGeometry(item.w, config.depth, item.h);
    const mat = new THREE.MeshStandardMaterial({ color: config.color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    State.three.furnitureMeshes[item.id] = mesh;
    State.three.scene.add(mesh);
    syncItemTo3D(item);
}

window.setMode = (mode) => {
    State.mode = mode;
    document.getElementById('btn-2d').classList.toggle('active', mode === '2d');
    document.getElementById('btn-3d').classList.toggle('active', mode === '3d');
    
    if (mode === '3d') {
        State.canvas.classList.add('hidden');
        State.threeContainer.classList.remove('hidden');
        showToast("Միացված է 3D տեսադաշտը");
    } else {
        State.canvas.classList.remove('hidden');
        State.threeContainer.classList.add('hidden');
        showToast("Միացված է 2D հատակագիծը");
    }
};

window.onkeydown = (e) => {
    if (!State.selectedId) return;
    const item = State.items.find(i => i.id === State.selectedId);
    if (e.key === 'r') item.r = (item.r + 15) % 360;
    if (e.key === '+') { item.w *= 1.1; item.h *= 1.1; document.getElementById(item.id).querySelector('image').setAttribute("width", item.w); document.getElementById(item.id).querySelector('image').setAttribute("height", item.h); }
    if (e.key === '-') { item.w *= 0.9; item.h *= 0.9; document.getElementById(item.id).querySelector('image').setAttribute("width", item.w); document.getElementById(item.id).querySelector('image').setAttribute("height", item.h); }
    if (e.key === 'Delete') {
        document.getElementById(item.id).remove();
        State.three.scene.remove(State.three.furnitureMeshes[item.id]);
        State.items = State.items.filter(i => i.id !== item.id);
        State.selectedId = null;
    }
    syncItemTo3D(item);
};
