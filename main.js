/**
 * amokado's Blast - Avant-Garde Edition
 * Core Logic & Rendering
 */

// --- Constants & Config ---
const CONFIG = {
    GRID_SIZE: 8,
    BLOCK_GAP: 6, // px
    ANIMATION_SPEED: 0.2, // spring duration
    COLORS: ['#4B4B4B'], // Default
    GRID_BG: 'rgba(255, 255, 255, 0.05)',
    GRID_CELL_BG: 'rgba(255, 255, 255, 0.08)'
};

const THEMES = {
    dark: {
        id: 'dark',
        icon: '🌙',
        colors: ['#7C3AED'], // Darker Rich Purple
        rgb: [124, 58, 237],
        bgRGB: { top: [8, 0, 20], bottom: [3, 0, 8] }, // Even darker background
        gridBG: 'rgba(124, 58, 237, 0.1)',
        gridCellBG: 'rgba(124, 58, 237, 0.15)',
        accent: '#f0f0f0'
    },
    light: {
        id: 'light',
        icon: '☀️',
        colors: ['#3498DB'], // Açık Mavi
        rgb: [52, 152, 219],
        bgRGB: { top: [245, 247, 250], bottom: [195, 207, 226] },
        gridBG: 'rgba(44, 62, 80, 0.12)', // Darkened from 0.03
        gridCellBG: 'rgba(44, 62, 80, 0.18)', // Darkened from 0.06
        accent: '#2C3E50'
    }
};

// --- Shape Definitions ---
// 1 = solid, 0 = empty
const SHAPES = [
    // Single
    [[1]],
    // Line 2
    [[1, 1]],
    [[1], [1]],
    // Line 3
    [[1, 1, 1]],
    [[1], [1], [1]],
    // Line 4
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
    // Corner / L (Small)
    [[1, 1], [1, 0]],
    [[1, 1], [0, 1]],
    [[1, 0], [1, 1]],
    [[0, 1], [1, 1]],
    // Square 2x2
    [[1, 1], [1, 1]],
    // L (Large)
    [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [0, 0, 1], [1, 1, 1]],
    [[1, 1, 1], [1, 0, 0], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1], [0, 0, 1]],

    // NEW USERS REQUESTED SHAPES
    // Square 3x3
    [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
    ],
    // Rect 2x3
    [
        [1, 1],
        [1, 1],
        [1, 1]
    ],
    // Rect 3x2
    [
        [1, 1, 1],
        [1, 1, 1]
    ],
    // L-Shapes (3x2 bounding box)
    // L
    [[1, 0], [1, 0], [1, 1]],
    [[0, 1], [0, 1], [1, 1]],
    [[1, 1], [1, 0], [1, 0]],
    [[1, 1], [0, 1], [0, 1]],
    // J (rotated Ls basically)
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1]],

    // Z-Shapes
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]],
    // Mirror Z (S) Shapes
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]],
    // T-Shapes
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],
    [[0, 1], [1, 1], [0, 1]]
];


// --- Helpers ---
function rotateMatrix90(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            rotated[c][rows - 1 - r] = matrix[r][c];
        }
    }
    return rotated;
}

function getUniqueRotations(shape) {
    const rotations = [shape];
    let current = shape;
    for (let i = 0; i < 3; i++) {
        current = rotateMatrix90(current);
        const currentStr = JSON.stringify(current);
        if (!rotations.some(r => JSON.stringify(r) === currentStr)) {
            rotations.push(current);
        }
    }
    return rotations;
}
class SoundManager {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTick() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playChime(count = 1) {
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
        const baseDelay = 0.08;
        const numNotes = Math.min(notes.length, count + 1);

        for (let i = 0; i < numNotes; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(notes[i], this.ctx.currentTime + i * baseDelay);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime + i * baseDelay);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * baseDelay + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + i * baseDelay);
            osc.stop(this.ctx.currentTime + i * baseDelay + 0.6);
        }
    }
}


