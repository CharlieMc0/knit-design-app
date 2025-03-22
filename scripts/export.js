class ExportManager {
    constructor(grid) {
        this.grid = grid;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('export-pdf').addEventListener('click', this.exportToPdf.bind(this));
        document.getElementById('share-design').addEventListener('click', this.shareDesign.bind(this));
    }
    
    exportToPdf() {
        // Note: In a real implementation, we'd use a library like jsPDF
        // For this MVP, we'll create a visual representation
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.grid.canvas.width;
        tempCanvas.height = this.grid.canvas.height;
        const ctx = tempCanvas.getContext('2d');
        
        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw grid
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= this.grid.gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.grid.cellSize, 0);
            ctx.lineTo(x * this.grid.cellSize, this.grid.gridHeight * this.grid.cellSize);
            ctx.stroke();
        }
        
        for (let y = 0; y <= this.grid.gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.grid.cellSize);
            ctx.lineTo(this.grid.gridWidth * this.grid.cellSize, y * this.grid.cellSize);
            ctx.stroke();
        }
        
        // Draw filled cells
        for (let y = 0; y < this.grid.gridHeight; y++) {
            for (let x = 0; x < this.grid.gridWidth; x++) {
                const cellColor = this.grid.gridData[y][x];
                if (cellColor) {
                    ctx.fillStyle = cellColor;
                    ctx.fillRect(
                        x * this.grid.cellSize + 1, 
                        y * this.grid.cellSize + 1, 
                        this.grid.cellSize - 1, 
                        this.grid.cellSize - 1
                    );
                }
            }
        }
        
        // Open the canvas content in a new window for preview/download
        const dataUrl = tempCanvas.toDataURL('image/png');
        const newWindow = window.open();
        newWindow.document.write(`
            <html>
                <head>
                    <title>Knitting Chart Export</title>
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            font-family: Arial, sans-serif;
                            padding: 20px;
                        }
                        .download-btn {
                            margin-top: 20px;
                            padding: 10px 20px;
                            background-color: #3498db;
                            color: white;
                            border-radius: 4px;
                            cursor: pointer;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <h2>Your Knitting Chart</h2>
                    <img src="${dataUrl}" alt="Knitting Chart">
                    <a href="${dataUrl}" download="knitting-chart.png" class="download-btn">Download as PNG</a>
                    <p>In the full version, this would be a proper PDF format.</p>
                </body>
            </html>
        `);
    }
    
    shareDesign() {
        // For MVP, we'll just create a JSON representation of the design
        const designData = {
            gridWidth: this.grid.gridWidth,
            gridHeight: this.grid.gridHeight,
            gridData: this.grid.gridData
        };
        
        // Convert to JSON string
        const jsonString = JSON.stringify(designData);
        
        // Create a data URL
        const dataBlob = new Blob([jsonString], {type: 'application/json'});
        const dataUrl = URL.createObjectURL(dataBlob);
        
        // Show a modal or popup with the sharing options
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '1000';
        
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.width = '400px';
        modalContent.style.maxWidth = '90%';
        
        modalContent.innerHTML = `
            <h3 style="margin-bottom: 15px;">Share Your Design</h3>
            <p style="margin-bottom: 15px;">In a full version, you would have options to share via email or social media. For now, you can download the design file:</p>
            <a href="${dataUrl}" download="knitting-design.json" style="display: block; text-align: center; padding: 10px; background-color: #3498db; color: white; text-decoration: none; border-radius: 4px; margin-bottom: 15px;">Download Design File</a>
            <button id="close-modal" style="display: block; width: 100%; padding: 10px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        document.getElementById('close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
} 