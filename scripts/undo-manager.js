class UndoManager {
    constructor(app) {
        this.app = app;
        this.undoStack = [];
        this.maxStackSize = 50; // Limit stack size to prevent memory issues
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const undoBtn = document.getElementById('undo-action');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }
        
        // Add keyboard shortcut for undo
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z') {
                this.undo();
                e.preventDefault(); // Prevent browser default undo
            }
        });
    }
    
    saveState(description = 'action') {
        // Get active layer
        const activeLayer = this.app.layerManager.getActiveLayer();
        
        // Create a snapshot of current state
        const stateSnapshot = {
            gridData: JSON.parse(JSON.stringify(this.app.grid.gridData)),
            layers: JSON.parse(JSON.stringify(this.app.layerManager.layers)),
            activeLayerId: this.app.layerManager.activeLayerId
        };
        
        // Save to undo stack
        this.undoStack.push({
            description: description,
            state: stateSnapshot,
            timestamp: Date.now()
        });
        
        // Limit stack size
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift(); // Remove oldest state
        }
        
        console.log(`Saved state: ${description} (${this.undoStack.length} in history)`);
    }
    
    undo() {
        if (this.undoStack.length === 0) {
            console.log('Nothing to undo');
            return;
        }
        
        // Get the most recent state
        const previousState = this.undoStack.pop();
        console.log(`Undoing: ${previousState.description}`);
        
        // Restore grid data
        this.app.grid.gridData = previousState.state.gridData;
        
        // Restore layer data
        this.app.layerManager.layers = previousState.state.layers;
        this.app.layerManager.activeLayerId = previousState.state.activeLayerId;
        
        // Update UI
        this.app.layerManager.renderLayersList();
        this.app.layerManager.updateLayerControls();
        
        // Redraw grid
        this.app.grid.render();
    }
} 