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
            console.log('Mirror horizontal clicked, app:', this.app, 'grid:', this.app?.grid);
            this.horizontalActive = !this.horizontalActive;
            this.updateButtonStates();
            if (this.liveUpdate) this.applyMirror();
        });
        
        document.getElementById('mirror-vertical').addEventListener('click', () => {
            this.verticalActive = !this.verticalActive;
            this.updateButtonStates();
            if (this.liveUpdate) this.applyMirror();
        });
        
        document.getElementById('mirror-diagonal').addEventListener('click', () => {
            this.diagonalActive = !this.diagonalActive;
            this.updateButtonStates();
            if (this.liveUpdate) this.applyMirror();
        });
        
        document.getElementById('mirror-live-toggle').addEventListener('change', (e) => {
            this.liveUpdate = e.target.checked;
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
        if (!this.isActive() || !this.app || !this.app.grid) return;
        
        if (this.app.layerManager) {
            const activeLayer = this.app.layerManager.getActiveLayer();
            if (activeLayer) {
                // Create a copy of the current cells to avoid modification during iteration
                const originalCells = {...activeLayer.cells};
                
                // Mirror the cells
                this.mirrorLayerCells(activeLayer, originalCells);
                this.app.grid.render();
                return;
            }
        }
        
        // If not using layers, mirror the grid data
        this.mirrorGridData();
        this.app.grid.render();
    }
    
    mirrorLayerCells(layer, originalCells) {
        // Use the center of the grid for mirroring, not just the cell bounds
        const centerX = Math.floor(this.app.grid.gridWidth / 2);
        const centerY = Math.floor(this.app.grid.gridHeight / 2);
        
        // Apply horizontal mirroring
        if (this.horizontalActive) {
            Object.entries(originalCells).forEach(([key, color]) => {
                if (!color) return;
                
                const [x, y] = key.split(',').map(Number);
                const mirroredX = 2 * centerX - x;
                
                // Set the mirrored cell
                layer.setCell(mirroredX, y, color);
            });
        }
        
        // Apply vertical mirroring
        if (this.verticalActive) {
            Object.entries(originalCells).forEach(([key, color]) => {
                if (!color) return;
                
                const [x, y] = key.split(',').map(Number);
                const mirroredY = 2 * centerY - y;
                
                // Set the mirrored cell
                layer.setCell(x, mirroredY, color);
            });
        }
        
        // Apply diagonal mirroring
        if (this.diagonalActive) {
            Object.entries(originalCells).forEach(([key, color]) => {
                if (!color) return;
                
                const [x, y] = key.split(',').map(Number);
                
                // Using relative displacement from center
                const dx = x - centerX;
                const dy = y - centerY;
                
                // Swap dx and dy for diagonal mirroring
                const mirroredX = centerX + dy;
                const mirroredY = centerY + dx;
                
                // Set the mirrored cell
                layer.setCell(mirroredX, mirroredY, color);
            });
        }
    }
    
    mirrorGridData() {
        if (!this.app || !this.app.grid) return;
        
        const grid = this.app.grid;
        const width = grid.gridWidth;
        const height = grid.gridHeight;
        
        if (!width || !height) return;
        
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        
        // Create a copy of the grid data
        const originalData = grid.gridData.map(row => [...row]);
        
        // Apply horizontal mirroring
        if (this.horizontalActive) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (originalData[y][x]) {
                        const mirroredX = 2 * centerX - x;
                        if (mirroredX >= 0 && mirroredX < width) {
                            grid.gridData[y][mirroredX] = originalData[y][x];
                        }
                    }
                }
            }
        }
        
        // Apply vertical mirroring
        if (this.verticalActive) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (originalData[y][x]) {
                        const mirroredY = 2 * centerY - y;
                        if (mirroredY >= 0 && mirroredY < height) {
                            grid.gridData[mirroredY][x] = originalData[y][x];
                        }
                    }
                }
            }
        }
        
        // Apply diagonal mirroring
        if (this.diagonalActive) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (originalData[y][x]) {
                        const dx = x - centerX;
                        const dy = y - centerY;
                        
                        const mirroredX = centerX + dy;
                        const mirroredY = centerY + dx;
                        
                        if (mirroredX >= 0 && mirroredX < width && 
                            mirroredY >= 0 && mirroredY < height) {
                            grid.gridData[mirroredY][mirroredX] = originalData[y][x];
                        }
                    }
                }
            }
        }
    }
} 