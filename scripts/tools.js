class ToolManager {
    constructor(app) {
        this.app = app;
        this.currentTool = 'pencil'; // Default tool

        this.setupToolListeners();
    }

    setupToolListeners() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTool(btn.id);
            });
        });
    }

    selectTool(toolId) {
        // Remove 'active' class from all tools
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Set the selected tool as active
        const selectedButton = document.getElementById(toolId);
        selectedButton.classList.add('active');

        // Update the current tool
        this.currentTool = toolId.replace('-tool', '');
        this.app.currentTool = this.currentTool;
    }
} 