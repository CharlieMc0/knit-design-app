class UndoManager {
    constructor(app) {
        this.app = app;
        this.history = [];
        this.currentIndex = -1;
        
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
    
    saveState(actionDescription) {
        // Trim future states if we're in the middle of the history
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Save the current state
        const currentState = {
            gridData: JSON.parse(JSON.stringify(this.app.grid.gridData)),
            layers: this.app.layerManager ? JSON.parse(JSON.stringify(this.app.layerManager.layers)) : null,
            description: actionDescription
        };

        this.history.push(currentState);
        this.currentIndex++;
        
        console.log(`Saved state: ${actionDescription} (${this.history.length} in history)`);
    }
    
    undo() {
        if (this.currentIndex <= 0) return; // No more states to undo

        this.currentIndex--;
        const previousState = this.history[this.currentIndex];

        // Restore grid data
        this.app.grid.gridData = JSON.parse(JSON.stringify(previousState.gridData));

        // Restore layers if applicable
        if (this.app.layerManager && previousState.layers) {
            this.app.layerManager.layers = previousState.layers.map(layerData => {
                const layer = new Layer(layerData.id, layerData.name);
                layer.visible = layerData.visible;
                layer.opacity = layerData.opacity;
                layer.offsetX = layerData.offsetX || 0;
                layer.offsetY = layerData.offsetY || 0;
                layer.cells = {...layerData.cells};
                return layer;
            });
            this.app.layerManager.renderLayersList();
        }

        this.app.grid.render();
    }
} 