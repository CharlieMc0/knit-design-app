class ShapeDrawer {
    constructor(grid) {
        this.grid = grid;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.currentShape = null;
        this.previewData = null;
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
    }
    
    updatePreview(x, y) {
        if (!this.isDrawing) return;
        
        this.endX = x;
        this.endY = y;

        if (this.currentShape === 'oval') {
            this.renderPreview();
        }
    }
    
    finishDrawing(x, y) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.updatePreview(x, y);
        
        if (this.currentShape === 'oval') {
            this.drawOval(this.startX, this.startY, this.endX, this.endY);
        }
    }
    
    drawRectangle(x1, y1, x2, y2, color) {
        // Ensure x1,y1 is the top-left and x2,y2 is the bottom-right
        const [startX, endX] = x1 < x2 ? [x1, x2] : [x2, x1];
        const [startY, endY] = y1 < y2 ? [y1, y2] : [y2, y1];
        
        if (this.fillShapes) {
            // Draw filled rectangle
            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    this.previewData.push({ x, y, color });
                }
            }
        } else {
            // Draw outline only
            for (let x = startX; x <= endX; x++) {
                this.previewData.push({ x, y: startY, color }); // Top edge
                this.previewData.push({ x, y: endY, color });   // Bottom edge
            }
            
            for (let y = startY + 1; y < endY; y++) {
                this.previewData.push({ x: startX, y, color }); // Left edge
                this.previewData.push({ x: endX, y, color });   // Right edge
            }
        }
    }
    
    drawCircle(centerX, centerY, x2, y2, color) {
        // Calculate radius based on distance from center to current point
        const dx = x2 - centerX;
        const dy = y2 - centerY;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        // Scan a square area around the center
        const scanSize = Math.ceil(radius) + 1;
        
        for (let y = centerY - scanSize; y <= centerY + scanSize; y++) {
            for (let x = centerX - scanSize; x <= centerX + scanSize; x++) {
                const distX = x - centerX;
                const distY = y - centerY;
                const distance = Math.sqrt(distX * distX + distY * distY);
                
                if (this.fillShapes) {
                    // For filled circle, include all points within radius
                    if (distance <= radius) {
                        this.previewData.push({ x, y, color });
                    }
                } else {
                    // For outline, include points close to the radius
                    if (Math.abs(distance - radius) < 0.5) {
                        this.previewData.push({ x, y, color });
                    }
                }
            }
        }
    }
    
    drawLine(x1, y1, x2, y2, color) {
        // Bresenham's line algorithm
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
    
    drawOval(startX, startY, endX, endY) {
        const ctx = this.grid.ctx;
        ctx.save();
        ctx.strokeStyle = this.grid.app.colorManager.selectedColor;
        ctx.lineWidth = 2;

        const width = Math.abs(endX - startX) * this.grid.cellSize;
        const height = Math.abs(endY - startY) * this.grid.cellSize;
        const centerX = (startX + endX) / 2 * this.grid.cellSize;
        const centerY = (startY + endY) / 2 * this.grid.cellSize;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, 2 * Math.PI);

        if (this.fillShapes) {
            ctx.fillStyle = this.grid.app.colorManager.selectedColor;
            ctx.fill();
        } else {
            ctx.stroke();
        }

        ctx.restore();
    }
    
    renderPreview() {
        const ctx = this.grid.ctx;
        ctx.save();
        ctx.strokeStyle = '#0000ff'; // Blue color for preview
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        const width = Math.abs(this.endX - this.startX) * this.grid.cellSize;
        const height = Math.abs(this.endY - this.startY) * this.grid.cellSize;
        const centerX = (this.startX + this.endX) / 2 * this.grid.cellSize;
        const centerY = (this.startY + this.endY) / 2 * this.grid.cellSize;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.restore();
    }
} 