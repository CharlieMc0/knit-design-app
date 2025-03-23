class KnittingChartApp {
    constructor() {
        // Enable debug mode
        this.debug = true;
        
        // Log initialization
        if (this.debug) {
            console.log('Initializing KnittingChartApp');
            
            // Add a global error handler
            window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
            });
        }
        
        // Store app reference
        window.app = this;
        
        // Set pencil as the default tool and update UI
        this._currentTool = 'pencil';
        
        // Remove 'active' class from all tools and add it only to pencil
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('pencil-tool').classList.add('active');
        
        // Initialize components with app reference
        this.grid = new KnittingGrid(this);
        this.colorManager = new ColorManager(this);
        this.toolManager = new ToolManager(this);
        this.shapeDrawer = new ShapeDrawer(this.grid);
        this.mirrorManager = new MirrorManager(this);
        this.exportManager = new ExportManager(this.grid);
        this.undoManager = new UndoManager(this);
        this.layerManager = new LayerManager(this);
        
        // Clipboard data for copy/paste
        this.clipboardData = null;
        
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

        // Set pencil as the default tool
        this.toolManager.selectTool('pencil-tool');

        this.setupEventListeners();
        this.setupToolbarResize();
    }

    setupEventListeners() {
        // Implementation of setupEventListeners method
        this.setupHeaderResize();
    }

    setupToolbarResize() {
        const toolbar = document.querySelector('.toolbar');
        const handle = document.querySelector('.toolbar-resize-handle');
        let isResizing = false;
        let startX;
        let startWidth;
        
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.pageX;
            startWidth = parseInt(getComputedStyle(toolbar).width, 10);
            
            // Add resizing class to prevent text selection
            document.body.classList.add('resizing');
            handle.classList.add('active');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const width = startWidth + (e.pageX - startX);
            
            // Update constraints to match CSS
            if (width >= 120 && width <= 400) {
                toolbar.style.width = `${width}px`;
                
                // Force a re-render of the grid to adjust to new layout
                if (this.grid) {
                    this.grid.render();
                }
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.classList.remove('resizing');
                handle.classList.remove('active');
            }
        });
    }

    setupHeaderResize() {
        const header = document.querySelector('header');
        const topControls = document.querySelector('.top-controls');
        const handle = document.querySelector('.header-resize-handle');
        let isResizing = false;
        let startY;
        let startHeight;
        
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.pageY;
            startHeight = parseInt(getComputedStyle(header).height, 10);
            
            // Add resizing class to prevent text selection
            document.body.classList.add('resizing');
            handle.classList.add('active');
            
            // Prevent default to avoid text selection
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const height = startHeight + (e.pageY - startY);
            
            // Constrain height between min and max values
            if (height >= 80 && height <= 300) {
                header.style.height = `${height}px`;
                
                // Explicitly set the top-controls height to fill the header
                // Subtract padding to ensure it fits
                topControls.style.height = (height - 32) + 'px'; // 32px accounts for padding
                
                // Force a re-render of the grid to adjust to new layout
                if (this.grid) {
                    this.grid.render();
                }
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.classList.remove('resizing');
                handle.classList.remove('active');
            }
        });
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