class ExportManager {
    constructor(grid) {
        this.grid = grid;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('export-pdf').addEventListener('click', this.exportToPdf.bind(this));
    }
    
    exportToPdf() {
        // Create a temporary canvas for the export
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        
        // Set canvas size to match grid (excluding margins)
        const gridWidth = this.grid.gridWidth * this.grid.cellSize;
        const gridHeight = this.grid.gridHeight * this.grid.cellSize;
        tempCanvas.width = gridWidth;
        tempCanvas.height = gridHeight;
        
        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, gridWidth, gridHeight);
        
        // Draw grid lines
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= gridWidth; x += this.grid.cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, gridHeight);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= gridHeight; y += this.grid.cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(gridWidth, y);
            ctx.stroke();
        }
        
        // Draw all visible layers
        if (this.grid.app.layerManager) {
            const visibleLayers = this.grid.app.layerManager.getAllVisibleLayers();
            
            visibleLayers.forEach(layer => {
                ctx.globalAlpha = layer.opacity / 100;
                
                Object.entries(layer.cells).forEach(([key, color]) => {
                    if (!color) return;
                    
                    const [localX, localY] = key.split(',').map(Number);
                    const worldPos = layer.localToWorld(localX, localY);
                    
                    if (worldPos.x >= 0 && worldPos.x < this.grid.gridWidth && 
                        worldPos.y >= 0 && worldPos.y < this.grid.gridHeight) {
                        ctx.fillStyle = color;
                        ctx.fillRect(
                            worldPos.x * this.grid.cellSize + 1,
                            worldPos.y * this.grid.cellSize + 1,
                            this.grid.cellSize - 1,
                            this.grid.cellSize - 1
                        );
                    }
                });
            });
        } else {
            // Draw grid data if no layers
            for (let y = 0; y < this.grid.gridHeight; y++) {
                for (let x = 0; x < this.grid.gridWidth; x++) {
                    const color = this.grid.gridData[y][x];
                    if (color) {
                        ctx.fillStyle = color;
                        ctx.fillRect(
                            x * this.grid.cellSize + 1,
                            y * this.grid.cellSize + 1,
                            this.grid.cellSize - 1,
                            this.grid.cellSize - 1
                        );
                    }
                }
            }
        }
        
        // Create data object for export page
        const exportData = {
            width: gridWidth,
            height: gridHeight,
            imageData: tempCanvas.toDataURL('image/png')
        };
        
        // Open export page in new window
        const exportUrl = `export.html?data=${encodeURIComponent(JSON.stringify(exportData))}`;
        window.open(exportUrl, '_blank');
    }
} 