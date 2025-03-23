class ShapeDrawer {
    constructor(grid) {
        this.grid = grid;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.currentShape = null;
        this.previewData = [];
        this.fillShapes = false; // Default to outline-only
        
        // Set up event listener for fill toggle
        document.getElementById('shape-fill-toggle').addEventListener('change', (e) => {
            this.fillShapes = e.target.checked;
        });
    }
    
    startDrawing(shape, startX, startY) {
        this.isDrawing = true;
        this.currentShape = shape;
        this.startX = startX;
        this.startY = startY;
        this.previewData = [];
    }
    
    updatePreview(x, y) {
        if (!this.isDrawing) return;
        
        this.endX = x;
        this.endY = y;
        this.previewData = []; // Clear previous preview data

        const color = this.grid.app.colorManager.selectedColor;

        if (this.currentShape === 'rectangle') {
            this.drawRectangle(this.startX, this.startY, this.endX, this.endY, color);
        } else if (this.currentShape === 'circle') {
            this.drawCircle(this.startX, this.startY, this.endX, this.endY, color);
        } else if (this.currentShape === 'line') {
            this.drawLine(this.startX, this.startY, this.endX, this.endY, color);
        }
    }
    
    finishDrawing(x, y) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.updatePreview(x, y);
        
        // Apply the preview data to the grid
        this.previewData.forEach(cell => {
            this.grid.setCellColor(cell.x, cell.y, cell.color);
        });
        
        this.previewData = [];
    }
    
    drawRectangle(x1, y1, x2, y2, color) {
        const [startX, endX] = x1 < x2 ? [x1, x2] : [x2, x1];
        const [startY, endY] = y1 < y2 ? [y1, y2] : [y2, y1];
        
        if (this.fillShapes) {
            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    this.previewData.push({ x, y, color });
                }
            }
        } else {
            for (let x = startX; x <= endX; x++) {
                this.previewData.push({ x, y: startY, color });
                this.previewData.push({ x, y: endY, color });
            }
            
            for (let y = startY + 1; y < endY; y++) {
                this.previewData.push({ x: startX, y, color });
                this.previewData.push({ x: endX, y, color });
            }
        }
    }
    
    drawCircle(centerX, centerY, x2, y2, color) {
        const dx = x2 - centerX;
        const dy = y2 - centerY;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        const scanSize = Math.ceil(radius) + 1;
        
        for (let y = centerY - scanSize; y <= centerY + scanSize; y++) {
            for (let x = centerX - scanSize; x <= centerX + scanSize; x++) {
                const distX = x - centerX;
                const distY = y - centerY;
                const distance = Math.sqrt(distX * distX + distY * distY);
                
                if (this.fillShapes) {
                    if (distance <= radius) {
                        this.previewData.push({ x, y, color });
                    }
                } else {
                    if (Math.abs(distance - radius) < 0.5) {
                        this.previewData.push({ x, y, color });
                    }
                }
            }
        }
    }
    
    drawLine(x1, y1, x2, y2, color) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1;
        let y = y1;
        
        while (true) {
            this.previewData.push({ x, y, color });
            
            if (x === x2 && y === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                if (x === x2) break;
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                if (y === y2) break;
                err += dx;
                y += sy;
            }
        }
    }
    
    renderPreview() {
        if (!this.previewData) return;
        
        const ctx = this.grid.ctx;
        const cellSize = this.grid.cellSize;
        
        ctx.save();
        
        this.previewData.forEach(cell => {
            ctx.fillStyle = cell.color;
            ctx.fillRect(
                cell.x * cellSize + 1,
                cell.y * cellSize + 1,
                cellSize - 1,
                cellSize - 1
            );
        });
        
        ctx.restore();
    }
} 