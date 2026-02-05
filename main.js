/**
 * amokado's Blast - Avant-Garde Edition
 * Core Logic & Rendering
 */

// --- Constants & Config ---
const CONFIG = {
    GRID_SIZE: 8,
    BLOCK_GAP: 6, // px
    ANIMATION_SPEED: 0.2, // spring duration
    COLORS: [
        '#E0E0E0', '#B0B0B0', '#808080', '#505050',
        '#F5F5F5', '#999999', '#666666'
    ],
    GRID_BG: 'rgba(255, 255, 255, 0.05)',
    GRID_CELL_BG: 'rgba(255, 255, 255, 0.08)'
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
    [[1, 1, 1], [0, 0, 1]]
];


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

        // Interaction
        this.draggingBlock = null; // { blockIndex, originalX, originalY, currentX, currentY }
        this.pointer = { x: 0, y: 0, isDown: false };

        // Effects
        this.floatingTexts = []; // Score popups
        this.particles = [];

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input Listeners
        this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
        window.addEventListener('pointermove', (e) => this.handlePointerMove(e));
        window.addEventListener('pointerup', (e) => this.handlePointerUp(e));

        // Start
        this.spawnBlocks();
        this.loop();
    }



    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        this.metrics.width = this.canvas.width;
        this.metrics.height = this.canvas.height;

        // Calculate Grid Size (fit within width with padding, or height top half)
        const padding = 20;
        const availableWidth = this.metrics.width - (padding * 2);
        const availableHeight = this.metrics.height * 0.65; // Grid takes top 65% approximately

        const gridPixelSize = Math.min(availableWidth, availableHeight);

        this.metrics.gridSize = gridPixelSize;
        this.metrics.cellSize = (gridPixelSize / CONFIG.GRID_SIZE);

        this.metrics.gridX = (this.metrics.width - gridPixelSize) / 2;
        this.metrics.gridY = padding + 20; // Top padding

        this.metrics.blockAreaY = this.metrics.gridY + gridPixelSize + 40;

        // Reposition static blocks if resize happens during play
        this.updateBlockPositions();
    }

    spawnBlocks() {
        this.blocks = [];
        for (let i = 0; i < 3; i++) {
            const shapeProto = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            const color = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
            this.blocks.push({
                shape: shapeProto, // 2D array
                color: color,
                x: 0, // Will be calculated
                y: 0,
                baseScale: 0.6, // Smaller in tray
                currentScale: 0.6,
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

        const pos = this.getPointerPos(e);
        this.pointer.isDown = true;
        this.pointer.x = pos.x;
        this.pointer.y = pos.y;

        // Check availability
        // Reversed for hit testing (draw order)
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];
            if (block.placed) continue;

            // Simple Circle Hit Test
            const hitDist = 60;
            const dx = pos.x - block.x;
            const dy = pos.y - block.y;

            if (Math.sqrt(dx * dx + dy * dy) < hitDist) {
                // LIFT LOGIC:
                // We want: block.x = mouse.x
                //          block.y = mouse.y - 120 (Lifted up)

                this.draggingBlock = {
                    index: i,
                    liftHeight: 120, // How far up it floats
                    startScale: block.currentScale
                };

                block.isDragging = true;
                block.currentScale = 1.0;

                // Snap to lifted position immediately
                block.x = pos.x;
                block.y = pos.y - 120;
                break;
            }
        }
    }

    handlePointerMove(e) {
        const pos = this.getPointerPos(e);
        this.pointer.x = pos.x;
        this.pointer.y = pos.y;

        if (this.draggingBlock) {
            const block = this.blocks[this.draggingBlock.index];
            // Follow mouse exactly, but shifted UP
            block.x = pos.x;
            block.y = pos.y - this.draggingBlock.liftHeight;
        }
    }

    handlePointerUp(e) {
        if (this.draggingBlock) {
            const idx = this.draggingBlock.index;
            const block = this.blocks[idx];

            // Attempt place
            const placedParams = this.calculateGridPlacement(block);

            if (placedParams) {
                this.placeBlock(block, placedParams.gridCol, placedParams.gridRow);
            } else {
                // Return to tray
                block.isDragging = false;
                block.currentScale = block.baseScale;
                this.updateBlockPositions(); // Snaps back
            }

            this.draggingBlock = null;
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

    placeBlock(block, c, r) {
        block.placed = true;

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
            // Scoring: 10 per block placed + 100 per line * multiplier
            const points = linesCleared * 100 * linesCleared; // Exponential reward
            this.updateScore(points);
        } else {
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
            // Try every position on grid
            for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
                for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
                    if (this.canPlace(block.shape, c, r)) {
                        canMove = true;
                        break;
                    }
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
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('game-over-modal').classList.remove('hidden');
        document.getElementById('restart-btn').onclick = () => window.location.reload();
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

    renderGrid() {
        // Background Grid
        const gs = this.metrics.cellSize;
        const gap = CONFIG.BLOCK_GAP;
        const r = 4; // corner radius

        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                const drawX = this.metrics.gridX + (x * gs) + gap / 2;
                const drawY = this.metrics.gridY + (y * gs) + gap / 2;
                const size = gs - gap;

                // Empty Cell
                this.ctx.fillStyle = CONFIG.GRID_CELL_BG;
                this.drawRoundedRect(drawX, drawY, size, size, r);
                this.ctx.fill();

                // Occupied Cell
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.grid[y][x];

                    // Slight shadow
                    this.ctx.shadowColor = 'rgba(0,0,0,0.1)';
                    this.ctx.shadowBlur = 4;
                    this.ctx.shadowOffsetY = 2;

                    this.drawRoundedRect(drawX, drawY, size, size, r);
                    this.ctx.fill();

                    this.ctx.shadowColor = 'transparent'; // reset

                    // Highlight (bevel effect)
                    this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    this.ctx.beginPath();
                    this.ctx.arc(drawX + size * 0.2, drawY + size * 0.2, size * 0.1, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    }

    render() {
        // Clear
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Grid
        this.renderGrid();

        // Draw Blocks (Tray)
        // We draw placed blocks as part of the grid above.
        // Here we draw the 3 draggable ones.
        this.blocks.forEach(block => {
            if (block.placed) return;
            this.drawBlock(block);
        });

        // Draw Particles
        this.updateAndDrawParticles();

        // Debug Ghost (Optional: Show where it lands)
        if (this.draggingBlock) {
            const block = this.blocks[this.draggingBlock.index];
            const placement = this.calculateGridPlacement(block);
            if (placement) {
                this.drawGhost(placement.gridCol, placement.gridRow, block);
            }
        }
    }

    drawBlock(block) {
        const cellS = this.metrics.cellSize * block.currentScale;
        const gap = CONFIG.BLOCK_GAP * block.currentScale;
        const r = 4 * block.currentScale;

        // Center the shape around block.x, block.y
        const rows = block.shape.length;
        const cols = block.shape[0].length;
        const width = cols * cellS;
        const height = rows * cellS;

        const startX = block.x - (width / 2);
        const startY = block.y - (height / 2);

        // Shadow for lifting effect
        if (block.isDragging) {
            this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowOffsetY = 15;
        }

        this.ctx.fillStyle = block.color;

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

        this.ctx.shadowColor = 'transparent';
    }

    drawGhost(col, row, block) {
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = block.color;

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
        this.ctx.globalAlpha = 1.0;
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
        this.render();
        requestAnimationFrame(() => this.loop());
    }
}

// Start Game
window.onload = () => {
    new Game('game-canvas');
};
