class ShapeDrawer {
    constructor(grid) {
        this.grid = grid;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.currentShape = null;
        this.previewData = null;
        this.lastDrawnShape = null;
    }
    
    startDrawing(shape, x, y) {
        this.isDrawing = true;
        this.startX = x;
        this.startY = y;
        this.currentShape = shape;
        this.previewData = [];
    }
    
    updatePreview(endX, endY) {
        this.previewData = [];
        
        switch (this.currentShape) {
            case 'rectangle':
                this.calculateRectangle(this.startX, this.startY, endX, endY);
                break;
            case 'circle':
                this.calculateCircle(this.startX, this.startY, endX, endY);
                break;
            case 'line':
                this.calculateLine(this.startX, this.startY, endX, endY);
                break;
        }
    }
    
    finishDrawing(endX, endY) {
        this.updatePreview(endX, endY);
        
        this.lastDrawnShape = [...this.previewData];
        
        this.grid.app.undoManager.saveState(`Draw ${this.currentShape}`);
        
        this.previewData.forEach(point => {
            this.grid.setCellColor(point.x, point.y, this.grid.app.colorManager.selectedColor);
        });
        
        this.isDrawing = false;
        this.previewData = null;
    }
    
    calculateRectangle(startX, startY, endX, endY) {
        const left = Math.min(startX, endX);
        const top = Math.min(startY, endY);
        const right = Math.max(startX, endX);
        const bottom = Math.max(startY, endY);
        
        // Draw the perimeter of the rectangle
        for (let x = left; x <= right; x++) {
            this.previewData.push({ x, y: top });
            this.previewData.push({ x, y: bottom });
        }
        
        for (let y = top + 1; y < bottom; y++) {
            this.previewData.push({ x: left, y });
            this.previewData.push({ x: right, y });
        }
    }
    
    calculateCircle(startX, startY, endX, endY) {
        // Calculate center and radius
        const centerX = startX;
        const centerY = startY;
        
        // Use distance formula
        const radius = Math.sqrt(Math.pow(endX - centerX, 2) + Math.pow(endY - centerY, 2));
        
        // Use Bresenham's circle algorithm
        let x = 0;
        let y = Math.round(radius);
        let d = 5/4 - radius;
        
        this.plotCirclePoints(centerX, centerY, x, y);
        
        while (y > x) {
            if (d < 0) {
                d += 2 * x + 3;
            } else {
                d += 2 * (x - y) + 5;
                y--;
            }
            x++;
            this.plotCirclePoints(centerX, centerY, x, y);
        }
    }
    
    plotCirclePoints(centerX, centerY, x, y) {
        // Plot all 8 octants
        this.addPointIfValid(centerX + x, centerY + y);
        this.addPointIfValid(centerX + y, centerY + x);
        this.addPointIfValid(centerX - x, centerY + y);
        this.addPointIfValid(centerX - y, centerY + x);
        this.addPointIfValid(centerX + x, centerY - y);
        this.addPointIfValid(centerX + y, centerY - x);
        this.addPointIfValid(centerX - x, centerY - y);
        this.addPointIfValid(centerX - y, centerY - x);
    }
    
    addPointIfValid(x, y) {
        if (x >= 0 && x < this.grid.gridWidth && y >= 0 && y < this.grid.gridHeight) {
            // Check if the point is already in previewData
            if (!this.previewData.some(point => point.x === x && point.y === y)) {
                this.previewData.push({ x, y });
            }
        }
    }
    
    calculateLine(startX, startY, endX, endY) {
        // Use Bresenham's line algorithm
        const dx = Math.abs(endX - startX);
        const dy = Math.abs(endY - startY);
        const sx = startX < endX ? 1 : -1;
        const sy = startY < endY ? 1 : -1;
        let err = dx - dy;
        
        let x = startX;
        let y = startY;
        
        while (true) {
            this.previewData.push({ x, y });
            
            if (x === endX && y === endY) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                if (x === endX) break;
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                if (y === endY) break;
                err += dx;
                y += sy;
            }
        }
    }
    
    renderPreview() {
        if (!this.previewData || this.previewData.length === 0) return;
        
        const ctx = this.grid.ctx;
        ctx.fillStyle = app.colorManager.selectedColor;
        
        this.previewData.forEach(point => {
            ctx.fillRect(
                point.x * this.grid.cellSize + 1,
                point.y * this.grid.cellSize + 1,
                this.grid.cellSize - 1,
                this.grid.cellSize - 1
            );
        });
    }
} 