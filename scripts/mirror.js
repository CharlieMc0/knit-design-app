class MirrorManager {
    constructor(app) {
        this.app = app;
        this.horizontalActive = false;
        this.verticalActive = false;
        this.diagonalActive = false;
        this.liveUpdate = true;
        
        // Ensure app and grid are available before proceeding
        if (!app || !app.grid) {
            console.error('MirrorManager: app or grid not available');
            // Try to recover by finding the app instance
            if (window.app) {
                this.app = window.app;
                console.log('MirrorManager: recovered app from window.app');
            }
        }
        
        // Delay setup to ensure DOM is ready
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
    }
    
    setupEventListeners() {
        document.getElementById('mirror-horizontal').addEventListener('click', () => {
            const wasActive = this.horizontalActive;
            this.horizontalActive = !this.horizontalActive;
            this.updateButtonStates();
            if (this.liveUpdate && !wasActive && this.horizontalActive) {
                this.applyMirror();
            }
        });
        
        document.getElementById('mirror-vertical').addEventListener('click', () => {
            const wasActive = this.verticalActive;
            this.verticalActive = !this.verticalActive;
            this.updateButtonStates();
            if (this.liveUpdate && !wasActive && this.verticalActive) {
                this.applyMirror();
            }
        });
        
        document.getElementById('mirror-diagonal').addEventListener('click', () => {
            const wasActive = this.diagonalActive;
            this.diagonalActive = !this.diagonalActive;
            this.updateButtonStates();
            if (this.liveUpdate && !wasActive && this.diagonalActive) {
                this.applyMirror();
            }
        });
        
        document.getElementById('mirror-live-toggle').addEventListener('change', (e) => {
            this.liveUpdate = e.target.checked;
            if (this.liveUpdate && this.isActive()) {
                this.applyMirror();
            }
        });
    }
    
    updateButtonStates() {
        const horizontalBtn = document.getElementById('mirror-horizontal');
        const verticalBtn = document.getElementById('mirror-vertical');
        const diagonalBtn = document.getElementById('mirror-diagonal');
        
        horizontalBtn.classList.toggle('active', this.horizontalActive);
        verticalBtn.classList.toggle('active', this.verticalActive);
        diagonalBtn.classList.toggle('active', this.diagonalActive);
    }
    
    isActive() {
        return this.horizontalActive || this.verticalActive || this.diagonalActive;
    }
    
    applyMirror() {
        // Don't do anything if no mirror modes are active
        if (!this.isActive()) return;
        
        // Save state before making changes
        this.app.undoManager.saveState('Apply mirror');
        
        // Make a copy of the grid data or get visible cells from all layers
        const cellData = this.getCellData();
        
        // Calculate center points for mirroring
        const centerX = Math.floor(this.app.grid.gridWidth / 2);
        const centerY = Math.floor(this.app.grid.gridHeight / 2);

        // Clear all mirrored quadrants first
        this.clearMirroredQuadrants(centerX, centerY);
        
        // Mirror cells from the primary quadrant (top-left)
        for (let y = 0; y < centerY; y++) {
            for (let x = 0; x < centerX; x++) {
                const color = this.getCellColor(cellData, x, y);
                
                // Apply horizontal mirroring
                if (this.horizontalActive) {
                    const mirrorX = 2 * centerX - x - 1;
                    if (mirrorX >= 0 && mirrorX < this.app.grid.gridWidth) {
                        this.setCellColor(mirrorX, y, color);
                    }
                }
                
                // Apply vertical mirroring
                if (this.verticalActive) {
                    const mirrorY = 2 * centerY - y - 1;
                    if (mirrorY >= 0 && mirrorY < this.app.grid.gridHeight) {
                        this.setCellColor(x, mirrorY, color);
                        
                        // If both horizontal and vertical are active, also mirror to the diagonal
                        if (this.horizontalActive) {
                            const mirrorX = 2 * centerX - x - 1;
                            if (mirrorX >= 0 && mirrorX < this.app.grid.gridWidth) {
                                this.setCellColor(mirrorX, mirrorY, color);
                            }
                        }
                    }
                }
                
                // Apply diagonal mirroring
                if (this.diagonalActive) {
                    const mirrorX = centerX + (y - centerY);
                    const mirrorY = centerY + (x - centerX);
                    if (mirrorX >= 0 && mirrorX < this.app.grid.gridWidth && 
                        mirrorY >= 0 && mirrorY < this.app.grid.gridHeight) {
                        this.setCellColor(mirrorX, mirrorY, color);
                    }
                }
            }
        }
        
        this.app.grid.render();
    }
    
    getCellData() {
        if (this.app.layerManager) {
            const activeLayer = this.app.layerManager.getActiveLayer();
            if (activeLayer) {
                return activeLayer.cells;
            }
        }
        
        return this.app.grid.gridData;
    }
    
    getCellColor(cellData, x, y) {
        if (this.app.layerManager) {
            const activeLayer = this.app.layerManager.getActiveLayer();
            if (activeLayer) {
                return activeLayer.cells[`${x},${y}`];
            }
        }
        
        return this.app.grid.gridData[y][x];
    }
    
    setCellColor(x, y, color) {
        if (this.app.layerManager) {
            const layer = this.app.layerManager.getActiveLayer();
            if (layer) {
                if (color === null) {
                    // For erasing, delete the cell from the layer
                    delete layer.cells[`${x},${y}`];
                } else {
                    layer.setCell(x, y, color);
                }
                return;
            }
        }
        
        // If not using layers or no active layer
        if (x >= 0 && x < this.app.grid.gridWidth && y >= 0 && y < this.app.grid.gridHeight) {
            this.app.grid.gridData[y][x] = color;
        }
    }

    // Add new method to clear mirrored quadrants
    clearMirroredQuadrants(centerX, centerY) {
        if (this.app.layerManager) {
            const layer = this.app.layerManager.getActiveLayer();
            if (layer) {
                // Clear cells in mirrored quadrants
                Object.keys(layer.cells).forEach(key => {
                    const [x, y] = key.split(',').map(Number);
                    
                    // Check if cell is outside the primary quadrant
                    const inPrimaryQuadrant = x < centerX && y < centerY;
                    if (!inPrimaryQuadrant) {
                        delete layer.cells[key];
                    }
                });
                return;
            }
        }
        
        // If not using layers, clear grid data in mirrored quadrants
        for (let y = 0; y < this.app.grid.gridHeight; y++) {
            for (let x = 0; x < this.app.grid.gridWidth; x++) {
                if (x >= centerX || y >= centerY) {
                    this.app.grid.gridData[y][x] = null;
                }
            }
        }
    }

    // Add method to check if a point is in the primary quadrant
    isInPrimaryQuadrant(x, y) {
        const centerX = Math.floor(this.app.grid.gridWidth / 2);
        const centerY = Math.floor(this.app.grid.gridHeight / 2);
        return x < centerX && y < centerY;
    }
} 