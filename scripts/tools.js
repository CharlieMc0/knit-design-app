class ToolManager {
    constructor() {
        this.tools = ['select', 'pencil', 'rectangle', 'circle', 'line', 'fill'];
        this.currentTool = 'select';
        
        // Wait for DOM to be ready before setting up listeners
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }
    
    setupEventListeners() {
        console.log('Setting up tool event listeners');
        
        // Tool buttons
        this.tools.forEach(tool => {
            const element = document.getElementById(`${tool}-tool`);
            if (element) {
                console.log(`Adding listener for ${tool} tool`);
                element.addEventListener('click', () => {
                    console.log(`${tool} tool clicked`);
                    this.selectTool(tool);
                });
            } else {
                console.warn(`Element not found for ${tool} tool`);
            }
        });
        
        // Mark initial tool as active
        const selectTool = document.getElementById('select-tool');
        if (selectTool) {
            selectTool.classList.add('active');
        }
    }
    
    selectTool(tool) {
        console.log(`Selecting tool: ${tool}`);
        if (this.tools.includes(tool)) {
            this.currentTool = tool;
            
            // Update UI
            this.tools.forEach(t => {
                const element = document.getElementById(`${t}-tool`);
                if (element) {
                    if (t === tool) {
                        element.classList.add('active');
                    } else {
                        element.classList.remove('active');
                    }
                }
            });
        }
    }
} 