// Rendering engine for the circuit simulator

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = {
            offset: new Vector2(0, 0),
            zoom: 1.0,
            minZoom: 0.1,
            maxZoom: 5.0
        };
        
        this.gridSize = 20;
        this.showGrid = true;
        this.backgroundColor = '#fafafa';
        this.gridColor = 'rgba(0, 0, 0, 0.1)';
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height - 30; // Account for status bar
        
        // Update canvas style
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = (rect.height - 30) + 'px';
    }
    
    // Clear the canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill background
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Render the grid
    renderGrid() {
        if (!this.showGrid) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 1;
        
        const gridSize = this.gridSize * this.camera.zoom;
        const offsetX = this.camera.offset.x % gridSize;
        const offsetY = this.camera.offset.y % gridSize;
        
        // Vertical lines
        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = offsetY; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    // Render all components and wires
    render(components, wires, selectedTool = null, mousePos = null) {
        this.clear();
        this.renderGrid();
        
        // Render wires first (behind components)
        wires.forEach(wire => {
            wire.render(this.ctx, this.camera);
        });
        
        // Render components
        components.forEach(component => {
            component.render(this.ctx, this.camera);
        });
        
        // Render all connection points for better visibility
        this.renderAllConnectionPoints(components);
        
        // Render preview component if placing
        if (selectedTool && selectedTool !== 'select' && selectedTool !== 'wire' && mousePos) {
            this.renderPreviewComponent(selectedTool, mousePos);
        }
        
        // Render selection rectangle if dragging
        this.renderSelectionRectangle();
    }
    
    // Render preview component while placing
    renderPreviewComponent(componentType, mousePos) {
        const worldPos = Utils.screenToWorld(mousePos, this.camera);
        const snappedPos = Utils.snapToGrid(worldPos, this.gridSize);
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.7;
        
        const previewComponent = ComponentFactory.createComponent(componentType, snappedPos);
        previewComponent.render(this.ctx, this.camera);
        
        this.ctx.restore();
    }
    
    // Render selection rectangle
    renderSelectionRectangle() {
        // This will be implemented when we add selection functionality
    }
    
    // Pan the camera
    pan(deltaX, deltaY) {
        this.camera.offset.x += deltaX;
        this.camera.offset.y += deltaY;
    }
    
    // Zoom the camera
    zoom(factor, centerX = null, centerY = null) {
        const oldZoom = this.camera.zoom;
        this.camera.zoom = Math.max(this.camera.minZoom, 
                          Math.min(this.camera.maxZoom, this.camera.zoom * factor));
        
        // Zoom towards cursor position if provided
        if (centerX !== null && centerY !== null) {
            const zoomChange = this.camera.zoom / oldZoom;
            this.camera.offset.x = centerX - (centerX - this.camera.offset.x) * zoomChange;
            this.camera.offset.y = centerY - (centerY - this.camera.offset.y) * zoomChange;
        }
    }
    
    // Reset camera to default position and zoom
    resetCamera() {
        this.camera.offset = new Vector2(0, 0);
        this.camera.zoom = 1.0;
    }
    
    // Fit all components in view
    fitToView(components, wires) {
        if (components.length === 0 && wires.length === 0) {
            this.resetCamera();
            return;
        }
        
        // Calculate bounding box of all elements
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        components.forEach(component => {
            const bounds = component.getBounds();
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        });
        
        wires.forEach(wire => {
            const bounds = wire.getBounds();
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        });
        
        if (minX === Infinity) {
            this.resetCamera();
            return;
        }
        
        // Add padding
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Calculate zoom to fit
        const zoomX = this.canvas.width / width;
        const zoomY = this.canvas.height / height;
        this.camera.zoom = Math.min(zoomX, zoomY, this.camera.maxZoom);
        
        // Center the view
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        this.camera.offset.x = this.canvas.width / 2 - centerX * this.camera.zoom;
        this.camera.offset.y = this.canvas.height / 2 - centerY * this.camera.zoom;
    }
    
    // Convert screen coordinates to world coordinates
    screenToWorld(screenPos) {
        return Utils.screenToWorld(screenPos, this.camera);
    }
    
    // Convert world coordinates to screen coordinates
    worldToScreen(worldPos) {
        return Utils.worldToScreen(worldPos, this.camera);
    }
    
    // Get visible world bounds
    getVisibleBounds() {
        const topLeft = this.screenToWorld(new Vector2(0, 0));
        const bottomRight = this.screenToWorld(new Vector2(this.canvas.width, this.canvas.height));
        
        return {
            x: topLeft.x,
            y: topLeft.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        };
    }
    
    // Render connection indicators
    renderConnectionIndicators(points) {
        this.ctx.save();
        this.ctx.fillStyle = '#27ae60';
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        
        points.forEach(point => {
            const screenPoint = this.worldToScreen(point);
            this.ctx.beginPath();
            this.ctx.arc(screenPoint.x, screenPoint.y, 6, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
        });
        
        this.ctx.restore();
    }
    
    // Render wire preview while drawing
    renderWirePreview(startPoint, endPoint) {
        this.ctx.save();
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        const startScreen = this.worldToScreen(startPoint);
        const endScreen = this.worldToScreen(endPoint);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startScreen.x, startScreen.y);
        this.ctx.lineTo(endScreen.x, endScreen.y);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    // Export canvas as image
    exportAsImage(filename = 'circuit.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    // Render all connection points for better visibility
    renderAllConnectionPoints(components) {
        this.ctx.save();
        this.ctx.fillStyle = '#3498db';
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 1;
        
        components.forEach(component => {
            const points = component.getConnectionPoints();
            points.forEach(point => {
                const screenPoint = this.worldToScreen(point);
                this.ctx.beginPath();
                this.ctx.arc(screenPoint.x, screenPoint.y, 3 * this.camera.zoom, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();
            });
        });
        
        this.ctx.restore();
    }
    
    // Get canvas data URL
    getDataURL(type = 'image/png', quality = 1.0) {
        return this.canvas.toDataURL(type, quality);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}