class KnittingGrid {
    constructor(app) {
        this.app = app; // Store reference to app
        this.canvas = document.getElementById('knitting-grid');
        this.ctx = this.canvas.getContext('2d');
        this.gridContainer = document.getElementById('grid-container');
        
        this.cellSize = 20;
        this.gridWidth = 50;
        this.gridHeight = 50;
        this.zoomLevel = 1;
        
        this.gridData = [];
        this.selectedCells = [];
        this.isSelecting = false;
        this.selectionStart = null;
        
        this.initialize();
        this.setupEventListeners();
    }
    
    initialize() {
        this.canvas.width = this.gridWidth * this.cellSize;
        this.canvas.height = this.gridHeight * this.cellSize;
        
        // Initialize grid data with empty cells
        this.gridData = Array(this.gridHeight).fill().map(() => 
            Array(this.gridWidth).fill(null)
        );
        
        this.render();
    }
    
    setupEventListeners() {
        // Mouse events for drawing and selection
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        
        // Keyboard events for shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Resize grid button
        document.getElementById('resize-grid').addEventListener('click', this.resizeGrid.bind(this));
        
        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => this.zoom(0.1));
        document.getElementById('zoom-out').addEventListener('click', () => this.zoom(-0.1));
        document.getElementById('zoom-reset').addEventListener('click', () => this.resetZoom());
        
        // Clear grid button
        document.getElementById('clear-grid').addEventListener('click', this.clearGrid.bind(this));
        
        // Copy and Paste buttons
        document.getElementById('copy-selection').addEventListener('click', () => {
            this.app.clipboardData = this.copySelection();
            // Show feedback toast
            this.showToast('Selection copied!');
        });
        
        document.getElementById('paste-selection').addEventListener('click', () => {
            this.pasteSelection();
        });
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const labelMargin = 20;
        
        // Get raw coordinates (without layer offset)
        let rawX = Math.floor((e.clientX - rect.left - labelMargin) / (this.cellSize * this.zoomLevel));
        let rawY = Math.floor((e.clientY - rect.top - labelMargin) / (this.cellSize * this.zoomLevel));
        
        if (rawX < 0 || rawX >= this.gridWidth || rawY < 0 || rawY >= this.gridHeight) {
            return; // Out of bounds
        }
        
        // Apply layer position offset for drawing operations
        if (this.app.layerManager && this.app.currentTool !== 'select') {
            const activeLayer = this.app.layerManager.getActiveLayer();
            if (activeLayer) {
                // Calculate coordinates relative to the layer
                let layerX = rawX - activeLayer.position.x;
                let layerY = rawY - activeLayer.position.y;
                
                // If within the layer's effective area
                if (layerX >= 0 && layerX < this.gridWidth && 
                    layerY >= 0 && layerY < this.gridHeight) {
                    
                    if (this.app.currentTool === 'pencil') {
                        this.setCellColor(layerX, layerY, this.app.colorManager.selectedColor);
                    } else if (this.app.currentTool === 'fill') {
                        this.fillArea(layerX, layerY, this.app.colorManager.selectedColor);
                    } else if (['rectangle', 'circle', 'line'].includes(this.app.currentTool)) {
                        this.app.shapeDrawer.startDrawing(this.app.currentTool, layerX, layerY);
                    }
                    
                    this.render();
                    return;
                }
            }
        }
        
        // Handle selection or drawing when not using layers or outside layer bounds
        if (this.app.currentTool === 'select') {
            this.isSelecting = true;
            this.selectionStart = { x: rawX, y: rawY };
            
            // If shift is not pressed, clear previous selection
            if (!e.shiftKey) {
                this.selectedCells = [{ x: rawX, y: rawY }];
            } else {
                // Add to existing selection
                if (!this.isCellSelected(rawX, rawY)) {
                    this.selectedCells.push({ x: rawX, y: rawY });
                }
            }
        } else if (this.app.currentTool === 'pencil') {
            this.setCellColor(rawX, rawY, this.app.colorManager.selectedColor);
        } else if (this.app.currentTool === 'fill') {
            this.fillArea(rawX, rawY, this.app.colorManager.selectedColor);
        } else if (['rectangle', 'circle', 'line'].includes(this.app.currentTool)) {
            this.app.shapeDrawer.startDrawing(this.app.currentTool, rawX, rawY);
        }
        
        this.render();
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const labelMargin = 20;
        
        // Get raw coordinates
        let rawX = Math.floor((e.clientX - rect.left - labelMargin) / (this.cellSize * this.zoomLevel));
        let rawY = Math.floor((e.clientY - rect.top - labelMargin) / (this.cellSize * this.zoomLevel));
        