// --- Class: Game ---
class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: true });

        // State
        this.grid = Array(CONFIG.GRID_SIZE).fill().map(() => Array(CONFIG.GRID_SIZE).fill(null));
        this.blocks = []; // The 3 available blocks below
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('blockBlastHighScore')) || 0;
        this.isGameOver = false;

        // Update initial UI
        document.getElementById('best-score-value').innerText = this.highScore;

        // Layout metrics (calculated on resize)
        this.metrics = {
            width: 0,
            height: 0,
            gridSize: 0, // px size of the 8x8 grid
            cellSize: 0,
            gridX: 0,
            gridY: 0,
            blockAreaY: 0 // Y start of the bottom area
        };

        // Interactions & Effects
        this.draggingBlock = null;
        this.pointer = { x: 0, y: 0, isDown: false };
        this.floatingTexts = [];
        this.particles = [];
        this.potentialClears = { rows: [], cols: [] };
        this.previewStartTime = 0;
        this.lastPlacementKey = "";
        this.activePointerId = null; // Track primary dragging finger

        // NEW Advanced Features
        this.sound = new SoundManager();
        this.combo = 0;
        this.shake = 0; // Screen shake intensity

        // Theme System & Transitions
        this.themeTransition = {
            active: false,
            start: 0,
            duration: 500, // ms
            from: null,
            to: null
        };

        try {
            this.currentTheme = localStorage.getItem('blockBlastTheme') || 'dark';
            this.applyTheme(this.currentTheme, true);
        } catch (e) {
            this.applyTheme('dark', true);
        }

        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Delay init slightly to ensure container metrics are ready
        setTimeout(() => this.init(), 60);
    }

    toggleTheme() {
        const oldThemeId = this.currentTheme;
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('blockBlastTheme', this.currentTheme);

        // Start Canvas Transition
        this.themeTransition.active = true;
        this.themeTransition.start = Date.now();
        this.themeTransition.from = THEMES[oldThemeId];
        this.themeTransition.to = THEMES[this.currentTheme];

        this.applyTheme(this.currentTheme, false);

        // SYNC ALL BLOCKS: Update colors to new theme palette
        const updateColor = (oldColor, oldPalette, newPalette) => {
            const idx = oldPalette.indexOf(oldColor);
            return newPalette[idx] || newPalette[0]; // Map by index
        };

        const oldPalette = THEMES[oldThemeId].colors;
        const newPalette = THEMES[this.currentTheme].colors;

        // Tray Blocks
        this.blocks.forEach(block => {
            block.color = updateColor(block.color, oldPalette, newPalette);
        });

        // Grid Blocks (placed)
        for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
            for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
                if (this.grid[r][c]) {
                    this.grid[r][c] = updateColor(this.grid[r][c], oldPalette, newPalette);
                }
            }
        }
    }

    lerpColor(color1, color2, factor) {
        // color1/2 are [r,g,b] arrays
        const r = Math.round(color1[0] + (color2[0] - color1[0]) * factor);
        const g = Math.round(color1[1] + (color2[1] - color1[1]) * factor);
        const b = Math.round(color1[2] + (color2[2] - color1[2]) * factor);
        return `rgb(${r}, ${g}, ${b})`;
    }

    getThemeBG(themeId) {
        return themeId === 'dark' ? [8, 0, 20] : [220, 225, 235]; // Deepest Purple-Black
    }

    getCellBG(themeId) {
        return themeId === 'dark' ? [15, 5, 30] : [190, 205, 225]; // Deeper Purple
    }

    applyTheme(themeId, immediate = false) {
        if (!THEMES[themeId]) themeId = 'dark';
        const theme = THEMES[themeId];
        this.currentTheme = themeId;

        document.documentElement.setAttribute('data-theme', themeId);
        const iconEl = document.getElementById('theme-icon');
        if (iconEl) iconEl.innerText = theme.icon;

        // Update CONFIG
        CONFIG.COLORS = theme.colors ? [...theme.colors] : ['#4B4B4B'];
        CONFIG.GRID_BG = theme.gridBG;
        CONFIG.GRID_CELL_BG = theme.gridCellBG;

        // Cache theme for fast access in render
        this.themeActive = theme;

        if (immediate) {
            this.themeTransition.active = false;
            // Set initial background variables
            const topArr = theme.bgRGB.top;
            const botArr = theme.bgRGB.bottom;
            document.documentElement.style.setProperty('--bg-dynamic-top', `rgb(${topArr[0]}, ${topArr[1]}, ${topArr[2]})`);
            document.documentElement.style.setProperty('--bg-dynamic-bottom', `rgb(${botArr[0]}, ${botArr[1]}, ${botArr[2]})`);
        }
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input Listeners
        this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
        window.addEventListener('pointermove', (e) => this.handlePointerMove(e));
        window.addEventListener('pointerup', (e) => this.handlePointerUp(e));

        // Global right-click disable for rotation mechanics
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const pos = this.getPointerPos(e);

            // 1. If dragging, rotate the dragged block
            if (this.draggingBlock) {
                this.rotateBlock(this.blocks[this.draggingBlock.index]);
                return;
            }

            // 2. If not dragging, check if clicking a tray block
            for (const block of this.blocks) {
                if (block.placed) continue;
                const hitDist = 60;
                const dx = pos.x - block.x;
                const dy = pos.y - block.y;
                if (Math.sqrt(dx * dx + dy * dy) < hitDist) {
                    this.rotateBlock(block);
                    this.updateBlockPositions();
                    break;
                }
            }
        });

        // Start
        this.spawnBlocks();
        this.loop();
    }



    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;

        // Use precise client size
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;

        this.canvas.width = w;
        this.canvas.height = h;

        this.metrics.width = w;
        this.metrics.height = h;

        // Adaptive Grid Size
        const isPortrait = h > w;
        const padding = isPortrait ? 10 : 20; // Reduced padding for portrait

        const availableWidth = w - (padding * 2);

        // On small heights, be more aggressive with space
        let verticalLimitFactor = 0.5;
        if (h < 700) verticalLimitFactor = 0.55;
        if (h < 600) verticalLimitFactor = 0.6;

        const availableHeight = isPortrait ? h * verticalLimitFactor : h * 0.6;

        const gridPixelSize = Math.min(availableWidth, availableHeight, 500);

        this.metrics.gridSize = gridPixelSize;
        this.metrics.cellSize = gridPixelSize / CONFIG.GRID_SIZE;

        this.metrics.gridX = (w - gridPixelSize) / 2;

        // Push grid higher on short screens
        let gridTopOffset = 80;
        if (isPortrait) {
            if (h < 700) gridTopOffset = 60;
            if (h < 600) gridTopOffset = 45;
        } else {
            gridTopOffset = padding + 10;
        }

        this.metrics.gridY = gridTopOffset;

        // Block Area (Tray) - Adjust spacing based on height
        let traySpacing = isPortrait ? 60 : 40;
        if (isPortrait && h < 700) traySpacing = 40;
        if (isPortrait && h < 600) traySpacing = 30;

        this.metrics.blockAreaY = this.metrics.gridY + gridPixelSize + traySpacing;

        this.updateBlockPositions();
    }

    spawnBlocks() {
        this.blocks = [];

        // --- Difficulty Calculation ---
        // difficulty ranges from 0.0 (starter) to 1.0 (max)
        const difficulty = Math.min(1.0, this.score / 10000);

        // 1. Get Fitting Shapes
        const fittingShapes = this.getFittingShapes();

        // 2. Calculate Grid Fullness
        let occupied = 0;
        for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
            for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
                if (this.grid[r][c] !== null) occupied++;
            }
        }
        const fullness = occupied / (CONFIG.GRID_SIZE * CONFIG.GRID_SIZE);

        let candidates = [];
        let attempts = 0;
        const MAX_ATTEMPTS = 5;

        while (candidates.length < 3 && attempts < MAX_ATTEMPTS) {
            attempts++;
            const currentPool = [];

            // Evaluat board health for each shape
            for (const shape of fittingShapes) {
                let bestScore = -Infinity;
                for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
                    for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
                        if (this.canPlace(shape, c, r)) {
                            const simGrid = this.simulatePlacement(this.grid, shape, c, r);
                            const score = this.evaluateBoard(simGrid);
                            if (score > bestScore) bestScore = score;
                        }
                    }
                }

                // --- Difficulty Adjustment on Shape Weight ---
                // Larger shapes get a slight 'score' boost at high difficulty to be picked more often
                const shapeSize = shape.flat().filter(x => x === 1).length;
                let weighting = 0;
                if (difficulty > 0.3 && shapeSize >= 4) weighting += (difficulty * 20);
                if (shapeSize === 1) weighting -= (difficulty * 5); // Slightly favor other things over single blocks at high diff, but still keep them possible

                currentPool.push({ shape, score: bestScore + weighting });
            }

            // Sort by adjusted score
            currentPool.sort((a, b) => b.score - a.score);

            // --- Mercy Logic vs Difficulty ---
            // Early game: Add more randomness/entropy to avoid repetitive sets
            // We'll shuffle the top part of the pool slightly or increase pool range

            let mercyRange = 0.2 + (difficulty * 0.6); // 0.2 to 0.8
            // If difficulty is low, force a larger pool to avoid "same blocks" syndrome
            if (difficulty < 0.2) mercyRange = Math.max(mercyRange, 0.5);

            // If grid is very full, always be a bit more merciful
            if (fullness > 0.7) mercyRange = Math.max(0.2, mercyRange - 0.3);

            const poolLimit = Math.ceil(currentPool.length * mercyRange);
            let poolToUse = currentPool.slice(0, poolLimit);

            // Shuffle the poolToUse slightly to provide variety even among "good" blocks
            poolToUse = poolToUse.sort(() => Math.random() - 0.5);

            if (poolToUse.length === 0) break;

            const selection = [];
            const tempPool = [...poolToUse];

            for (let j = 0; j < 3; j++) {
                if (tempPool.length === 0) break;

                // Favor variety: Try to pick a shape we haven't picked for this set yet
                let pickedIndex = Math.floor(Math.random() * tempPool.length);
                const item = tempPool[pickedIndex];
                selection.push(item.shape);

                // Remove similar shapes from temp pool to force variety in these 3
                if (tempPool.length > 5) { // Only force variety if we have enough options
                    const itemStr = JSON.stringify(item.shape);
                    for (let k = tempPool.length - 1; k >= 0; k--) {
                        if (JSON.stringify(tempPool[k].shape) === itemStr) {
                            tempPool.splice(k, 1);
                        }
                    }
                }
            }

            if (selection.length < 3) {
                // Not enough unique ones? Fill rest with randoms from full poolToUse
                while (selection.length < 3) {
                    selection.push(poolToUse[Math.floor(Math.random() * poolToUse.length)].shape);
                }
            }

            // SEQUENCE VALIDATION
            if (this.checkSequenceStep(this.grid, selection)) {
                candidates = selection;
                break;
            }
        }

        // Fallback
        if (candidates.length < 3) {
            const smallShapes = SHAPES.filter(s => s.flat().filter(x => x === 1).length <= 2);
            for (let i = 0; i < 3; i++) {
                candidates.push(smallShapes[Math.floor(Math.random() * smallShapes.length)]);
            }
        }

        for (let i = 0; i < 3; i++) {
            const color = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
            this.blocks.push({
                shape: candidates[i].map(row => [...row]),
                color: color,
                x: 0,
                y: 0,
                baseScale: 0.6,
                currentScale: 0.6,
                rotationAnim: 0,
                rotationTarget: 0,
                isDragging: false,
                placed: false
            });
        }

        this.updateBlockPositions();
        this.checkGameOver();
    }

    updateBlockPositions() {
        // Distribute blocks evenly in the bottom area
        const areaWidth = this.metrics.width;
        const slotWidth = areaWidth / 3;
        const startY = this.metrics.blockAreaY + 50; // Center effectively

        this.blocks.forEach((block, index) => {
            if (!block.isDragging) {
                block.x = (slotWidth * index) + (slotWidth / 2);
                block.y = startY;
            }
        });
    }

    // --- Input Handling ---

    getPointerPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handlePointerDown(e) {
        if (this.isGameOver) return;

        // Ensure AudioContext is started on first interaction
        this.sound.init();

        const pos = this.getPointerPos(e);

        // Multi-touch rotation check (Mobile Only)
        if (this.draggingBlock && e.pointerType === 'touch' && this.activePointerId !== null && e.pointerId !== this.activePointerId) {
            this.rotateBlock(this.blocks[this.draggingBlock.index]);
            return;
        }

        // Only start a new drag if not already dragging and not a right-click
        if (!this.draggingBlock) {
            const isRightClick = e.button === 2 || e.which === 3;
            if (isRightClick) return; // Handled by contextmenu listener

            // Check availability
            for (let i = 0; i < this.blocks.length; i++) {
                const block = this.blocks[i];
                if (block.placed) continue;

                const hitDist = 60;
                const dx = pos.x - block.x;
                const dy = pos.y - block.y;

                if (Math.sqrt(dx * dx + dy * dy) < hitDist) {
                    const isTouch = e.pointerType === 'touch';
                    this.pointer.isDown = true;
                    this.pointer.x = pos.x;
                    this.pointer.y = pos.y;
                    this.activePointerId = e.pointerId;

                    this.draggingBlock = {
                        index: i,
                        liftHeight: isTouch ? 150 : 100,
                        startScale: block.currentScale
                    };

                    block.isDragging = true;
                    block.currentScale = 1.0;
                    block.x = pos.x;
                    block.y = pos.y - this.draggingBlock.liftHeight;
                    return;
                }
            }
        }
    }

    handlePointerMove(e) {
        if (this.draggingBlock && e.pointerId !== this.activePointerId) return;

        const pos = this.getPointerPos(e);
        this.pointer.x = pos.x;
        this.pointer.y = pos.y;

        if (this.draggingBlock) {
            const block = this.blocks[this.draggingBlock.index];
            block.x = pos.x;
            block.y = pos.y - this.draggingBlock.liftHeight;
        }
    }

    handlePointerUp(e) {
        if (this.draggingBlock && e.pointerId !== this.activePointerId) return;

        if (this.draggingBlock) {
            const idx = this.draggingBlock.index;
            const block = this.blocks[idx];

            const placedParams = this.calculateGridPlacement(block);

            if (placedParams) {
                this.placeBlock(block, placedParams.gridCol, placedParams.gridRow);
            } else {
                block.isDragging = false;
                block.currentScale = block.baseScale;
                this.updateBlockPositions();
            }

            this.draggingBlock = null;
            this.activePointerId = null;
        }
        this.pointer.isDown = false;
    }

    // --- Game Logic ---

    // Returns { gridCol, gridRow } or null
    calculateGridPlacement(block) {
        // Find top-left of the block shape in world space
        // block.x/y is center of block bounding box

        const rows = block.shape.length;
        const cols = block.shape[0].length;

        // Calculate visual width/height of block
        const blockW = cols * this.metrics.cellSize;
        const blockH = rows * this.metrics.cellSize;

        // Top-left of the block visual
        const blockDisplayX = block.x - (blockW / 2);
        const blockDisplayY = block.y - (blockH / 2);

        // Approximate which cell index this corresponds to
        // We want the block's top-left cell (0,0 of shape) to align with a grid cell
        const rawCol = Math.round((blockDisplayX - this.metrics.gridX) / this.metrics.cellSize);
        const rawRow = Math.round((blockDisplayY - this.metrics.gridY) / this.metrics.cellSize);

        // Validate legality
        if (this.canPlace(block.shape, rawCol, rawRow)) {
            return { gridCol: rawCol, gridRow: rawRow };
        }

        return null;
    }

    canPlace(shape, startCol, startRow) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    const targetCol = startCol + c;
                    const targetRow = startRow + r;

                    // Out of bounds
                    if (targetCol < 0 || targetCol >= CONFIG.GRID_SIZE || targetRow < 0 || targetRow >= CONFIG.GRID_SIZE) {
                        return false;
                    }

                    // Already occupied
                    if (this.grid[targetRow][targetCol] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    getFittingShapes() {
        const fitting = [];
        for (const shape of SHAPES) {
            const rotations = getUniqueRotations(shape);
            let canFit = false;

            for (const rotShape of rotations) {
                for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
                    for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
                        if (this.canPlace(rotShape, c, r)) {
                            canFit = true;
                            break;
                        }
                    }
                    if (canFit) break;
                }
                if (canFit) break;
            }
            if (canFit) fitting.push(shape);
        }
        return fitting;
    }

    evaluateBoard(grid) {
        let score = 0;
        let occupied = 0;

        // 1. Fullness Penalty
        for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
            for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
                if (grid[r][c] !== null) occupied++;
            }
        }
        const fullness = occupied / (CONFIG.GRID_SIZE * CONFIG.GRID_SIZE);
        score -= fullness * 100;

        // 2. Line Potential (Rows/Cols nearly full are good)
        for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
            let rowCount = 0;
            for (let c = 0; c < CONFIG.GRID_SIZE; c++) if (grid[r][c] !== null) rowCount++;
            if (rowCount > 0 && rowCount < CONFIG.GRID_SIZE) {
                score += (rowCount / CONFIG.GRID_SIZE) * 10;
            }
        }
        for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
            let colCount = 0;
            for (let r = 0; r < CONFIG.GRID_SIZE; r++) if (grid[r][c] !== null) colCount++;
            if (colCount > 0 && colCount < CONFIG.GRID_SIZE) {
                score += (colCount / CONFIG.GRID_SIZE) * 10;
            }
        }

        // 3. Fragmentation Penalty (Isolated empty cells are bad)
        for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
            for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
                if (grid[r][c] === null) {
                    let neighbors = 0;
                    if (r > 0 && grid[r - 1][c] !== null) neighbors++;
                    if (r < CONFIG.GRID_SIZE - 1 && grid[r + 1][c] !== null) neighbors++;
                    if (c > 0 && grid[r][c - 1] !== null) neighbors++;
                    if (c < CONFIG.GRID_SIZE - 1 && grid[r][c + 1] !== null) neighbors++;
                    if (neighbors >= 3) score -= 15;
                }
            }
        }

        return score;
    }

    simulatePlacement(grid, shape, col, row) {
        const newGrid = grid.map(r => [...r]);
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    newGrid[row + r][col + c] = 'SIM';
                }
            }
        }

        // Apply clears in simulation
        let clearedRows = [];
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            if (newGrid[y].every(cell => cell !== null)) clearedRows.push(y);
        }
        clearedRows.forEach(y => newGrid[y].fill(null));

        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
            let full = true;
            for (let y = 0; y < CONFIG.GRID_SIZE; y++) if (newGrid[y][x] === null) { full = false; break; }
            if (full) {
                for (let y = 0; y < CONFIG.GRID_SIZE; y++) newGrid[y][x] = null;
            }
        }
        return newGrid;
    }

    checkSequenceStep(grid, remainingShapes) {
        if (remainingShapes.length === 0) return true;

        const baseShape = remainingShapes[0];
        const rotations = getUniqueRotations(baseShape);
        const nextRemaining = remainingShapes.slice(1);

        for (const shape of rotations) {
            for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
                for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
                    // Optimized canFit check
                    let canFit = true;
                    for (let sr = 0; sr < shape.length; sr++) {
                        for (let sc = 0; sc < shape[sr].length; sc++) {
                            if (shape[sr][sc] === 1) {
                                const tr = r + sr;
                                const tc = c + sc;
                                if (tr < 0 || tr >= CONFIG.GRID_SIZE || tc < 0 || tc >= CONFIG.GRID_SIZE || grid[tr][tc] !== null) {
                                    canFit = false;
                                    break;
                                }
                            }
                        }
                        if (!canFit) break;
                    }

                    if (canFit) {
                        const nextGrid = this.simulatePlacement(grid, shape, c, r);
                        if (this.checkSequenceStep(nextGrid, nextRemaining)) return true;
                    }
                }
            }
        }
        return false;
    }

    getPotentialClears(shape, startCol, startRow) {
        const rows = [];
        const cols = [];

        // Create a temporary representation of the grid after placement
        const tempGrid = this.grid.map(row => [...row]);
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    tempGrid[startRow + r][startCol + c] = 'PREVIEW';
                }
            }
        }

        // Check rows
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            if (tempGrid[y].every(cell => cell !== null)) {
                rows.push(y);
            }
        }

        // Check cols
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
            let colFilled = true;
            for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
                if (tempGrid[y][x] === null) {
                    colFilled = false;
                    break;
                }
            }
            if (colFilled) cols.push(x);
        }

        return { rows, cols };
    }

    placeBlock(block, c, r) {
        block.placed = true;
        this.sound.playTick();

        // Update grid
        for (let py = 0; py < block.shape.length; py++) {
            for (let px = 0; px < block.shape[py].length; px++) {
                if (block.shape[py][px] === 1) {
                    this.grid[r + py][c + px] = block.color;

                    // Simple particle burst
                    this.spawnParticles((c + px), (r + py), block.color);
                }
            }
        }

        // Check for Clears
        this.checkClears();

        // Check if all blocks used
        const allUsed = this.blocks.every(b => b.placed);
        if (allUsed) {
            this.spawnBlocks();
        } else {
            this.checkGameOver();
        }
    }

    rotateBlock(block) {
        if (!block || block.placed) return;

        // Update logical shape
        block.shape = rotateMatrix90(block.shape);

        // Visual offset animation:
        // We jumped logically 90deg, so we set visual offset to -90deg
        // and let it spring back to 0.
        block.rotationAnim = -Math.PI / 2;

        // Feedback
        this.sound.playTick();
        this.shake = 2; // Subtle feedback shake
    }

    spawnParticles(gx, gy, color) {
        const startX = this.metrics.gridX + (gx * this.metrics.cellSize) + (this.metrics.cellSize / 2);
        const startY = this.metrics.gridY + (gy * this.metrics.cellSize) + (this.metrics.cellSize / 2);

        // Simpler, cleaner particles
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: startX,
                y: startY,
                vx: (Math.random() - 0.5) * 6, // Slower explosion
                vy: (Math.random() - 0.5) * 6,
                life: 1.0,
                color: color,
                size: (Math.random() * 4) + 2 // Randomized size
            });
        }
    }

    checkClears() {
        let linesCleared = 0;
        const rowsToClear = [];
        const colsToClear = [];

        // Check rows
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            if (this.grid[y].every(cell => cell !== null)) {
                rowsToClear.push(y);
            }
        }

        // Check cols
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
            let colFilled = true;
            for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
                if (this.grid[y][x] === null) colFilled = false;
            }
            if (colFilled) colsToClear.push(x);
        }

        // Execute Clears
        // TODO: Animate this rather than instant
        rowsToClear.forEach(r => {
            for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
                this.grid[r][c] = null;
                this.spawnParticles(c, r, '#FFFFFF');
            }
            linesCleared++;
        });

        colsToClear.forEach(c => {
            for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
                this.grid[r][c] = null;
                this.spawnParticles(c, r, '#FFFFFF');
            }
            linesCleared++;
        });

        if (linesCleared > 0) {
            this.combo++;

            // Scoring: 10 per block placed + 100 per line * multiplier * combo
            const points = linesCleared * 100 * linesCleared * this.combo;
            this.updateScore(points);

            // Screen Shake for big clears
            if (linesCleared >= 1) {
                this.shake = Math.min(20, linesCleared * 6);
            }

            // Play Chime based on lines cleared
            this.sound.playChime(linesCleared);

            // Floating Text for the score
            // Find roughly the center of the cleared area for the text spawn
            let targetX = this.metrics.width / 2;
            let targetY = this.metrics.height / 2;

            if (rowsToClear.length > 0) {
                targetY = this.metrics.gridY + (rowsToClear[Math.floor(rowsToClear.length / 2)] * this.metrics.cellSize);
            } else if (colsToClear.length > 0) {
                targetX = this.metrics.gridX + (colsToClear[Math.floor(colsToClear.length / 2)] * this.metrics.cellSize);
            }

            this.floatingTexts.push({
                x: targetX,
                y: targetY,
                text: `+${points}${this.combo > 1 ? ` (x${this.combo})` : ''}`,
                life: 1.0,
                color: this.themeActive.accent
            });

        } else {
            this.combo = 0; // Reset combo if no line cleared
            this.updateScore(10); // Standard placement points
        }
    }

    updateScore(pts) {
        this.score += pts;
        document.getElementById('score-value').innerText = this.score;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('blockBlastHighScore', this.highScore);
            document.getElementById('best-score-value').innerText = this.highScore;
        }
    }

    checkGameOver() {
        // If no blocks left to place, no game over check needed yet (next spawn handles it)
        // But here we check if ANY of the AVAILABLE blocks can fit ANYWHERE.

        const available = this.blocks.filter(b => !b.placed);
        if (available.length === 0) return; // Wait for respawn

        let canMove = false;

        // Loop through all available blocks
        for (const block of available) {
            const rotations = getUniqueRotations(block.shape);

            for (const rotShape of rotations) {
                // Try every position on grid
                for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
                    for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
                        if (this.canPlace(rotShape, c, r)) {
                            canMove = true;
                            break;
                        }
                    }
                    if (canMove) break;
                }
                if (canMove) break;
            }
            if (canMove) break;
        }

        if (!canMove) {
            this.gameOver();
        }
    }

    gameOver() {
        this.isGameOver = true;

        // Populate scores in modal
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('best-score-modal').innerText = this.highScore;

        document.getElementById('game-over-modal').classList.remove('hidden');
        document.getElementById('restart-btn').onclick = () => {
            document.getElementById('game-over-modal').classList.add('hidden');
            this.reset();
        };
    }

    reset() {
        // Reset state
        this.grid = Array(CONFIG.GRID_SIZE).fill().map(() => Array(CONFIG.GRID_SIZE).fill(null));
        this.blocks = [];
        this.score = 0;
        this.isGameOver = false;
        this.combo = 0;
        this.shake = 0;
        this.floatingTexts = [];
        this.particles = [];
        this.potentialClears = { rows: [], cols: [] };

        // Update UI
        document.getElementById('score-value').innerText = '0';

        // Re-init spawning
        this.spawnBlocks();
    }

    // --- Rendering ---

    drawRoundedRect(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.arcTo(x + w, y, x + w, y + h, r);
        this.ctx.arcTo(x + w, y + h, x, y + h, r);
        this.ctx.arcTo(x, y + h, x, y, r);
        this.ctx.arcTo(x, y, x + w, y, r);
        this.ctx.closePath();
    }

    renderGrid(themeFactor = 1.0) {
        // Background Grid
        const gs = this.metrics.cellSize;
        const gap = CONFIG.BLOCK_GAP;
        const r = 4; // corner radius
        const now = Date.now();

        // Calculate blended grid cell BG
        let currentCellBG = CONFIG.GRID_CELL_BG;
        if (this.themeTransition.active) {
            const fromCellBG = this.getCellBG(this.themeTransition.from.id);
            const toCellBG = this.getCellBG(this.themeTransition.to.id);
            currentCellBG = this.lerpColor(fromCellBG, toCellBG, themeFactor);
        }

        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                const drawX = this.metrics.gridX + (x * gs) + gap / 2;
                const drawY = this.metrics.gridY + (y * gs) + gap / 2;
                const size = gs - gap;

                // Empty Cell
                this.ctx.fillStyle = currentCellBG;
                this.drawRoundedRect(drawX, drawY, size, size, r);
                this.ctx.fill();

                // Check if this cell is part of a potential clear
                const isPotential = this.potentialClears.rows.includes(y) || this.potentialClears.cols.includes(x);

                // Use a one-shot linear transition to white
                let color = this.grid[y][x];
                if (isPotential) {
                    const duration = 300; // ms
                    const elapsed = now - this.previewStartTime;
                    const previewProgress = Math.min(1, elapsed / duration);

                    // Interpolate between theme base and white
                    const baseRGB = this.themeActive.rgb;
                    const r_val = Math.round(baseRGB[0] + (255 - baseRGB[0]) * previewProgress);
                    const g_val = Math.round(baseRGB[1] + (255 - baseRGB[1]) * previewProgress);
                    const b_val = Math.round(baseRGB[2] + (255 - baseRGB[2]) * previewProgress);
                    color = `rgb(${r_val}, ${g_val}, ${b_val})`;
                }

                if (color) {
                    this.ctx.fillStyle = color;

                    if (this.themeTransition.active && !isPotential) {
                        const fromRGB = this.themeTransition.from.rgb;
                        const toRGB = this.themeTransition.to.rgb;
                        this.ctx.fillStyle = this.lerpColor(fromRGB, toRGB, themeFactor);
                    }

                    // Slight shadow
                    this.ctx.shadowColor = 'rgba(0,0,0,0.1)';
                    this.ctx.shadowBlur = 4;
                    this.ctx.shadowOffsetY = 2;

                    this.drawRoundedRect(drawX, drawY, size, size, r);
                    this.ctx.fill();

                    this.ctx.shadowColor = 'transparent'; // reset

                    if (isPotential) {
                        // Sparkle Effect
                        this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
                        for (let i = 0; i < 3; i++) {
                            const offset = (now + (i * 1000)) % 1000 / 1000;
                            const sx = drawX + (Math.sin(now * 0.01 + i) * 0.4 + 0.5) * size;
                            const sy = drawY + (Math.cos(now * 0.015 + i * 2) * 0.4 + 0.5) * size;
                            const sSize = (1 - offset) * 3;
                            if (sSize > 0) {
                                this.ctx.fillRect(sx - sSize / 2, sy - sSize / 2, sSize, sSize);
                            }
                        }
                    }
                }
            }
        }
    }

    render() {
        // Calculate Theme Transition
        let themeFactor = 1.0;
        if (this.themeTransition.active) {
            const elapsed = Date.now() - this.themeTransition.start;
            themeFactor = Math.min(1.0, elapsed / this.themeTransition.duration);

            // Background Interpolation (Top & Bottom)
            const fromBG = this.themeTransition.from.bgRGB;
            const toBG = this.themeTransition.to.bgRGB;

            const currentTop = this.lerpColor(fromBG.top, toBG.top, themeFactor);
            const currentBottom = this.lerpColor(fromBG.bottom, toBG.bottom, themeFactor);

            document.documentElement.style.setProperty('--bg-dynamic-top', currentTop);
            document.documentElement.style.setProperty('--bg-dynamic-bottom', currentBottom);

            if (themeFactor >= 1.0) {
                this.themeTransition.active = false;
            }
        }

        // Handle Screen Shake
        this.ctx.save();
        if (this.shake > 0) {
            const sx = (Math.random() - 0.5) * this.shake;
            const sy = (Math.random() - 0.5) * this.shake;
            this.ctx.translate(sx, sy);
            this.shake *= 0.85; // Natural decay
            if (this.shake < 0.1) this.shake = 0;
        }

        // Clear (with margin for shake)
        this.ctx.clearRect(-100, -100, this.canvas.width + 200, this.canvas.height + 200);

        // Reset potential clears
        this.potentialClears = { rows: [], cols: [] };

        // Logic: Calculate potential clears based on drag
        if (this.draggingBlock) {
            const block = this.blocks[this.draggingBlock.index];
            const placement = this.calculateGridPlacement(block);
            if (placement) {
                const newPotential = this.getPotentialClears(block.shape, placement.gridCol, placement.gridRow);
                const key = `R:${newPotential.rows.join(',')}|C:${newPotential.cols.join(',')}`;
                if (key !== this.lastPlacementKey) {
                    this.previewStartTime = Date.now();
                    this.lastPlacementKey = key;
                }
                this.potentialClears = newPotential;
            } else {
                this.lastPlacementKey = "";
            }
        } else {
            this.lastPlacementKey = "";
        }

        // Interpolate rotation for all blocks
        this.blocks.forEach(block => {
            if (Math.abs(block.rotationAnim) > 0.001) {
                // Spring-ish interpolation back to 0
                block.rotationAnim *= 0.8;
            } else {
                block.rotationAnim = 0;
            }
        });

        // Draw Grid
        this.renderGrid(themeFactor);

        // Draw Tray Blocks
        this.blocks.forEach(block => {
            if (block.placed) return;
            this.drawBlock(block, themeFactor);
        });

        // Effects
        this.updateAndDrawParticles();
        this.updateAndDrawFloatingTexts();

        // Debug Ghost
        if (this.draggingBlock) {
            const block = this.blocks[this.draggingBlock.index];
            const placement = this.calculateGridPlacement(block);
            if (placement) {
                this.drawGhost(placement.gridCol, placement.gridRow, block, themeFactor);
            }
        }

        this.ctx.restore();
    }

    updateAndDrawFloatingTexts() {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 1.2;
            ft.life -= 0.015;

            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            } else {
                this.ctx.save();
                this.ctx.globalAlpha = ft.life;
                this.ctx.fillStyle = ft.color;
                this.ctx.font = `bold ${22 + (1 - ft.life) * 12}px Outfit`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(ft.text, ft.x, ft.y);
                this.ctx.restore();
            }
        }
    }

    drawBlock(block, themeFactor = 1.0) {
        const cellS = this.metrics.cellSize * block.currentScale;
        const gap = CONFIG.BLOCK_GAP * block.currentScale;
        const r = 4 * block.currentScale;

        const rows = block.shape.length;
        const cols = block.shape[0].length;
        const width = cols * cellS;
        const height = rows * cellS;

        this.ctx.save();
        this.ctx.translate(block.x, block.y);
        this.ctx.rotate(block.rotationAnim);

        const startX = -(width / 2);
        const startY = -(height / 2);

        if (block.isDragging) {
            this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowOffsetY = 15;
        }

        let drawColor = block.color;
        if (this.themeTransition.active) {
            const fromRGB = this.themeTransition.from.rgb;
            const toRGB = this.themeTransition.to.rgb;
            drawColor = this.lerpColor(fromRGB, toRGB, themeFactor);
        }
        this.ctx.fillStyle = drawColor;

        // Note: For rotated blocks, we need to draw the cells based on the CURRENT shape data
        // If the shape was logically rotated, the startX/startY logic needs to stay centered
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (block.shape[y][x] === 1) {
                    const dx = startX + (x * cellS) + gap / 2;
                    const dy = startY + (y * cellS) + gap / 2;
                    const s = cellS - gap;
                    this.drawRoundedRect(dx, dy, s, s, r);
                    this.ctx.fill();
                }
            }
        }
        this.ctx.restore();
    }

    drawGhost(col, row, block, themeFactor = 1.0) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;

        let drawColor = block.color;
        if (this.themeTransition.active) {
            const fromRGB = this.themeTransition.from.rgb;
            const toRGB = this.themeTransition.to.rgb;
            drawColor = this.lerpColor(fromRGB, toRGB, themeFactor);
        }
        this.ctx.fillStyle = drawColor;

        const gs = this.metrics.cellSize;
        const gap = CONFIG.BLOCK_GAP;

        for (let y = 0; y < block.shape.length; y++) {
            for (let x = 0; x < block.shape[y].length; x++) {
                if (block.shape[y][x] === 1) {
                    const gx = col + x;
                    const gy = row + y;
                    const drawX = this.metrics.gridX + (gx * gs) + gap / 2;
                    const drawY = this.metrics.gridY + (gy * gs) + gap / 2;
                    const size = gs - gap;
                    this.drawRoundedRect(drawX, drawY, size, size, 4);
                    this.ctx.fill();
                }
            }
        }
        this.ctx.restore();
    }

    updateAndDrawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            } else {
                this.ctx.globalAlpha = p.life;
                this.ctx.fillStyle = p.color;

                // Modern Square Particles
                const s = p.size || 4;
                this.ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);

                this.ctx.globalAlpha = 1.0;
            }
        }
    }

    loop() {
        try {
            this.render();
        } catch (e) {
            console.error("Render Loop Error:", e);
        }
        requestAnimationFrame(() => this.loop());
    }
}

// Start Game
window.onload = () => {
    new Game('game-canvas');
};
