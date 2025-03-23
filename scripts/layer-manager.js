class Layer {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.visible = true;
        this.opacity = 100;
        this.offsetX = 0; // Position offset X
        this.offsetY = 0; // Position offset Y
        this.cells = {};  // Store cells in a sparse object format using "x,y" keys
        this.selected = false;
    }
    
    // Set a cell at layer-local coordinates
    setCell(x, y, color) {
        const key = `${x},${y}`;
        this.cells[key] = color;
    }
    
    // Get a cell at layer-local coordinates
    getCell(x, y) {
        const key = `${x},${y}`;
        return this.cells[key] || null;
    }
    
    // Clear all cells
    clearCells() {
        this.cells = {};
    }
    
    // Convert grid (world) coordinates to layer-local coordinates
    worldToLocal(gridX, gridY) {
        return {
            x: gridX - this.offsetX,
            y: gridY - this.offsetY
        };
    }
    
    // Convert layer-local coordinates to grid (world) coordinates
    localToWorld(localX, localY) {
        return {
            x: localX + this.offsetX,
            y: localY + this.offsetY
        };
    }
}

class LayerManager {
    constructor(app) {
        this.app = app;
        this.layers = [];
        this.activeLayerId = null;
        this.nextLayerId = 1;
        this.dragMode = false; // Track if we're in layer drag mode
        this.isDragging = false; // Track active dragging
        this.dragStart = { x: 0, y: 0 }; // Start position for drag
        
        // Create default layer
        this.addLayer('Background');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Add layer button
        const addLayerBtn = document.getElementById('add-layer');
        if (addLayerBtn) {
            addLayerBtn.addEventListener('click', () => {
                const name = `Layer ${this.nextLayerId}`;
                this.addLayer(name);
            });
        }
        
        // Delete layer button
        const deleteLayerBtn = document.getElementById('delete-layer');
        if (deleteLayerBtn) {
            deleteLayerBtn.addEventListener('click', () => {
                this.deleteActiveLayer();
            });
        }
        
        // Layer opacity slider
        const opacitySlider = document.getElementById('layer-opacity');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                this.setLayerOpacity(this.activeLayerId, parseInt(e.target.value));
            });
        }
        
        // Layer drag toggle button
        const dragToggleBtn = document.getElementById('layer-drag-toggle');
        if (dragToggleBtn) {
            dragToggleBtn.addEventListener('click', () => {
                this.toggleDragMode();
            });
        }
        
        // Add drag event handlers to the canvas
        const canvas = this.app.grid.canvas;
        const canvasContainer = document.querySelector('.canvas-container');
        
        canvas.addEventListener('mousedown', (e) => {
            if (!this.dragMode) return;
            
            const rect = canvas.getBoundingClientRect();
            const labelMargin = 20;
            
            // Get mouse position in grid coordinates
            const mouseX = Math.floor((e.clientX - rect.left - labelMargin) / this.app.grid.cellSize);
            const mouseY = Math.floor((e.clientY - rect.top - labelMargin) / this.app.grid.cellSize);
            
            this.isDragging = true;
            this.dragStart = { x: mouseX, y: mouseY };
            
            // Prevent default to avoid selection
            e.preventDefault();
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const rect = canvas.getBoundingClientRect();
            const labelMargin = 20;
            
            // Get current mouse position
            const mouseX = Math.floor((e.clientX - rect.left - labelMargin) / this.app.grid.cellSize);
            const mouseY = Math.floor((e.clientY - rect.top - labelMargin) / this.app.grid.cellSize);
            
            // Calculate the movement delta
            const deltaX = mouseX - this.dragStart.x;
            const deltaY = mouseY - this.dragStart.y;
            
            if (deltaX !== 0 || deltaY !== 0) {
                // Move the active layer
                const layer = this.getActiveLayer();
                if (layer) {
                    layer.offsetX += deltaX;
                    layer.offsetY += deltaY;
                    
                    // Update the position display
                    this.updatePositionDisplay();
                    
                    // Update drag start for next movement
                    this.dragStart = { x: mouseX, y: mouseY };
                    
                    // Redraw
                    this.app.grid.render();
                }
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
    }
    
    addLayer(name) {
        // Make sure we're creating a proper Layer instance with all methods
        const layer = new Layer(this.nextLayerId++, name);
        this.layers.push(layer);
        
        this.setActiveLayer(layer.id);
        this.renderLayersList();
        this.app.grid.render();
    }
    
    deleteActiveLayer() {
        if (this.layers.length <= 1) {
            alert("Cannot delete the only layer.");
            return;
        }
        
        const index = this.layers.findIndex(l => l.id === this.activeLayerId);
        if (index !== -1) {
            this.layers.splice(index, 1);
            
            // Set a new active layer
            this.setActiveLayer(this.layers[Math.max(0, index - 1)].id);
            this.renderLayersList();
            this.app.grid.render();
        }
    }
    
    setActiveLayer(layerId) {
        // Update active layer
        this.activeLayerId = layerId;
        
        // Update layer selection
        this.layers.forEach(layer => {
            layer.selected = (layer.id === layerId);
        });
        
        // Update UI
        this.renderLayersList();
        this.updateLayerControls();
        
        // Redraw with new active layer
        this.app.grid.render();
    }
    
    getActiveLayer() {
        return this.layers.find(layer => layer.id === this.activeLayerId);
    }
    
    // Method to set a cell color on the active layer
    setCellOnActiveLayer(localX, localY, color) {
        const layer = this.getActiveLayer();
        if (layer) {
            layer.setCell(localX, localY, color);
            
            // Force a render to see the changes
            this.app.grid.render();
            return true;
        }
        return false;
    }
    
    // Convert grid (world) coordinates to local coordinates for the active layer
    activeLayerGridToLocal(gridX, gridY) {
        const layer = this.getActiveLayer();
        if (layer) {
            return layer.worldToLocal(gridX, gridY);
        }
        return { x: gridX, y: gridY };
    }
    
    toggleLayerVisibility(layerId) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.visible = !layer.visible;
            this.renderLayersList();
            this.app.grid.render();
        }
    }
    
    setLayerOpacity(layerId, opacity) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.opacity = opacity;
            this.app.grid.render();
        }
    }
    
    renderLayersList() {
        const layersList = document.getElementById('layers-list');
        if (!layersList) return;
        
        layersList.innerHTML = '';
        
        // Add layers from bottom to top (reverse order of rendering)
        [...this.layers].reverse().forEach(layer => {
            const layerItem = document.createElement('div');
            layerItem.className = `layer-item${layer.selected ? ' active' : ''}`;
            
            const visibilityIcon = document.createElement('span');
            visibilityIcon.className = 'layer-visibility';
            visibilityIcon.innerHTML = layer.visible ? '👁️' : '👁️‍🗨️';
            visibilityIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLayerVisibility(layer.id);
            });
            
            const layerName = document.createElement('span');
            layerName.className = 'layer-name';
            layerName.textContent = layer.name;
            
            layerItem.appendChild(visibilityIcon);
            layerItem.appendChild(layerName);
            
            layerItem.addEventListener('click', () => {
                this.setActiveLayer(layer.id);
            });
            
            layersList.appendChild(layerItem);
        });
    }
    
    updateLayerControls() {
        const layer = this.getActiveLayer();
        if (!layer) return;
        
        const opacitySlider = document.getElementById('layer-opacity');
        
        if (opacitySlider) opacitySlider.value = layer.opacity;
    }
    
    getAllVisibleLayers() {
        return this.layers.filter(layer => layer.visible);
    }
    
    toggleDragMode() {
        this.dragMode = !this.dragMode;
        
        // Toggle the button appearance
        const dragToggleBtn = document.getElementById('layer-drag-toggle');
        if (dragToggleBtn) {
            dragToggleBtn.classList.toggle('active', this.dragMode);
        }
        
        // Toggle cursor style on canvas container
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
            canvasContainer.classList.toggle('layer-drag-mode', this.dragMode);
        }
        
        // Show current position
        this.updatePositionDisplay();
    }
    
    updatePositionDisplay() {
        const layer = this.getActiveLayer();
        const posDisplay = document.querySelector('.layer-position-display');
        
        if (layer && posDisplay) {
            posDisplay.textContent = this.dragMode ? 
                `Position: X:${layer.offsetX}, Y:${layer.offsetY}` : '';
        }
    }
} 