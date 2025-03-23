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
        if (color) {
            this.cells[`${x},${y}`] = color;
        } else {
            delete this.cells[`${x},${y}`];
        }
    }
    
    // Get a cell at layer-local coordinates
    getCell(x, y) {
        return this.cells[`${x},${y}`] || null;
    }
    
    // Clear all cells
    clearCells() {
        this.cells = {};
    }
    
    // Convert grid (world) coordinates to layer-local coordinates
    worldToLocal(worldX, worldY) {
        return {
            x: worldX - this.offsetX,
            y: worldY - this.offsetY
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
        
        // Add drag state properties
        this.draggedLayer = null;
        this.draggedElement = null;
        
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
        
        // Add drag and drop event delegation to layers list
        const layersList = document.getElementById('layers-list');
        layersList.addEventListener('dragstart', this.handleDragStart.bind(this));
        layersList.addEventListener('dragend', this.handleDragEnd.bind(this));
        layersList.addEventListener('dragover', this.handleDragOver.bind(this));
        layersList.addEventListener('drop', this.handleDrop.bind(this));

        // Add merge down button listener
        const mergeDownBtn = document.getElementById('merge-down');
        if (mergeDownBtn) {
            mergeDownBtn.addEventListener('click', () => {
                this.mergeDown();
            });
        }
    }
    
    addLayer(name) {
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
        layersList.innerHTML = '';
        
        // Render layers from top to bottom
        this.layers.slice().reverse().forEach(layer => {
            const layerItem = document.createElement('div');
            layerItem.className = `layer-item${layer.id === this.activeLayerId ? ' active' : ''}`;
            layerItem.setAttribute('data-layer-id', layer.id);
            layerItem.draggable = true; // Make layer items draggable
            
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
        
        // If enabling drag mode, disable mirror live updates
        if (this.dragMode && this.app.mirrorManager) {
            // Store the previous state so we can restore it later
            this.previousLiveUpdateState = this.app.mirrorManager.liveUpdate;
            this.app.mirrorManager.liveUpdate = false;
            
            // Update the checkbox in the UI
            const liveUpdateToggle = document.getElementById('mirror-live-toggle');
            if (liveUpdateToggle) {
                liveUpdateToggle.checked = false;
            }
        } else if (!this.dragMode && this.app.mirrorManager) {
            // Restore previous live update state when disabling drag mode
            this.app.mirrorManager.liveUpdate = this.previousLiveUpdateState;
            
            // Update the checkbox in the UI
            const liveUpdateToggle = document.getElementById('mirror-live-toggle');
            if (liveUpdateToggle) {
                liveUpdateToggle.checked = this.previousLiveUpdateState;
            }
        }
        
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
    
    handleDragStart(e) {
        const layerItem = e.target.closest('.layer-item');
        if (!layerItem) return;
        
        this.draggedElement = layerItem;
        this.draggedLayer = this.layers.find(l => l.id === parseInt(layerItem.dataset.layerId));
        
        layerItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', layerItem.dataset.layerId);
    }
    
    handleDragEnd(e) {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            
            // Remove drag-over class from all items
            document.querySelectorAll('.layer-item').forEach(item => {
                item.classList.remove('drag-over');
            });
            
            this.draggedElement = null;
            this.draggedLayer = null;
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const layerItem = e.target.closest('.layer-item');
        if (!layerItem || layerItem === this.draggedElement) return;
        
        // Remove drag-over class from all items
        document.querySelectorAll('.layer-item').forEach(item => {
            item.classList.remove('drag-over');
        });
        
        // Add drag-over class to current target
        layerItem.classList.add('drag-over');
    }
    
    handleDrop(e) {
        e.preventDefault();
        
        const targetItem = e.target.closest('.layer-item');
        if (!targetItem || targetItem === this.draggedElement) return;
        
        const draggedId = parseInt(this.draggedElement.dataset.layerId);
        const targetId = parseInt(targetItem.dataset.layerId);
        
        // Save state before reordering
        this.app.undoManager.saveState('Reorder layers');
        
        // Find indices
        const draggedIndex = this.layers.findIndex(l => l.id === draggedId);
        const targetIndex = this.layers.findIndex(l => l.id === targetId);
        
        // Reorder layers
        const [movedLayer] = this.layers.splice(draggedIndex, 1);
        this.layers.splice(targetIndex, 0, movedLayer);
        
        // Update the display
        this.renderLayersList();
        this.app.grid.render();
    }

    // Add new method to merge layers
    mergeDown() {
        const activeLayer = this.getActiveLayer();
        if (!activeLayer) return;

        // Find the index of the active layer
        const activeIndex = this.layers.findIndex(l => l.id === activeLayer.id);
        
        // Check if there's a layer below
        if (activeIndex <= 0) {
            this.app.grid.showToast('No layer below to merge with');
            return;
        }

        // Get the layer below
        const lowerLayer = this.layers[activeIndex - 1];
        
        // Save state before merging
        this.app.undoManager.saveState('Merge layers');

        // Create a new merged layer
        const mergedLayer = new Layer(this.nextLayerId++, `Merged Layer ${this.nextLayerId}`);
        
        // Copy cells from lower layer first (so upper layer takes precedence)
        Object.entries(lowerLayer.cells).forEach(([key, color]) => {
            const [x, y] = key.split(',').map(Number);
            // Convert from lower layer's local coordinates to world coordinates
            const worldPos = lowerLayer.localToWorld(x, y);
            // Convert world coordinates to merged layer's local coordinates
            const localPos = mergedLayer.worldToLocal(worldPos.x, worldPos.y);
            mergedLayer.setCell(localPos.x, localPos.y, color);
        });

        // Copy cells from active (upper) layer
        Object.entries(activeLayer.cells).forEach(([key, color]) => {
            const [x, y] = key.split(',').map(Number);
            // Convert from active layer's local coordinates to world coordinates
            const worldPos = activeLayer.localToWorld(x, y);
            // Convert world coordinates to merged layer's local coordinates
            const localPos = mergedLayer.worldToLocal(worldPos.x, worldPos.y);
            mergedLayer.setCell(localPos.x, localPos.y, color);
        });

        // Set opacity to the active layer's opacity
        mergedLayer.opacity = activeLayer.opacity;
        
        // Remove the two original layers
        this.layers.splice(activeIndex - 1, 2);
        
        // Add the merged layer in their place
        this.layers.splice(activeIndex - 1, 0, mergedLayer);
        
        // Set the merged layer as active
        this.setActiveLayer(mergedLayer.id);
        
        // Update the display
        this.renderLayersList();
        this.app.grid.render();
        
        this.app.grid.showToast('Layers merged successfully');
    }
} 