// Input handling for mouse and keyboard interactions

class InputHandler {
    constructor(canvas, renderer) {
        this.canvas = canvas;
        this.renderer = renderer;
        
        // Mouse state
        this.mousePos = new Vector2(0, 0);
        this.lastMousePos = new Vector2(0, 0);
        this.mouseDown = false;
        this.rightMouseDown = false;
        this.middleMouseDown = false;
        
        // Interaction state
        this.isDragging = false;
        this.isPanning = false;
        this.isDrawingWire = false;
        this.wireStartPoint = null;
        
        // Selection state
        this.selectedComponents = [];
        this.hoveredComponent = null;
        
        // Tool state
        this.selectedTool = 'select';
        
        // Event callbacks
        this.onComponentSelect = null;
        this.onComponentPlace = null;
        this.onComponentMove = null;
        this.onWireCreate = null;
        this.onToolChange = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevent default drag behavior
        this.canvas.addEventListener('dragstart', (e) => e.preventDefault());
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos = new Vector2(e.clientX - rect.left, e.clientY - rect.top);
        this.lastMousePos = this.mousePos.clone();
        
        if (e.button === 0) { // Left mouse button
            this.mouseDown = true;
            this.handleLeftMouseDown(e);
        } else if (e.button === 1) { // Middle mouse button
            this.middleMouseDown = true;
            this.isPanning = true;
        } else if (e.button === 2) { // Right mouse button
            this.rightMouseDown = true;
            this.handleRightMouseDown(e);
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.lastMousePos = this.mousePos.clone();
        this.mousePos = new Vector2(e.clientX - rect.left, e.clientY - rect.top);
        
        const deltaX = this.mousePos.x - this.lastMousePos.x;
        const deltaY = this.mousePos.y - this.lastMousePos.y;
        
        // Update cursor
        this.updateCursor();
        
        // Handle panning
        if (this.isPanning || (this.mouseDown && e.ctrlKey)) {
            this.renderer.pan(deltaX, deltaY);
            return;
        }
        
        // Handle component dragging
        if (this.isDragging && this.selectedComponents.length > 0) {
            this.handleComponentDrag(deltaX, deltaY);
            return;
        }
        
        // Handle wire drawing
        if (this.isDrawingWire && this.wireStartPoint) {
            // Wire preview is handled in the render loop
            return;
        }
        
        // Update hovered component
        this.updateHoveredComponent();
        
        // Update coordinates display
        this.updateCoordinatesDisplay();
    }
    
    handleMouseUp(e) {
        if (e.button === 0) { // Left mouse button
            this.mouseDown = false;
            this.handleLeftMouseUp(e);
        } else if (e.button === 1) { // Middle mouse button
            this.middleMouseDown = false;
            this.isPanning = false;
        } else if (e.button === 2) { // Right mouse button
            this.rightMouseDown = false;
            this.handleRightMouseUp(e);
        }
        
        this.isDragging = false;
    }
    
    handleLeftMouseDown(e) {
        const worldPos = this.renderer.screenToWorld(this.mousePos);
        
        switch (this.selectedTool) {
            case 'select':
                this.handleSelectTool(worldPos, e);
                break;
            case 'wire':
                this.handleWireTool(worldPos);
                break;
            default:
                this.handleComponentPlacement(worldPos);
                break;
        }
    }
    
    handleLeftMouseUp(e) {
        // Handle end of interactions
        if (this.isDragging) {
            this.isDragging = false;
        }
    }
    
    handleRightMouseDown(e) {
        // Right-click context menu or cancel current action
        if (this.isDrawingWire) {
            this.cancelWireDrawing();
        } else {
            this.showContextMenu(e);
        }
    }
    
    handleRightMouseUp(e) {
        // Handle right mouse up
    }
    
    handleSelectTool(worldPos, e) {
        const component = this.findComponentAt(worldPos);
        
        if (component) {
            if (!e.ctrlKey && !e.shiftKey) {
                this.clearSelection();
            }
            
            if (component.selected) {
                if (e.ctrlKey) {
                    this.deselectComponent(component);
                } else {
                    this.isDragging = true;
                }
            } else {
                this.selectComponent(component);
                this.isDragging = true;
            }
        } else {
            if (!e.ctrlKey && !e.shiftKey) {
                this.clearSelection();
            }
            // Start selection rectangle (to be implemented)
        }
    }
    
    handleWireTool(worldPos) {
        const snappedPos = Utils.snapToGrid(worldPos, this.renderer.gridSize);
        
        if (!this.isDrawingWire) {
            // Start drawing wire
            this.wireStartPoint = snappedPos;
            this.isDrawingWire = true;
        } else {
            // Finish drawing wire
            if (this.wireStartPoint && this.wireStartPoint.distance(snappedPos) > 5) {
                this.createWire(this.wireStartPoint, snappedPos);
            }
            this.cancelWireDrawing();
        }
    }
    
    handleComponentPlacement(worldPos) {
        const snappedPos = Utils.snapToGrid(worldPos, this.renderer.gridSize);
        this.placeComponent(this.selectedTool, snappedPos);
    }
    
    handleComponentDrag(deltaX, deltaY) {
        const worldDelta = new Vector2(deltaX / this.renderer.camera.zoom, deltaY / this.renderer.camera.zoom);
        
        this.selectedComponents.forEach(component => {
            component.position = component.position.add(worldDelta);
            
            // Snap to grid if not holding Alt
            if (!this.isKeyPressed('Alt')) {
                component.position = Utils.snapToGrid(component.position, this.renderer.gridSize);
            }
        });
        
        if (this.onComponentMove) {
            this.onComponentMove(this.selectedComponents);
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.renderer.zoom(zoomFactor, this.mousePos.x, this.mousePos.y);
    }
    
    handleKeyDown(e) {
        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                this.deleteSelected();
                break;
            case 'Escape':
                this.cancelCurrentAction();
                break;
            case 'a':
            case 'A':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.selectAll();
                }
                break;
            case 'c':
            case 'C':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.copySelected();
                }
                break;
            case 'v':
            case 'V':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.pasteComponents();
                }
                break;
            case 'z':
            case 'Z':
                if (e.ctrlKey) {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                }
                break;
            case 'r':
            case 'R':
                this.rotateSelected();
                break;
        }
        
        // Tool shortcuts
        this.handleToolShortcuts(e);
    }
    
    handleKeyUp(e) {
        // Handle key releases
    }
    
    handleToolShortcuts(e) {
        const shortcuts = {
            's': 'select',
            'w': 'wire',
            'r': 'resistor',
            'c': 'capacitor',
            'l': 'inductor',
            'v': 'voltage',
            'g': 'ground'
        };
        
        const tool = shortcuts[e.key.toLowerCase()];
        if (tool && !e.ctrlKey && !e.altKey) {
            this.setSelectedTool(tool);
        }
    }
    
    // Component management
    findComponentAt(worldPos) {
        // This will be set by the main application
        if (this.components) {
            for (let i = this.components.length - 1; i >= 0; i--) {
                if (this.components[i].containsPoint(worldPos)) {
                    return this.components[i];
                }
            }
        }
        
        // Check wires
        if (this.wires) {
            for (let i = this.wires.length - 1; i >= 0; i--) {
                if (this.wires[i].containsPoint(worldPos)) {
                    return this.wires[i];
                }
            }
        }
        
        return null;
    }
    
    selectComponent(component) {
        component.selected = true;
        if (!this.selectedComponents.includes(component)) {
            this.selectedComponents.push(component);
        }
        
        if (this.onComponentSelect) {
            this.onComponentSelect(component);
        }
    }
    
    deselectComponent(component) {
        component.selected = false;
        const index = this.selectedComponents.indexOf(component);
        if (index > -1) {
            this.selectedComponents.splice(index, 1);
        }
    }
    
    clearSelection() {
        this.selectedComponents.forEach(component => {
            component.selected = false;
        });
        this.selectedComponents = [];
    }
    
    selectAll() {
        if (this.components) {
            this.components.forEach(component => {
                this.selectComponent(component);
            });
        }
        if (this.wires) {
            this.wires.forEach(wire => {
                this.selectComponent(wire);
            });
        }
    }
    
    deleteSelected() {
        if (this.selectedComponents.length > 0 && this.onComponentDelete) {
            this.onComponentDelete(this.selectedComponents);
            this.clearSelection();
        }
    }
    
    rotateSelected() {
        this.selectedComponents.forEach(component => {
            if (component.type !== 'wire' && component.type !== 'ground') {
                component.rotation += Math.PI / 2;
                if (component.rotation >= 2 * Math.PI) {
                    component.rotation = 0;
                }
            }
        });
    }
    
    placeComponent(type, position) {
        if (this.onComponentPlace) {
            this.onComponentPlace(type, position);
        }
    }
    
    createWire(startPoint, endPoint) {
        if (this.onWireCreate) {
            this.onWireCreate(startPoint, endPoint);
        }
    }
    
    cancelWireDrawing() {
        this.isDrawingWire = false;
        this.wireStartPoint = null;
    }
    
    cancelCurrentAction() {
        this.cancelWireDrawing();
        this.clearSelection();
        // Don't call setSelectedTool to avoid recursion
        this.selectedTool = 'select';
        if (this.onToolChange) {
            this.onToolChange('select');
        }
    }
    
    // Tool management
    setSelectedTool(tool) {
        // Only cancel current action if switching to a different tool
        if (this.selectedTool !== tool) {
            this.cancelWireDrawing();
            this.clearSelection();
        }
        
        this.selectedTool = tool;
        
        if (this.onToolChange) {
            this.onToolChange(tool);
        }
    }
    
    getSelectedTool() {
        return this.selectedTool;
    }
    
    // UI updates
    updateCursor() {
        switch (this.selectedTool) {
            case 'select':
                this.canvas.style.cursor = this.hoveredComponent ? 'pointer' : 'default';
                break;
            case 'wire':
                this.canvas.style.cursor = 'crosshair';
                break;
            default:
                this.canvas.style.cursor = 'crosshair';
                break;
        }
        
        if (this.isPanning) {
            this.canvas.style.cursor = 'move';
        }
    }
    
    updateHoveredComponent() {
        const worldPos = this.renderer.screenToWorld(this.mousePos);
        const component = this.findComponentAt(worldPos);
        
        if (this.hoveredComponent && this.hoveredComponent !== component) {
            this.hoveredComponent.highlighted = false;
        }
        
        this.hoveredComponent = component;
        
        if (this.hoveredComponent) {
            this.hoveredComponent.highlighted = true;
        }
    }
    
    updateCoordinatesDisplay() {
        const worldPos = this.renderer.screenToWorld(this.mousePos);
        const snappedPos = Utils.snapToGrid(worldPos, this.renderer.gridSize);
        
        const coordsElement = document.getElementById('coordinates');
        if (coordsElement) {
            coordsElement.textContent = `(${Math.round(snappedPos.x)}, ${Math.round(snappedPos.y)})`;
        }
    }
    
    showContextMenu(e) {
        // Context menu implementation (to be added)
    }
    
    // Utility methods
    isKeyPressed(key) {
        // Simple key state tracking (can be enhanced)
        return false;
    }
    
    copySelected() {
        // Copy implementation (to be added)
    }
    
    pasteComponents() {
        // Paste implementation (to be added)
    }
    
    undo() {
        // Undo implementation (to be added)
    }
    
    redo() {
        // Redo implementation (to be added)
    }
    
    // Getters for current state
    getMouseWorldPosition() {
        return this.renderer.screenToWorld(this.mousePos);
    }
    
    getWirePreview() {
        if (this.isDrawingWire && this.wireStartPoint) {
            const worldPos = this.renderer.screenToWorld(this.mousePos);
            const snappedPos = Utils.snapToGrid(worldPos, this.renderer.gridSize);
            return {
                start: this.wireStartPoint,
                end: snappedPos
            };
        }
        return null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputHandler;
}