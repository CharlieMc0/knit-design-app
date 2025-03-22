class ColorManager {
    constructor() {
        this.colors = [
            '#000000', // Black
            '#FFFFFF', // White
            '#FF0000', // Red
            '#00FF00', // Green
            '#0000FF', // Blue
            '#FFFF00', // Yellow
            '#FF00FF', // Magenta
            '#00FFFF'  // Cyan
        ];
        this.selectedColor = this.colors[0];
        this.maxColors = 12;
        
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    initialize() {
        console.log('Initializing ColorManager');
        this.colorPalette = document.getElementById('color-palette');
        this.colorPickerModal = document.getElementById('color-picker-modal');
        this.colorPicker = document.getElementById('color-picker');
        
        if (!this.colorPalette) {
            console.error('Color palette element not found');
            return;
        }
        
        this.initializeColorPalette();
        this.setupEventListeners();
    }
    
    initializeColorPalette() {
        this.colorPalette.innerHTML = '';
        
        this.colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            
            if (color === this.selectedColor) {
                swatch.classList.add('active');
            }
            
            swatch.addEventListener('click', () => {
                this.selectColor(color);
            });
            
            this.colorPalette.appendChild(swatch);
        });
    }
    
    setupEventListeners() {
        // Add color button
        document.getElementById('add-color').addEventListener('click', () => {
            if (this.colors.length < this.maxColors) {
                this.openColorPicker();
            } else {
                alert(`Maximum of ${this.maxColors} colors allowed.`);
            }
        });
        
        // Color picker modal
        document.querySelector('.close').addEventListener('click', () => {
            this.colorPickerModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === this.colorPickerModal) {
                this.colorPickerModal.style.display = 'none';
            }
        });
        
        document.getElementById('confirm-color').addEventListener('click', () => {
            const color = this.colorPicker.value;
            this.addColor(color);
            this.colorPickerModal.style.display = 'none';
        });
    }
    
    openColorPicker() {
        this.colorPicker.value = '#000000';
        this.colorPickerModal.style.display = 'block';
    }
    
    addColor(color) {
        if (this.colors.length < this.maxColors) {
            this.colors.push(color);
            this.selectColor(color);
            this.initializeColorPalette();
        }
    }
    
    selectColor(color) {
        this.selectedColor = color;
        
        // Update UI
        const swatches = this.colorPalette.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            swatch.classList.remove('active');
            if (swatch.style.backgroundColor === color) {
                swatch.classList.add('active');
            }
        });
    }
} 