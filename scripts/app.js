class KnittingChartApp {
    constructor() {
        // Store app reference
        window.app = this;
        
        // Initialize components with app reference
        this.grid = new KnittingGrid(this);
        this.colorManager = new ColorManager(this);
        this.toolManager = new ToolManager();
        this.shapeDrawer = new ShapeDrawer(this.grid);
        this.mirrorManager = new MirrorManager(this);
        this.exportManager = new ExportManager(this.grid);
        this.undoManager = new UndoManager(this);
        this.layerManager = new LayerManager(this);
        
        // Clipboard data for copy/paste
        this.clipboardData = null;
        
        // Set current tool property for easy access
        this._currentTool = this.toolManager.currentTool;
        
        // Update current tool when toolManager changes it
        const self = this;
        Object.defineProperty(this, 'currentTool', {
            get() {
                return self._currentTool;
            },
            set(value) {
                self._currentTool = value;
            }
        });

        // Link toolManager's currentTool to app's currentTool
        Object.defineProperty(this.toolManager, 'currentTool', {
            get() {
                return self._currentTool;
            },
            set(value) {
                self.currentTool = value;
            }
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Implementation of setupEventListeners method
    }
}

// Initialize app when DOM is loaded (only once)
window.addEventListener('DOMContentLoaded', () => {
    new KnittingChartApp();
});

// Remove the duplicate app initialization
// document.addEventListener('DOMContentLoaded', () => {
//     window.knittingApp = new KnittingApp();
// }); 