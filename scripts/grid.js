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
        this.showReflectionLines = false;
        
        // Add touch state tracking
        this.touchState = {
            points: [],
            initialPinchDistance: 0,
            isPanning: false,
            lastPanPosition: null
        };
        
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
        
        // Touch events for mobile/tablet support
        this.canvas.addEventListener('touchstart', (e) => {
            this.touchState.points = Array.from(e.touches);
            
            if (this.touchState.points.length === 1) {
                // Single touch - handle as drawing
                e.preventDefault(); // Prevent scrolling when drawing
                const touch = this.touchState.points[0];
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                this.canvas.dispatchEvent(mouseEvent);
            } else if (this.touchState.points.length === 2) {
                // Two finger gesture - prepare for pan/zoom
                e.preventDefault();
                this.touchState.isPanning = true;
                this.touchState.lastPanPosition = this.getMidpoint(
                    this.touchState.points[0], 
                    this.touchState.points[1]
                );
                this.touchState.initialPinchDistance = this.getPinchDistance(
                    this.touchState.points[0], 
                    this.touchState.points[1]
                );
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            this.touchState.points = Array.from(e.touches);
            
            if (this.touchState.points.length === 1 && !this.touchState.isPanning) {
                // Single touch - handle as drawing
                e.preventDefault();
                const touch = this.touchState.points[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    buttons: 1
                });
                this.canvas.dispatchEvent(mouseEvent);
            } else if (this.touchState.points.length === 2) {
                // Handle two-finger pan and zoom
                e.preventDefault();
                const currentMidpoint = this.getMidpoint(
                    this.touchState.points[0], 
                    this.touchState.points[1]
                );
                const currentDistance = this.getPinchDistance(
                    this.touchState.points[0], 
                    this.touchState.points[1]
                );
                
                // Handle panning
                if (this.touchState.lastPanPosition) {
                    const deltaX = currentMidpoint.x - this.touchState.lastPanPosition.x;
                    const deltaY = currentMidpoint.y - this.touchState.lastPanPosition.y;
                    this.gridContainer.scrollLeft -= deltaX;
                    this.gridContainer.scrollTop -= deltaY;
                }
                
                // Handle pinch zoom
                if (this.touchState.initialPinchDistance > 0) {
                    const scale = currentDistance / this.touchState.initialPinchDistance;
                    if (Math.abs(scale - 1) > 0.1) { // Add threshold to prevent tiny zoom adjustments
                        if (scale > 1) {
                            this.zoom(0.1);
                        } else {
                            this.zoom(-0.1);
                        }
                        this.touchState.initialPinchDistance = currentDistance;
                    }
                }
                
                this.touchState.lastPanPosition = currentMidpoint;
            }
        });

        this.canvas.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                // All fingers lifted
                this.touchState.isPanning = false;
                this.touchState.lastPanPosition = null;
                this.touchState.initialPinchDistance = 0;
                
                if (this.touchState.points.length === 1) {
                    // Only dispatch mouseup if we were drawing (single touch)
                    e.preventDefault();
                    const mouseEvent = new MouseEvent('mouseup', {});
                    this.canvas.dispatchEvent(mouseEvent);
                }
            }
            this.touchState.points = Array.from(e.touches);
        });

        // Helper methods for touch gestures
        function getMidpoint(touch1, touch2) {
            return {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
        }

        function getPinchDistance(touch1, touch2) {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }
        
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
        
        // Replace Copy and Paste buttons with Copy To New Layer
        document.getElementById('copy-to-new-layer').addEventListener('click', () => {
            this.copyToNewLayer();
        });
        
        // Save design button
        document.getElementById('save-design').addEventListener('click', () => {
            this.saveDesign();
        });
        
        // Load design button
        document.getElementById('load-design').addEventListener('click', () => {
            this.loadDesign();
        });

        // Add reflection lines toggle listener
        document.getElementById('reflection-lines-toggle').addEventListener('change', (e) => {
            this.showReflectionLines = e.target.checked;
            this.render();
        });

        // Add tool button listeners
        document.getElementById('pencil-tool').addEventListener('click', () => {
            this.app.currentTool = 'pencil';
            this.clearSelection();  // Clear selection when switching tools
        });

        document.getElementById('select-tool').addEventListener('click', () => {
            this.app.currentTool = 'select';
        });

        document.getElementById('eraser-tool').addEventListener('click', () => {
            this.app.currentTool = 'eraser';
            this.clearSelection();  // Clear selection when switching tools
        });

        document.getElementById('rectangle-tool').addEventListener('click', () => {
            this.app.currentTool = 'rectangle';
            this.clearSelection();  // Clear selection when switching tools
        });

        document.getElementById('circle-tool').addEventListener('click', () => {
            this.app.currentTool = 'circle';
            this.clearSelection();  // Clear selection when switching tools
        });

        document.getElementById('line-tool').addEventListener('click', () => {
            this.app.currentTool = 'line';
            this.clearSelection();  // Clear selection when switching tools
        });

        document.getElementById('fill-tool').addEventListener('click', () => {
            this.app.currentTool = 'fill';
            this.clearSelection();  // Clear selection when switching tools
        });
    }
    
    handleMouseDown(e) {
        const coords = this.getCellCoordinates(e);
        const gridX = coords.x;
        const gridY = coords.y;
        
        // If mirroring is active, only allow drawing in the primary quadrant
        if (this.app.mirrorManager && this.app.mirrorManager.isActive()) {
            if (!this.app.mirrorManager.isInPrimaryQuadrant(gridX, gridY)) {
                return; // Ignore clicks outside primary quadrant
            }
        }
        
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return; // Out of bounds
        }
        
        // If we're in layer drag mode, don't handle drawing
        if (this.app.layerManager && this.app.layerManager.dragMode) {
            return;
        }
        
        // Tools that need to know about the active layer
        if (this.app.layerManager && this.app.currentTool !== 'select') {
            const layer = this.app.layerManager.getActiveLayer();
            if (layer) {
                // Convert to layer-local coordinates
                const localPos = layer.worldToLocal(gridX, gridY);
                
                // Handle drawing on this layer
                if (this.app.currentTool === 'pencil') {
                    this.setCellColor(localPos.x, localPos.y, this.app.colorManager.selectedColor);
                } else if (this.app.currentTool === 'eraser') {
                    this.eraseCellAt(localPos.x, localPos.y);
                } else if (this.app.currentTool === 'fill') {
                    this.fillArea(localPos.x, localPos.y, this.app.colorManager.selectedColor);
                } else if (['rectangle', 'circle', 'line'].includes(this.app.currentTool)) {
                    this.app.shapeDrawer.startDrawing(this.app.currentTool, localPos.x, localPos.y);
                }
                
                this.render();
                return;
            }
        }
        
        // Handle tools when not using layers or for selection
        if (this.app.currentTool === 'select') {
            this.isSelecting = true;
            this.selectionStart = { x: gridX, y: gridY };
            
            // If shift is not pressed, clear previous selection
            if (!e.shiftKey) {
                this.selectedCells = [{ x: gridX, y: gridY }];
            } else {
                // Add to existing selection
                if (!this.isCellSelected(gridX, gridY)) {
                    this.selectedCells.push({ x: gridX, y: gridY });
                }
            }
        } else if (this.app.currentTool === 'pencil') {
            this.setCellColor(gridX, gridY, this.app.colorManager.selectedColor);
        } else if (this.app.currentTool === 'eraser') {
            this.eraseCellAt(gridX, gridY);
        } else if (this.app.currentTool === 'fill') {
            this.fillArea(gridX, gridY, this.app.colorManager.selectedColor);
        } else if (['rectangle', 'circle', 'line'].includes(this.app.currentTool)) {
            this.app.shapeDrawer.startDrawing(this.app.currentTool, gridX, gridY);
        }
        
        this.render();
    }
    
    handleMouseMove(e) {
        const coords = this.getCellCoordinates(e);
        const gridX = coords.x;
        const gridY = coords.y;
        
        // If mirroring is active, only allow drawing in the primary quadrant
        if (this.app.mirrorManager && this.app.mirrorManager.isActive()) {
            if (!this.app.mirrorManager.isInPrimaryQuadrant(gridX, gridY)) {
                return; // Ignore drawing outside primary quadrant
            }
        }
        
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return; // Out of bounds
        }
        
        // If we're in layer drag mode, don't handle drawing
        if (this.app.layerManager && this.app.layerManager.dragMode) {
            return;
        }
        
        // Tools that need to know about the active layer
        if (this.app.layerManager && this.app.currentTool !== 'select' && e.buttons === 1) {
            const layer = this.app.layerManager.getActiveLayer();
            if (layer) {
                // Convert to layer-local coordinates
                const localPos = layer.worldToLocal(gridX, gridY);
                
                // Handle drawing on this layer
                if (this.app.currentTool === 'pencil') {
                    this.setCellColor(localPos.x, localPos.y, this.app.colorManager.selectedColor);
                    
                    // Apply mirror if active
                    if (this.app.mirrorManager && this.app.mirrorManager.isActive() && 
                        this.app.mirrorManager.liveUpdate) {
                        this.app.mirrorManager.applyMirror();
                    }
                } else if (this.app.currentTool === 'eraser') {
                    this.eraseCellAt(localPos.x, localPos.y);
                } else if (['rectangle', 'circle', 'line'].includes(this.app.currentTool) && 
                          this.app.shapeDrawer.isDrawing) {
                    this.app.shapeDrawer.updatePreview(localPos.x, localPos.y);
                }
                
                this.render();
                return;
            }
        }
        
        // Handle tools when not using layers
        if (this.isSelecting && this.app.currentTool === 'select') {
            this.updateSelection(this.selectionStart.x, this.selectionStart.y, gridX, gridY, e.shiftKey);
        } else if ((this.app.currentTool === 'pencil' || this.app.currentTool === 'eraser') && e.buttons === 1) {
            if (this.app.currentTool === 'eraser') {
                this.eraseCellAt(gridX, gridY);
            } else {
                this.setCellColor(gridX, gridY, this.app.colorManager.selectedColor);
            }
            
            // Apply mirror if active
            if (this.app.mirrorManager && this.app.mirrorManager.isActive() && 
                this.app.mirrorManager.liveUpdate) {
                this.app.mirrorManager.applyMirror();
            }
        } else if (['rectangle', 'circle', 'line'].includes(this.app.currentTool) && 
                  this.app.shapeDrawer.isDrawing) {
            this.app.shapeDrawer.updatePreview(gridX, gridY);
        }
        
        this.render();
    }
    
    handleMouseUp(e) {
        if (this.isSelecting) {
            this.isSelecting = false;
        }
        
        // Finalize shape drawing
        if (['rectangle', 'circle', 'line'].includes(this.app.currentTool) && 
            this.app.shapeDrawer && this.app.shapeDrawer.isDrawing) {
            
            const coords = this.getCellCoordinates(e);
            const gridX = coords.x;
            const gridY = coords.y;
            
            // If we're in layer drag mode, don't handle drawing
            if (this.app.layerManager && this.app.layerManager.dragMode) {
                this.app.shapeDrawer.isDrawing = false;
                this.render();
                return;
            }
            
            // Check if within grid bounds
            if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
                this.app.shapeDrawer.isDrawing = false;
                this.render();
                return;
            }
            
            // Apply layer position offset for drawing operations
            if (this.app.layerManager) {
                const activeLayer = this.app.layerManager.getActiveLayer();
                if (activeLayer) {
                    // Convert to layer-local coordinates
                    const localPos = activeLayer.worldToLocal(gridX, gridY);
                    
                    this.app.shapeDrawer.finishDrawing(localPos.x, localPos.y);
                } else {
                    this.app.shapeDrawer.finishDrawing(gridX, gridY);
                }
            } else {
                this.app.shapeDrawer.finishDrawing(gridX, gridY);
            }
            
            this.render();
            
            // Apply mirror if active
            if (this.app.mirrorManager && this.app.mirrorManager.isActive() && 
                this.app.mirrorManager.liveUpdate) {
                this.app.mirrorManager.applyMirror();
            }
        }
    }
    
    handleKeyDown(e) {
        // Copy to new layer (Ctrl+C)
        if (e.ctrlKey && e.key === 'c') {
            this.copyToNewLayer();
            e.preventDefault();
        }
        
        // Delete (Delete key)
        if (e.key === 'Delete' && this.selectedCells.length > 0) {
            this.deleteSelection();
        }
        
        // Select all (Ctrl+A)
        if (e.ctrlKey && e.key === 'a') {
            this.selectAll();
        }
        
        // Support both Ctrl+Z (Windows/Linux) and Command+Z (Mac)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            this.app.undoManager.undo();
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
        if (this.app.layerManager) {
            const layer = this.app.layerManager.getActiveLayer();
            if (layer) {
                // Save state before making changes
                if (layer.getCell(x, y) !== color) {
                    this.app.undoManager.saveState('Change cell color');
                }
                
                // Set cell in layer
                layer.setCell(x, y, color);
                
                // Apply mirror if active and live update is enabled
                if (this.app.mirrorManager && 
                    this.app.mirrorManager.isActive() && 
                    this.app.mirrorManager.liveUpdate) {
                    this.app.mirrorManager.applyMirror();
                }
                
                this.render();
                return;
            }
        }
        
        // If not using layers
        if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
            // Save state before making changes
            if (this.gridData[y][x] !== color) {
                this.app.undoManager.saveState('Change cell color');
            }
            
            this.gridData[y][x] = color;
            
            // Apply mirror if active and live update is enabled
            if (this.app.mirrorManager && 
                this.app.mirrorManager.isActive() && 
                this.app.mirrorManager.liveUpdate) {
                this.app.mirrorManager.applyMirror();
            }
            
            this.render();
        }
    }
    
    fillArea(startX, startY, newColor) {
        const layer = this.app.layerManager ? this.app.layerManager.getActiveLayer() : null;
        const getColor = (x, y) => layer ? layer.getCell(x, y) : this.gridData[y][x];
        const setColor = (x, y, color) => {
            if (layer) {
                layer.setCell(x, y, color);
            } else {
                this.gridData[y][x] = color;
            }
        };

        const startColor = getColor(startX, startY);
        if (startColor === newColor) return;

        const stack = [{ x: startX, y: startY }];
        const visited = new Set();

        while (stack.length > 0) {
            const { x, y } = stack.pop();
            const key = `${x},${y}`;

            if (visited.has(key) || x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
                continue;
            }

            if (getColor(x, y) === startColor) {
                setColor(x, y, newColor);
                visited.add(key);

                stack.push({ x: x + 1, y });
                stack.push({ x: x - 1, y });
                stack.push({ x, y: y + 1 });
                stack.push({ x, y: y - 1 });
            }
        }

        this.render();
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
                    layer.clearCells();
                });
                
                // Also clear the grid data
                this.gridData = Array(this.gridHeight).fill().map(() => 
                    Array(this.gridWidth).fill(null)
                );
            } else {
                // Clear only active layer
                const layer = this.app.layerManager.getActiveLayer();
                if (layer) {
                    layer.clearCells();
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
            
            visibleLayers.forEach(layer => {
                const opacity = layer.opacity / 100;
                this.ctx.globalAlpha = opacity;
                
                Object.entries(layer.cells).forEach(([key, color]) => {
                    if (!color) return;
                    
                    const [localX, localY] = key.split(',').map(Number);
                    const worldPos = layer.localToWorld(localX, localY);
                    
                    if (worldPos.x >= 0 && worldPos.x < this.gridWidth && 
                        worldPos.y >= 0 && worldPos.y < this.gridHeight) {
                        this.ctx.fillStyle = color;
                        this.ctx.fillRect(
                            worldPos.x * this.cellSize + 1, 
                            worldPos.y * this.cellSize + 1, 
                            this.cellSize - 1, 
                            this.cellSize - 1
                        );
                    }
                });
            });
            
            this.ctx.globalAlpha = 1;
        } else {
            // Draw filled cells when not using layers
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
        
        // Draw reflection lines on top of everything except selection
        this.drawReflectionLines();

        // Draw selection rectangle (keep this after reflection lines)
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
    
    saveDesign() {
        // Create the design data object
        const designData = {
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            layers: this.app.layerManager ? this.app.layerManager.layers : [],
            colors: this.app.colorManager.colors,
            version: "1.0"
        };
        
        // Convert to JSON string
        const designJson = JSON.stringify(designData, null, 2);
        
        // Create blob and download link
        const blob = new Blob([designJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = 'knitting-chart.json';
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Show feedback
        this.showToast('Design saved!');
    }
    
    loadDesign() {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const designData = JSON.parse(event.target.result);
                    
                    // Validate the design data
                    if (!designData.version || !designData.gridWidth || !designData.gridHeight) {
                        throw new Error('Invalid design file format');
                    }
                    
                    // Save current state for undo
                    this.app.undoManager.saveState('Load design');
                    
                    // Update grid dimensions if needed
                    if (this.gridWidth !== designData.gridWidth || 
                        this.gridHeight !== designData.gridHeight) {
                        this.gridWidth = designData.gridWidth;
                        this.gridHeight = designData.gridHeight;
                        
                        // Update input fields
                        document.getElementById('grid-width').value = this.gridWidth;
                        document.getElementById('grid-height').value = this.gridHeight;
                        
                        this.initialize();
                    }
                    
                    // Load colors
                    if (designData.colors && Array.isArray(designData.colors)) {
                        this.app.colorManager.colors = [...designData.colors];
                        this.app.colorManager.renderPalette();
                    }
                    
                    // Load layers
                    if (designData.layers && Array.isArray(designData.layers)) {
                        // Clear existing layers
                        this.app.layerManager.layers = [];
                        
                        // Create new layers from design data
                        designData.layers.forEach(layerData => {
                            const layer = new Layer(layerData.id, layerData.name);
                            layer.visible = layerData.visible;
                            layer.opacity = layerData.opacity;
                            layer.offsetX = layerData.offsetX || 0;
                            layer.offsetY = layerData.offsetY || 0;
                            layer.cells = {...layerData.cells};
                            
                            this.app.layerManager.layers.push(layer);
                        });
                        
                        // Set active layer
                        if (this.app.layerManager.layers.length > 0) {
                            this.app.layerManager.setActiveLayer(this.app.layerManager.layers[0].id);
                        }
                        
                        // Update layers list
                        this.app.layerManager.renderLayersList();
                    }
                    
                    this.render();
                    this.showToast('Design loaded successfully!');
                    
                } catch (error) {
                    console.error('Error loading design:', error);
                    this.showToast('Error loading design file');
                }
            };
            
            reader.readAsText(file);
        });
        
        // Trigger file selection
        fileInput.click();
    }

    getCellCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const labelMargin = 20; // Same margin used in render method
        
        // Simple calculation that accounts for label margin and zoom
        const x = Math.floor((event.clientX - rect.left - labelMargin) / (this.cellSize * this.zoomLevel));
        const y = Math.floor((event.clientY - rect.top - labelMargin) / (this.cellSize * this.zoomLevel));
        
        return { x, y };
    }

    copyToNewLayer() {
        if (this.selectedCells.length === 0) {
            this.showToast('No cells selected');
            return;
        }
        
        // Create a new layer
        const newLayerName = `Copied Layer ${this.app.layerManager.nextLayerId}`;
        this.app.layerManager.addLayer(newLayerName);
        const newLayer = this.app.layerManager.getActiveLayer();
        
        // Find the boundaries of the selection
        let minX = this.gridWidth;
        let minY = this.gridHeight;
        let maxX = 0;
        let maxY = 0;
        
        // First pass: find boundaries
        this.selectedCells.forEach(cell => {
            minX = Math.min(minX, cell.x);
            minY = Math.min(minY, cell.y);
            maxX = Math.max(maxX, cell.x);
            maxY = Math.max(maxY, cell.y);
        });
        
        // Second pass: copy cells
        this.selectedCells.forEach(cell => {
            let color = null;
            
            // Get color from visible layers, starting from top
            if (this.app.layerManager) {
                // Get all visible layers in reverse order (top to bottom)
                const visibleLayers = this.app.layerManager.getAllVisibleLayers().reverse();
                
                // Look for color in each layer
                for (const layer of visibleLayers) {
                    const worldKey = `${cell.x},${cell.y}`;
                    if (layer.cells[worldKey]) {
                        color = layer.cells[worldKey];
                        break; // Stop once we find a color
                    }
                }
            }
            
            // If no color found in layers, try grid data
            if (!color) {
                color = this.gridData[cell.y][cell.x];
            }
            
            // If we found a color, add it to the new layer
            if (color) {
                const worldKey = `${cell.x},${cell.y}`;
                newLayer.cells[worldKey] = color;
            }
        });
        
        // Update the layer's position and size
        newLayer.width = maxX - minX + 1;
        newLayer.height = maxY - minY + 1;
        
        this.app.layerManager.renderLayersList();
        this.render();
        this.showToast('Selection copied to new layer');
    }

    deleteSelection() {
        if (this.selectedCells.length === 0) return;
        
        this.app.undoManager.saveState('Delete selection');
        
        this.selectedCells.forEach(cell => {
            if (cell.x >= 0 && cell.x < this.gridWidth && cell.y >= 0 && cell.y < this.gridHeight) {
                this.gridData[cell.y][cell.x] = null;
            }
        });
        
        this.render();
        
        // Apply mirror if active
        if (this.app.mirrorManager && this.app.mirrorManager.isActive() && 
            this.app.mirrorManager.liveUpdate) {
            this.app.mirrorManager.applyMirror();
        }
    }

    // Add this method to draw reflection lines
    drawReflectionLines() {
        if (!this.showReflectionLines) return;

        const ctx = this.ctx;
        ctx.save();
        
        // Set line style
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // Dashed line

        // Calculate grid dimensions
        const gridWidth = this.gridWidth * this.cellSize;
        const gridHeight = this.gridHeight * this.cellSize;
        
        // Calculate center points - handle even/odd grid dimensions properly
        const centerX = Math.floor(this.gridWidth / 2) * this.cellSize;
        const centerY = Math.floor(this.gridHeight / 2) * this.cellSize;

        // Draw reflection lines in screen space, not affected by layer offsets
        const transform = ctx.getTransform();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Adjust for zoom level
        const zoomOffset = (this.zoomLevel - 1) * this.cellSize / 2;
        const labelMargin = 20;

        // Draw vertical center line
        ctx.beginPath();
        ctx.moveTo(centerX * this.zoomLevel + labelMargin, labelMargin);
        ctx.lineTo(centerX * this.zoomLevel + labelMargin, gridHeight * this.zoomLevel + labelMargin);
        ctx.stroke();

        // Draw horizontal center line
        ctx.beginPath();
        ctx.moveTo(labelMargin, centerY * this.zoomLevel + labelMargin);
        ctx.lineTo(gridWidth * this.zoomLevel + labelMargin, centerY * this.zoomLevel + labelMargin);
        ctx.stroke();

        // Draw diagonal lines
        ctx.beginPath();
        ctx.moveTo(labelMargin, labelMargin);
        ctx.lineTo(gridWidth * this.zoomLevel + labelMargin, gridHeight * this.zoomLevel + labelMargin);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(gridWidth * this.zoomLevel + labelMargin, labelMargin);
        ctx.lineTo(labelMargin, gridHeight * this.zoomLevel + labelMargin);
        ctx.stroke();

        // Restore original transform
        ctx.setTransform(transform);
        ctx.restore();
    }

    // Add new method for erasing
    eraseCellAt(x, y) {
        if (this.app.layerManager) {
            const layer = this.app.layerManager.getActiveLayer();
            if (layer) {
                // Save state before making changes
                this.app.undoManager.saveState('Erase cell');
                
                // Use world coordinates for the layer
                const worldKey = `${x},${y}`;
                if (layer.cells[worldKey]) {
                    delete layer.cells[worldKey];
                    
                    // Apply mirror if active and live update is enabled
                    if (this.app.mirrorManager && 
                        this.app.mirrorManager.isActive() && 
                        this.app.mirrorManager.liveUpdate) {
                        this.app.mirrorManager.applyMirror();
                    }
                    
                    this.render();
                }
                return;
            }
        }
        
        // If not using layers or no active layer
        if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
            // Save state before making changes
            if (this.gridData[y][x] !== null) {
                this.app.undoManager.saveState('Erase cell');
                this.gridData[y][x] = null;
                
                // Apply mirror if active
                if (this.app.mirrorManager && 
                    this.app.mirrorManager.isActive() && 
                    this.app.mirrorManager.liveUpdate) {
                    this.app.mirrorManager.applyMirror();
                }
                
                this.render();
            }
        }
    }

    // Add this helper method
    clearSelection() {
        this.selectedCells = [];
        this.isSelecting = false;
        this.selectionStart = null;
        this.render();
    }
} 