        if (rawX < 0 || rawX >= this.gridWidth || rawY < 0 || rawY >= this.gridHeight) {
            return; // Out of bounds
        }
        
        // Apply layer position offset for drawing operations
        if (this.app.layerManager && this.app.currentTool !== 'select' && e.buttons === 1) {
            const activeLayer = this.app.layerManager.getActiveLayer();
            if (activeLayer) {
                // Calculate coordinates relative to the layer
                let layerX = rawX - activeLayer.position.x;
                let layerY = rawY - activeLayer.position.y;
                
                // If within the layer's effective area
                if (layerX >= 0 && layerX < this.gridWidth && 
                    layerY >= 0 && layerY < this.gridHeight) {
                    
                    if (this.app.currentTool === 'pencil') {
                        this.setCellColor(layerX, layerY, this.app.colorManager.selectedColor);
                        
                        // Handle mirror if active
                        if (this.app.mirrorManager.isActive() && this.app.mirrorManager.liveUpdate) {
                            this.app.mirrorManager.applyMirror();
                        }
                    } else if (['rectangle', 'circle', 'line'].includes(this.app.currentTool) && 
                              this.app.shapeDrawer.isDrawing) {
                        this.app.shapeDrawer.updatePreview(layerX, layerY);
                    }
                    
                    this.render();
                    return;
                }
            }
        }
        
        // Handle selection or drawing when not using layers
        if (this.isSelecting && this.app.currentTool === 'select') {
            this.updateSelection(this.selectionStart.x, this.selectionStart.y, rawX, rawY, e.shiftKey);
        } else if (this.app.currentTool === 'pencil' && e.buttons === 1) {
            this.setCellColor(rawX, rawY, this.app.colorManager.selectedColor);
            
            // Handle mirror if active
            if (this.app.mirrorManager.isActive() && this.app.mirrorManager.liveUpdate) {
                this.app.mirrorManager.applyMirror();
            }
        } else if (['rectangle', 'circle', 'line'].includes(this.app.currentTool) && 
                  this.app.shapeDrawer.isDrawing) {
            this.app.shapeDrawer.updatePreview(rawX, rawY);
        }
        
