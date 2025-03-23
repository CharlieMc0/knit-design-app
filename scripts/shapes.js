class ShapeDrawer {
    constructor(grid) {
        this.grid = grid;
        this.isDrawing = false;
        this.startPoint = null;
        this.previewData = null;
        this.currentShape = null;
    }
    
    startDrawing(shape, x, y) {
        this.isDrawing = true;
        this.startPoint = { x, y };
        this.currentShape = shape;
        this.previewData = null;
    }
    
    updatePreview(x, y) {
        if (!this.isDrawing) return;
        
        // Save current state for rendering preview
        this.previewData = { 
            startX: this.startPoint.x, 
            startY: this.startPoint.y, 
            endX: x, 
            endY: y, 
            shape: this.currentShape 
        };
        
        this.grid.render();
    }
    
    finishDrawing(x, y) {
        if (!this.isDrawing) return;
        
        // Save state for undo
        this.grid.app.undoManager.saveState(`Draw ${this.currentShape}`);
        
        // Draw the appropriate shape based on shape type
        if (this.currentShape === 'rectangle') {
            this.drawRectangle(
                this.startPoint.x, this.startPoint.y, 
                x, y, 
                this.grid.app.colorManager.selectedColor
            );
        } else if (this.currentShape === 'circle') {
            this.drawCircle(
                this.startPoint.x, this.startPoint.y, 
                x, y, 
                this.grid.app.colorManager.selectedColor
            );
        } else if (this.currentShape === 'line') {
            this.drawLine(
                this.startPoint.x, this.startPoint.y, 
                x, y, 
                this.grid.app.colorManager.selectedColor
            );
        }
        
        // Reset drawing state
        this.isDrawing = false;
        this.startPoint = null;
        this.previewData = null;
    }
    
    setCellInLayer(x, y, color) {
        // This method ensures cells are set in the active layer when using layers
        if (this.grid.app.layerManager) {
            const layer = this.grid.app.layerManager.getActiveLayer();
            if (layer) {
                layer.setCell(x, y, color);
                return;
            }
        }
        
        // Fall back to direct grid setting if no layer is active
        this.grid.gridData[y][x] = color;
    }
    
    // Add this method to render the shape preview
    renderPreview() {
        if (!this.previewData) return;
        
        // Get current context from grid
        const ctx = this.grid.ctx;
        const cellSize = this.grid.cellSize;
        
        // Use a semi-transparent preview color
        ctx.fillStyle = this.grid.app.colorManager.selectedColor + '80'; // 50% opacity
        
        const { startX, startY, endX, endY, shape } = this.previewData;
        
        // Calculate grid positions for rendering
        let worldStartX = startX;
        let worldStartY = startY;
        let worldEndX = endX;
        let worldEndY = endY;
        
        // Convert to world coordinates if using layers
        if (this.grid.app.layerManager) {
            const layer = this.grid.app.layerManager.getActiveLayer();
            if (layer) {
                const startWorld = layer.localToWorld(startX, startY);
                const endWorld = layer.localToWorld(endX, endY);
                
                worldStartX = startWorld.x;
                worldStartY = startWorld.y;
                worldEndX = endWorld.x;
                worldEndY = endWorld.y;
            }
        }
        
        if (shape === 'rectangle') {
            // Calculate the rectangle bounds
            const x = Math.min(worldStartX, worldEndX);
            const y = Math.min(worldStartY, worldEndY);
            const width = Math.abs(worldEndX - worldStartX) + 1;
            const height = Math.abs(worldEndY - worldStartY) + 1;
            
            // Draw rectangle preview
            for (let i = 0; i < width; i++) {
                for (let j = 0; j < height; j++) {
                    ctx.fillRect(
                        (x + i) * cellSize + 1, 
                        (y + j) * cellSize + 1, 
                        cellSize - 1, 
                        cellSize - 1
                    );
                }
            }
        } else if (shape === 'circle') {
            // Calculate circle properties
            const centerX = (worldStartX + worldEndX) / 2;
            const centerY = (worldStartY + worldEndY) / 2;
            const radiusX = Math.abs(worldEndX - worldStartX) / 2;
            const radiusY = Math.abs(worldEndY - worldStartY) / 2;
            
            // Draw all cells within the ellipse
            const left = Math.floor(centerX - radiusX - 1);
            const right = Math.ceil(centerX + radiusX + 1);
            const top = Math.floor(centerY - radiusY - 1);
            const bottom = Math.ceil(centerY + radiusY + 1);
            
            for (let x = left; x <= right; x++) {
                for (let y = top; y <= bottom; y++) {
                    // Check if this cell is within the ellipse
                    if (this.isPointInEllipse(x, y, centerX, centerY, radiusX, radiusY)) {
                        ctx.fillRect(
                            x * cellSize + 1, 
                            y * cellSize + 1, 
                            cellSize - 1, 
                            cellSize - 1
                        );
                    }
                }
            }
        } else if (shape === 'line') {
            // Draw line preview using Bresenham's algorithm
            const points = this.getLinePoints(worldStartX, worldStartY, worldEndX, worldEndY);
            points.forEach(point => {
                ctx.fillRect(
                    point.x * cellSize + 1, 
                    point.y * cellSize + 1, 
                    cellSize - 1, 
                    cellSize - 1
                );
            });
        }
    }
    
    // Keep the original shape drawing methods (drawRectangle, drawCircle, drawLine)
    // but update them to use setCellInLayer instead of directly setting grid cells
    
    drawRectangle(startX, startY, endX, endY, color) {
        // Calculate the rectangle bounds
        const x1 = Math.min(startX, endX);
        const y1 = Math.min(startY, endY);
        const width = Math.abs(endX - startX) + 1;
        const height = Math.abs(endY - startY) + 1;
        
        // Fill all cells within the rectangle
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                this.setCellInLayer(x1 + i, y1 + j, color);
            }
        }
    }
    
    drawCircle(startX, startY, endX, endY, color) {
        // Calculate ellipse properties
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        const radiusX = Math.abs(endX - startX) / 2;
        const radiusY = Math.abs(endY - startY) / 2;
        
        // Draw all cells within the ellipse
        const left = Math.floor(centerX - radiusX - 1);
        const right = Math.ceil(centerX + radiusX + 1);
        const top = Math.floor(centerY - radiusY - 1);
        const bottom = Math.ceil(centerY + radiusY + 1);
        
        for (let x = left; x <= right; x++) {
            for (let y = top; y <= bottom; y++) {
                // Check if this cell is within the ellipse
                if (this.isPointInEllipse(x, y, centerX, centerY, radiusX, radiusY)) {
                    this.setCellInLayer(x, y, color);
                }
            }
        }
    }
    
    drawLine(startX, startY, endX, endY, color) {
        // Use Bresenham's line algorithm to get all points on the line
        const points = this.getLinePoints(startX, startY, endX, endY);
        
        // Set all points on the line
        points.forEach(point => {
            this.setCellInLayer(point.x, point.y, color);
        });
    }
    
    // Helper methods remain unchanged
    isPointInEllipse(x, y, centerX, centerY, radiusX, radiusY) {
        // Add small epsilon to avoid floating point precision issues
        const epsilon = 0.5;
        
        if (radiusX <= 0 || radiusY <= 0) return false;
        
        const normalizedX = (x - centerX) / radiusX;
        const normalizedY = (y - centerY) / radiusY;
        
        return normalizedX * normalizedX + normalizedY * normalizedY <= 1 + epsilon;
    }
    
    getLinePoints(x0, y0, x1, y1) {
        const points = [];
        
        // Bresenham's line algorithm
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        while (true) {
            points.push({ x: x0, y: y0 });
            
            if (x0 === x1 && y0 === y1) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                if (x0 === x1) break;
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                if (y0 === y1) break;
                err += dx;
                y0 += sy;
            }
        }
        
        return points;
    }
} 