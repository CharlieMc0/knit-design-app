class Layer {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.visible = true;
        this.opacity = 100;
        this.data = []; // Will store the cells for this layer
        this.position = { x: 0, y: 0 }; // Position offset
        this.selected = false;
    }
}

class LayerManager {
    constructor(app) {
        this.app = app;
        this.layers = [];
        this.activeLayerId = null;
        this.nextLayerId = 1;
        
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
        
        // Layer position inputs
        const layerXInput = document.getElementById('layer-x');
        const layerYInput = document.getElementById('layer-y');
        
        if (layerXInput && layerYInput) {
            layerXInput.addEventListener('change', (e) => {
                const layer = this.getActiveLayer();
                if (layer) {
                    layer.position.x = parseInt(e.target.value);
                    this.app.grid.render();
                }
            });
            
            layerYInput.addEventListener('change', (e) => {
                const layer = this.getActiveLayer();
                if (layer) {
                    layer.position.y = parseInt(e.target.value);
                    this.app.grid.render();
                }
            });
        }
        
        // Arrow movement buttons
        const moveUpBtn = document.getElementById('layer-move-up');
        const moveDownBtn = document.getElementById('layer-move-down');
        const moveLeftBtn = document.getElementById('layer-move-left');
        const moveRightBtn = document.getElementById('layer-move-right');
        
        if (moveUpBtn) {
            moveUpBtn.addEventListener('click', () => this.moveActiveLayer(0, -1));
        }
        
        if (moveDownBtn) {
            moveDownBtn.addEventListener('click', () => this.moveActiveLayer(0, 1));
        }
        
        if (moveLeftBtn) {
            moveLeftBtn.addEventListener('click', () => this.moveActiveLayer(-1, 0));
        }
        
        if (moveRightBtn) {
            moveRightBtn.addEventListener('click', () => this.moveActiveLayer(1, 0));
        }
    }
    
    addLayer(name) {
        const layer = new Layer(this.nextLayerId++, name);
        this.layers.push(layer);
        
        // Initialize with empty data
        layer.data = Array(this.app.grid.gridHeight).fill().map(() => 
            Array(this.app.grid.gridWidth).fill(null)
        );
        
        this.setActiveLayer(layer.id);
        this.renderLayersList();
        
        return layer;
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
        // Save current active layer's grid data first
        this.saveCurrentLayerData();
        
        // Update active layer
        this.activeLayerId = layerId;
        
        // Update layer selection
        this.layers.forEach(layer => {
            layer.selected = (layer.id === layerId);
        });
        
        // Load this layer's data into the main grid
        this.loadActiveLayerData();
        
        // Update UI
        this.renderLayersList();
        this.updateLayerControls();
    }
    
    getActiveLayer() {
        return this.layers.find(layer => layer.id === this.activeLayerId);
    }
    
    saveCurrentLayerData() {
        const activeLayer = this.getActiveLayer();
        if (activeLayer) {
            // Deep copy the grid data to this layer
            activeLayer.data = JSON.parse(JSON.stringify(this.app.grid.gridData));
            
            // Force a re-render to show changes
            this.app.grid.render();
        }
    }
    
    loadActiveLayerData() {
        const activeLayer = this.getActiveLayer();
        if (activeLayer && activeLayer.data) {
            // Deep copy this layer's data to the grid
            this.app.grid.gridData = JSON.parse(JSON.stringify(activeLayer.data));
            this.app.grid.render();
        }
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
        const layerXInput = document.getElementById('layer-x');
        const layerYInput = document.getElementById('layer-y');
        
        if (opacitySlider) opacitySlider.value = layer.opacity;
        if (layerXInput) layerXInput.value = layer.position.x;
        if (layerYInput) layerYInput.value = layer.position.y;
    }
    
    getAllVisibleLayers() {
        return this.layers.filter(layer => layer.visible);
    }
    
    moveActiveLayer(deltaX, deltaY) {
        const layer = this.getActiveLayer();
        if (layer) {
            layer.position.x += deltaX;
            layer.position.y += deltaY;
            
            // Update input fields
            const layerXInput = document.getElementById('layer-x');
            const layerYInput = document.getElementById('layer-y');
            
            if (layerXInput) layerXInput.value = layer.position.x;
            if (layerYInput) layerYInput.value = layer.position.y;
            
            // Render changes
            this.app.grid.render();
        }
    }
} 