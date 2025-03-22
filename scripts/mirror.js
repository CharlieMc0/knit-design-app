class MirrorManager {
    constructor(grid) {
        this.grid = grid;
        this.mirrorHorizontal = false;
        this.mirrorVertical = false;
        this.mirrorDiagonal = false;
        this.liveUpdate = true;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('mirror-horizontal').addEventListener('click', () => {
            this.mirrorHorizontal = !this.mirrorHorizontal;
            this.updateButtonState('mirror-horizontal', this.mirrorHorizontal);
            if (this.liveUpdate) this.applyMirror();
        });
        
        document.getElementById('mirror-vertical').addEventListener('click', () => {
            this.mirrorVertical = !this.mirrorVertical;
            this.updateButtonState('mirror-vertical', this.mirrorVertical);
            if (this.liveUpdate) this.applyMirror();
        });
        
        document.getElementById('mirror-diagonal').addEventListener('click', () => {
            this.mirrorDiagonal = !this.mirrorDiagonal;
            this.updateButtonState('mirror-diagonal', this.mirrorDiagonal);
            if (this.liveUpdate) this.applyMirror();
        });
        
        document.getElementById('mirror-live-toggle').addEventListener('change', (e) => {
            this.liveUpdate = e.target.checked;
            if (this.liveUpdate) this.applyMirror();
        });
    }
    
    updateButtonState(buttonId, isActive) {
        const button = document.getElementById(buttonId);
        if (isActive) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }
    
    isActive() {
        return this.mirrorHorizontal || this.mirrorVertical || this.mirrorDiagonal;
    }
    
    applyMirror() {
        // Create a copy of the original grid data
        const originalData = JSON.parse(JSON.stringify(this.grid.gridData));
        
        // Apply horizontal mirroring
        if (this.mirrorHorizontal) {
            this.applyHorizontalMirror(originalData);
        }
        
        // Apply vertical mirroring
        if (this.mirrorVertical) {
            this.applyVerticalMirror(originalData);
        }
        
        // Apply diagonal mirroring
        if (this.mirrorDiagonal) {
            this.applyDiagonalMirror(originalData);
        }
        
        this.grid.render();
    }
    
    applyHorizontalMirror(originalData) {
        const centerX = Math.floor(this.grid.gridWidth / 2);
        
        for (let y = 0; y < this.grid.gridHeight; y++) {
            for (let x = 0; x < centerX; x++) {
                const mirrorX = this.grid.gridWidth - 1 - x;
                this.grid.gridData[y][mirrorX] = originalData[y][x];
            }
        }
    }
    
    applyVerticalMirror(originalData) {
        const centerY = Math.floor(this.grid.gridHeight / 2);
        
        for (let y = 0; y < centerY; y++) {
            for (let x = 0; x < this.grid.gridWidth; x++) {
                const mirrorY = this.grid.gridHeight - 1 - y;
                this.grid.gridData[mirrorY][x] = originalData[y][x];
            }
        }
    }
    
    applyDiagonalMirror(originalData) {
        // Only works well for square grids, but will attempt for rectangular ones too
        const size = Math.min(this.grid.gridWidth, this.grid.gridHeight);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < y; x++) {
                this.grid.gridData[x][y] = originalData[y][x];
            }
        }
    }
} 