        this.render();
    }
    
    handleMouseUp(e) {
        if (this.isSelecting) {
            this.isSelecting = false;
        }
        
        // Finalize shape drawing
        if (['rectangle', 'circle', 'line'].includes(this.app.currentTool) && this.app.shapeDrawer.isDrawing) {
            const rect = this.canvas.getBoundingClientRect();
            const labelMargin = 20;
            
            let rawX = Math.floor((e.clientX - rect.left - labelMargin) / (this.cellSize * this.zoomLevel));
            let rawY = Math.floor((e.clientY - rect.top - labelMargin) / (this.cellSize * this.zoomLevel));
            
            // Apply layer position offset for drawing operations
            if (this.app.layerManager) {
                const activeLayer = this.app.layerManager.getActiveLayer();
                if (activeLayer) {
                    // Calculate coordinates relative to the layer
                    let layerX = rawX - activeLayer.position.x;
                    let layerY = rawY - activeLayer.position.y;
                    
                    if (layerX >= 0 && layerX < this.gridWidth && 
                        layerY >= 0 && layerY < this.gridHeight) {
                        this.app.shapeDrawer.finishDrawing(layerX, layerY);
                    } else {
                        this.app.shapeDrawer.finishDrawing(rawX, rawY);
                    }
                } else {
                    this.app.shapeDrawer.finishDrawing(rawX, rawY);
                }
            } else {
                this.app.shapeDrawer.finishDrawing(rawX, rawY);
            }
            
            this.render();
            
            // Apply mirror if active
            if (this.app.mirrorManager.isActive() && this.app.mirrorManager.liveUpdate) {
                this.app.mirrorManager.applyMirror();
            }
        }
    }
    
    handleKeyDown(e) {
        // Copy (Ctrl+C)
        if (e.ctrlKey && e.key === 'c') {
            this.app.clipboardData = this.copySelection();
        }
        
        // Paste (Ctrl+V)
        if (e.ctrlKey && e.key === 'v') {
            this.pasteSelection();
        }
        
        // Delete (Delete key)
        if (e.key === 'Delete' && this.selectedCells.length > 0) {
            this.deleteSelection();
        }
        
        // Select all (Ctrl+A)
        if (e.ctrlKey && e.key === 'a') {
            this.selectAll();
        }
    }
    
    updateSelection(startX, startY, endX, endY, addToSelection) {
        if (!addToSelection) {
            this.selectedCells = [];
        }
        
        // Create rectangle selection
        for (let y = Math.min(startY, endY); y <= Math.max(startY, endY); y++) {
            for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                    if (!this.isCellSelected(x, y)) {
                        this.selectedCells.push({ x, y });
                    }
                }
            }
        }
    }
    
    isCellSelected(x, y) {
        return this.selectedCells.some(cell => cell.x === x && cell.y === y);
    }
    
    setCellColor(x, y, color) {
        if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
            // Save state before making changes
            if (this.gridData[y][x] !== color) {
                this.app.undoManager.saveState('Change cell color');
            }
            
            // Update the grid data
            this.gridData[y][x] = color;
            
            // Make sure the active layer data is synchronized 
            // This ensures that when we draw directly, the layer data is updated
            if (this.app.layerManager) {
                const activeLayer = this.app.layerManager.getActiveLayer();
                if (activeLayer && activeLayer.data) {
                    // Account for layer position offset
                    const layerX = x + activeLayer.position.x;
                    const layerY = y + activeLayer.position.y;
                    
                    // Ensure we're within bounds
                    if (layerX >= 0 && layerX < activeLayer.data[0].length && 
                        layerY >= 0 && layerY < activeLayer.data.length) {
                        activeLayer.data[layerY][layerX] = color;
                    }
                }
            }
        }
    }
    
    fillArea(startX, startY, newColor) {
        const startColor = this.gridData[startY][startX];
        
        // Don't fill if already the same color
        if (startColor === newColor) return;
        
        // Save state before making changes
        this.app.undoManager.saveState('Fill area');
        
        const queue = [{ x: startX, y: startY }];
        const visited = new Set();
        
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) continue;
            if (this.gridData[y][x] !== startColor) continue;
            
            visited.add(key);
            this.gridData[y][x] = newColor;
            
            // Add adjacent cells to queue
            queue.push({ x: x + 1, y });
            queue.push({ x: x - 1, y });
            queue.push({ x, y: y + 1 });
            queue.push({ x, y: y - 1 });
        }
        
        this.render();
        
        // Apply mirror if active
        if (this.app.mirrorManager.isActive() && this.app.mirrorManager.liveUpdate) {
            this.app.mirrorManager.applyMirror();
        }
    }
    
    resizeGrid() {
        const newWidth = parseInt(document.getElementById('grid-width').value);
        const newHeight = parseInt(document.getElementById('grid-height').value);
        
        if (isNaN(newWidth) || isNaN(newHeight) || newWidth < 5 || newHeight < 5) {
            alert('Please enter valid grid dimensions (minimum 5x5)');
            return;
        }
        
        this.gridWidth = newWidth;
        this.gridHeight = newHeight;
        
        // Create new grid data with existing data preserved where possible
        const newGridData = Array(this.gridHeight).fill().map((_, y) => 
            Array(this.gridWidth).fill().map((_, x) => 
                y < this.gridData.length && x < this.gridData[0].length ? this.gridData[y][x] : null
            )
        );
        
        this.gridData = newGridData;
        this.selectedCells = [];
        
        this.canvas.width = this.gridWidth * this.cellSize;
        this.canvas.height = this.gridHeight * this.cellSize;
        
        this.render();
    }
    
    zoom(delta) {
        const newZoom = Math.max(0.2, Math.min(5, this.zoomLevel + delta));
        this.zoomLevel = newZoom;
        this.gridContainer.style.transform = `scale(${this.zoomLevel})`;
        
        // Adjust container size to handle scroll area properly
        this.gridContainer.style.width = `${this.canvas.width * this.zoomLevel}px`;
        this.gridContainer.style.height = `${this.canvas.height * this.zoomLevel}px`;
    }
    
    resetZoom() {
        this.zoomLevel = 1;
        this.gridContainer.style.transform = `scale(${this.zoomLevel})`;
        this.gridContainer.style.width = `${this.canvas.width}px`;
        this.gridContainer.style.height = `${this.canvas.height}px`;
    }
    
    clearGrid() {
        this.app.undoManager.saveState('Clear grid');

        if (this.app.layerManager) {
            const confirmClear = confirm("Do you want to clear all layers or just the active layer? Click OK for all layers, Cancel for active layer only.");
            
            if (confirmClear) {
                // Clear all layers
                this.app.layerManager.layers.forEach(layer => {
                    layer.data = Array(this.gridHeight).fill().map(() => 
                        Array(this.gridWidth).fill(null)
                    );
                });
                
                // Also clear the active grid data
                this.gridData = Array(this.gridHeight).fill().map(() => 
                    Array(this.gridWidth).fill(null)
                );
            } else {
                // Clear only active layer
                this.gridData = Array(this.gridHeight).fill().map(() => 
                    Array(this.gridWidth).fill(null)
                );
                
                // Update the active layer data
                const activeLayer = this.app.layerManager.getActiveLayer();
                if (activeLayer) {
                    activeLayer.data = Array(this.gridHeight).fill().map(() => 
                        Array(this.gridWidth).fill(null)
                    );
                }
            }
        } else {
            // Clear the grid data when not using layers
            this.gridData = Array(this.gridHeight).fill().map(() => 
                Array(this.gridWidth).fill(null)
            );
        }
        
        this.render();
    }
    
    copySelection() {
        if (this.selectedCells.length === 0) {
            // If no selection and we have a drawn shape, automatically select it
            if (this.app.shapeDrawer && this.app.shapeDrawer.lastDrawnShape) {
                this.selectedCells = [...this.app.shapeDrawer.lastDrawnShape];
            }
            
            if (this.selectedCells.length === 0) return null;
        }
        
        // Find boundaries of selection
        let minX = this.gridWidth;
        let minY = this.gridHeight;
        let maxX = 0;
        let maxY = 0;
        
        this.selectedCells.forEach(cell => {
            minX = Math.min(minX, cell.x);
            minY = Math.min(minY, cell.y);
            maxX = Math.max(maxX, cell.x);
            maxY = Math.max(maxY, cell.y);
        });
        
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        
        // Create a copy of the selected area
        const selectionData = Array(height).fill().map(() => Array(width).fill(null));
        
        this.selectedCells.forEach(cell => {
            selectionData[cell.y - minY][cell.x - minX] = this.gridData[cell.y][cell.x];
        });
        
        // Show a brief visual feedback that something was copied
        this.showCopyFeedback();
        
        return {
            data: selectionData,
            width,
            height
        };
    }
    
    showCopyFeedback() {
        // Temporarily change the selection color to indicate copying
        const originalStrokeStyle = this.ctx.strokeStyle;
        this.ctx.strokeStyle = '#2ecc71'; // Green color for success
        
        this.selectedCells.forEach(cell => {
            this.ctx.beginPath();
            this.ctx.rect(
                cell.x * this.cellSize + 1, 
                cell.y * this.cellSize + 1, 
                this.cellSize - 1, 
                this.cellSize - 1
            );
            this.ctx.stroke();
        });
        
        // Restore original stroke style after a short delay
        setTimeout(() => {
            this.ctx.strokeStyle = originalStrokeStyle;
            this.render();
        }, 300);
    }
    
    pasteSelection() {
        if (!this.app.clipboardData) return;
        
        // If there's a selection, paste at the top-left of the selection
        let pasteX = 0;
        let pasteY = 0;
        
        if (this.selectedCells.length > 0) {
            const minX = Math.min(...this.selectedCells.map(cell => cell.x));
            const minY = Math.min(...this.selectedCells.map(cell => cell.y));
            pasteX = minX;
            pasteY = minY;
        }
        
        for (let y = 0; y < this.app.clipboardData.height; y++) {
            for (let x = 0; x < this.app.clipboardData.width; x++) {
                const targetX = pasteX + x;
                const targetY = pasteY + y;
                
                if (targetX < this.gridWidth && targetY < this.gridHeight) {
                    this.gridData[targetY][targetX] = this.app.clipboardData.data[y][x];
                }
            }
        }
        
        this.render();
        
        // Apply mirror if active
        if (this.app.mirrorManager.isActive() && this.app.mirrorManager.liveUpdate) {
            this.app.mirrorManager.applyMirror();
        }
    }
    
    deleteSelection() {
        if (this.selectedCells.length === 0) return;
        
        this.selectedCells.forEach(cell => {
            if (cell.x >= 0 && cell.x < this.gridWidth && cell.y >= 0 && cell.y < this.gridHeight) {
                this.gridData[cell.y][cell.x] = null;
            }
        });
        
        this.render();
        
        // Apply mirror if active
        if (this.app.mirrorManager.isActive() && this.app.mirrorManager.liveUpdate) {
            this.app.mirrorManager.applyMirror();
        }
    }
    
    selectAll() {
        this.selectedCells = [];
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.selectedCells.push({ x, y });
            }
        }
        this.render();
    }
    
    render() {
        // Increase canvas size to accommodate labels
        const labelMargin = 20; // Space for row/column labels
        this.canvas.width = this.gridWidth * this.cellSize + labelMargin;
        this.canvas.height = this.gridHeight * this.cellSize + labelMargin;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw coordinate labels
        const fontSize = this.gridWidth > 30 ? 8 : 10;
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'center';
        
        // Column numbers (X-axis)
        for (let x = 0; x < this.gridWidth; x++) {
            // Show all numbers
            this.ctx.fillText(
                (x + 1).toString(), 
                labelMargin + x * this.cellSize + this.cellSize / 2, 
                labelMargin - 6
            );
        }
        
        // Row numbers (Y-axis)
        this.ctx.textAlign = 'right';
        for (let y = 0; y < this.gridHeight; y++) {
            // Show all numbers
            this.ctx.fillText(
                (y + 1).toString(), 
                labelMargin - 6, 
                labelMargin + y * this.cellSize + this.cellSize / 2 + 3
            );
        }
        
        // Translate canvas to account for labels
        this.ctx.save();
        this.ctx.translate(labelMargin, labelMargin);
        
        // Draw grid lines
        for (let x = 0; x <= this.gridWidth; x++) {
            if (x % 5 === 0) {
                // Bold line for every 5th column
                this.ctx.strokeStyle = '#999';
                this.ctx.lineWidth = 1.5;
            } else {
                // Regular line
                this.ctx.strokeStyle = '#ddd';
                this.ctx.lineWidth = 0.5;
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.gridHeight * this.cellSize);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridHeight; y++) {
            if (y % 5 === 0) {
                // Bold line for every 5th row
                this.ctx.strokeStyle = '#999';
                this.ctx.lineWidth = 1.5;
            } else {
                // Regular line
                this.ctx.strokeStyle = '#ddd';
                this.ctx.lineWidth = 0.5;
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.gridWidth * this.cellSize, y * this.cellSize);
            this.ctx.stroke();
        }
        
        // Draw all visible layers
        if (this.app.layerManager) {
            const visibleLayers = this.app.layerManager.getAllVisibleLayers();
            const activeLayer = this.app.layerManager.getActiveLayer();
            
            // Make sure we're rendering the most up-to-date data for active layer
            if (activeLayer) {
                for (let i = 0; i < visibleLayers.length; i++) {
                    if (visibleLayers[i].id === activeLayer.id) {
                        // Use the current grid data for the active layer when rendering
                        visibleLayers[i].data = this.gridData;
                        break;
                    }
                }
            }
            
            // Render layers from bottom to top
            visibleLayers.forEach(layer => {
                if (!layer.data) return;
                
                // Calculate opacity value (0-1)
                const opacity = layer.opacity / 100;
                
                // Render this layer's cells
                for (let y = 0; y < this.gridHeight; y++) {
                    for (let x = 0; x < this.gridWidth; x++) {
                        // Account for layer position offset
                        const sourceX = x - layer.position.x;
                        const sourceY = y - layer.position.y;
                        
                        // Skip if outside the layer data bounds
                        if (sourceX < 0 || sourceY < 0 || 
                            sourceX >= layer.data[0].length || 
                            sourceY >= layer.data.length) {
                            continue;
                        }
                        
                        const cellColor = layer.data[sourceY][sourceX];
                        if (cellColor) {
                            // Use opacity for non-active layers
                            this.ctx.globalAlpha = opacity;
                            this.ctx.fillStyle = cellColor;
                            this.ctx.fillRect(
                                x * this.cellSize + 1, 
                                y * this.cellSize + 1, 
                                this.cellSize - 1, 
                                this.cellSize - 1
                            );
                        }
                    }
                }
                
                // Reset opacity
                this.ctx.globalAlpha = 1;
            });
        } else {
            // Draw filled cells
            for (let y = 0; y < this.gridHeight; y++) {
                for (let x = 0; x < this.gridWidth; x++) {
                    const cellColor = this.gridData[y][x];
                    if (cellColor) {
                        this.ctx.fillStyle = cellColor;
                        this.ctx.fillRect(
                            x * this.cellSize + 1, 
                            y * this.cellSize + 1, 
                            this.cellSize - 1, 
                            this.cellSize - 1
                        );
                    }
                }
            }
        }
        
        // Draw selection rectangle
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        
        this.selectedCells.forEach(cell => {
            this.ctx.beginPath();
            this.ctx.rect(
                cell.x * this.cellSize + 1, 
                cell.y * this.cellSize + 1, 
                this.cellSize - 1, 
                this.cellSize - 1
            );
            this.ctx.stroke();
        });
        
        // Draw shape preview if active
        if (this.app.shapeDrawer && this.app.shapeDrawer.previewData) {
            this.app.shapeDrawer.renderPreview();
        }
        
        // Restore canvas context
        this.ctx.restore();
    }
    
    showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Animate and remove after 2 seconds
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 2000);
        }, 100);
    }
} 