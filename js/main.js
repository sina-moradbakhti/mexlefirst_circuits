// Main application controller

class CircuitSimulator {
    constructor() {
        this.canvas = document.getElementById('circuitCanvas');
        this.renderer = new Renderer(this.canvas);
        this.inputHandler = new InputHandler(this.canvas, this.renderer);
        this.circuitParser = new CircuitParser();
        
        // Circuit data
        this.components = [];
        this.wires = [];
        
        // UI elements
        this.propertiesPanel = document.getElementById('propertiesPanel');
        this.propertiesContent = document.getElementById('propertiesContent');
        this.statusText = document.getElementById('statusText');
        this.circuitInput = document.getElementById('circuitInput');
        
        // State
        this.selectedComponent = null;
        this.history = [];
        this.historyIndex = -1;
        
        this.setupEventHandlers();
        this.setupInputHandlerCallbacks();
        this.initializeUI();
        
        // Start render loop
        this.startRenderLoop();
        
        // Load example circuit
        this.loadExampleCircuit();
    }
    
    setupEventHandlers() {
        // Component buttons
        document.querySelectorAll('.component-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const componentType = e.target.dataset.component;
                this.setSelectedTool(componentType);
            });
        });
        
        // Control buttons
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCircuit());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCircuit());
        document.getElementById('importBtn').addEventListener('click', () => this.importCircuit());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileImport(e));
        
        // View controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetViewBtn').addEventListener('click', () => this.resetView());
        
        // Circuit parser
        document.getElementById('parseBtn').addEventListener('click', () => this.parseCircuitInput());
        
        // Example circuit data
        this.circuitInput.placeholder = this.circuitParser.getExampleCircuit();
    }
    
    setupInputHandlerCallbacks() {
        // Set references for component finding
        this.inputHandler.components = this.components;
        this.inputHandler.wires = this.wires;
        
        // Set up callbacks
        this.inputHandler.onComponentSelect = (component) => this.selectComponent(component);
        this.inputHandler.onComponentPlace = (type, position) => this.placeComponent(type, position);
        this.inputHandler.onComponentMove = (components) => this.updateStatus('Moving components...');
        this.inputHandler.onWireCreate = (start, end) => this.createWire(start, end);
        this.inputHandler.onToolChange = (tool) => this.updateToolUI(tool);
        this.inputHandler.onComponentDelete = (components) => this.deleteComponents(components);
    }
    
    initializeUI() {
        this.updateStatus('Circuit simulator ready');
        this.setSelectedTool('select');
        // Save initial empty state
        this.saveState();
    }
    
    startRenderLoop() {
        const render = () => {
            // Get wire preview if drawing
            const wirePreview = this.inputHandler.getWirePreview();
            
            // Render everything
            this.renderer.render(
                this.components, 
                this.wires, 
                this.inputHandler.getSelectedTool(),
                this.inputHandler.mousePos
            );
            
            // Render wire preview
            if (wirePreview) {
                this.renderer.renderWirePreview(wirePreview.start, wirePreview.end);
            }
            
            requestAnimationFrame(render);
        };
        
        requestAnimationFrame(render);
    }
    
    // Component management
    placeComponent(type, position) {
        const component = ComponentFactory.createComponent(type, position);
        this.components.push(component);
        this.saveState();
        this.updateStatus(`Placed ${type} at (${Math.round(position.x)}, ${Math.round(position.y)})`);
    }
    
    createWire(startPoint, endPoint) {
        const wire = ComponentFactory.createWire(startPoint, endPoint);
        this.wires.push(wire);
        this.saveState();
        this.updateStatus(`Created wire from (${Math.round(startPoint.x)}, ${Math.round(startPoint.y)}) to (${Math.round(endPoint.x)}, ${Math.round(endPoint.y)})`);
    }
    
    deleteComponents(components) {
        components.forEach(component => {
            if (component.type === 'wire') {
                const index = this.wires.indexOf(component);
                if (index > -1) {
                    this.wires.splice(index, 1);
                }
            } else {
                const index = this.components.indexOf(component);
                if (index > -1) {
                    this.components.splice(index, 1);
                }
            }
        });
        
        this.saveState();
        this.updateStatus(`Deleted ${components.length} component(s)`);
        this.clearPropertiesPanel();
    }
    
    selectComponent(component) {
        this.selectedComponent = component;
        this.updatePropertiesPanel(component);
    }
    
    // Tool management
    setSelectedTool(tool) {
        this.inputHandler.setSelectedTool(tool);
        this.updateToolUI(tool);
    }
    
    updateToolUI(tool) {
        // Update button states
        document.querySelectorAll('.component-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.component === tool) {
                btn.classList.add('active');
            }
        });
        
        // Update cursor and status
        switch (tool) {
            case 'select':
                this.updateStatus('Select tool active - Click to select components');
                break;
            case 'wire':
                this.updateStatus('Wire tool active - Click to start/end wire');
                break;
            default:
                this.updateStatus(`${tool.charAt(0).toUpperCase() + tool.slice(1)} tool active - Click to place component`);
                break;
        }
    }
    
    // Properties panel
    updatePropertiesPanel(component) {
        if (!component) {
            this.clearPropertiesPanel();
            return;
        }
        
        let html = `<h4>${component.type.charAt(0).toUpperCase() + component.type.slice(1)}</h4>`;
        
        // Add property inputs based on component type
        Object.keys(component.properties).forEach(key => {
            const value = component.properties[key];
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            
            html += `
                <div class="property-group">
                    <label for="prop_${key}">${label}:</label>
                    <input type="text" id="prop_${key}" value="${value}" 
                           onchange="circuitSimulator.updateComponentProperty('${component.id}', '${key}', this.value)">
                </div>
            `;
        });
        
        // Add position and rotation
        html += `
            <div class="property-group">
                <label for="prop_x">X Position:</label>
                <input type="number" id="prop_x" value="${Math.round(component.position.x)}" 
                       onchange="circuitSimulator.updateComponentPosition('${component.id}', 'x', this.value)">
            </div>
            <div class="property-group">
                <label for="prop_y">Y Position:</label>
                <input type="number" id="prop_y" value="${Math.round(component.position.y)}" 
                       onchange="circuitSimulator.updateComponentPosition('${component.id}', 'y', this.value)">
            </div>
        `;
        
        if (component.type !== 'wire' && component.type !== 'ground') {
            html += `
                <div class="property-group">
                    <label for="prop_rotation">Rotation (degrees):</label>
                    <input type="number" id="prop_rotation" value="${Math.round(component.rotation * 180 / Math.PI)}" 
                           onchange="circuitSimulator.updateComponentRotation('${component.id}', this.value)">
                </div>
            `;
        }
        
        this.propertiesContent.innerHTML = html;
    }
    
    clearPropertiesPanel() {
        this.propertiesContent.innerHTML = '<p>Select a component to edit its properties</p>';
        this.selectedComponent = null;
    }
    
    updateComponentProperty(componentId, property, value) {
        const component = this.findComponentById(componentId);
        if (component) {
            // Parse value based on property type
            if (typeof component.properties[property] === 'number') {
                component.properties[property] = Utils.parseValue(value);
            } else {
                component.properties[property] = value;
            }
            this.saveState();
        }
    }
    
    updateComponentPosition(componentId, axis, value) {
        const component = this.findComponentById(componentId);
        if (component) {
            component.position[axis] = parseFloat(value);
            this.saveState();
        }
    }
    
    updateComponentRotation(componentId, degrees) {
        const component = this.findComponentById(componentId);
        if (component) {
            component.rotation = parseFloat(degrees) * Math.PI / 180;
            this.saveState();
        }
    }
    
    findComponentById(id) {
        let found = this.components.find(c => c.id === id);
        if (!found) {
            found = this.wires.find(w => w.id === id);
        }
        return found;
    }
    
    // Circuit operations
    clearCircuit() {
        if (confirm('Are you sure you want to clear the entire circuit?')) {
            this.components = [];
            this.wires = [];
            this.inputHandler.components = this.components;
            this.inputHandler.wires = this.wires;
            this.clearPropertiesPanel();
            this.saveState();
            this.updateStatus('Circuit cleared');
        }
    }
    
    exportCircuit() {
        const circuitData = {
            components: this.components.map(c => c.toJSON()),
            wires: this.wires.map(w => w.toJSON()),
            metadata: {
                created: new Date().toISOString(),
                version: '1.0'
            }
        };
        
        const dataStr = JSON.stringify(circuitData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'circuit.json';
        link.click();
        
        this.updateStatus('Circuit exported');
    }
    
    importCircuit() {
        document.getElementById('fileInput').click();
    }
    
    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const circuitData = JSON.parse(event.target.result);
                this.loadCircuitData(circuitData);
                this.updateStatus('Circuit imported successfully');
            } catch (error) {
                alert('Error importing circuit: ' + error.message);
                this.updateStatus('Import failed');
            }
        };
        reader.readAsText(file);
    }
    
    loadCircuitData(circuitData) {
        this.components = circuitData.components.map(data => Component.fromJSON(data));
        this.wires = circuitData.wires.map(data => Wire.fromJSON(data));
        
        this.inputHandler.components = this.components;
        this.inputHandler.wires = this.wires;
        
        this.clearPropertiesPanel();
        this.renderer.fitToView(this.components, this.wires);
        this.saveState();
    }
    
    parseCircuitInput() {
        const circuitText = this.circuitInput.value.trim();
        if (!circuitText) {
            alert('Please enter circuit data');
            return;
        }
        
        try {
            const validation = this.circuitParser.validateCircuitData(circuitText);
            if (!validation.isValid) {
                alert('Invalid circuit data:\n' + validation.errors.join('\n'));
                return;
            }
            
            const parsed = this.circuitParser.parseCircuitData(circuitText);
            
            // Clear existing circuit
            this.components = parsed.components;
            this.wires = parsed.wires;
            
            this.inputHandler.components = this.components;
            this.inputHandler.wires = this.wires;
            
            this.clearPropertiesPanel();
            this.renderer.fitToView(this.components, this.wires);
            this.saveState();
            
            this.updateStatus(`Parsed ${parsed.components.length} components and ${parsed.wires.length} wires`);
        } catch (error) {
            alert('Error parsing circuit data: ' + error.message);
            this.updateStatus('Parse failed');
        }
    }
    
    loadExampleCircuit() {
        const exampleData = this.circuitParser.getExampleCircuit();
        this.circuitInput.value = exampleData;
        this.parseCircuitInput();
    }
    
    // View controls
    zoomIn() {
        this.renderer.zoom(1.2);
    }
    
    zoomOut() {
        this.renderer.zoom(0.8);
    }
    
    resetView() {
        this.renderer.fitToView(this.components, this.wires);
    }
    
    // State management
    saveState() {
        const state = {
            components: this.components.map(c => c.toJSON()),
            wires: this.wires.map(w => w.toJSON())
        };
        
        // Simple history management
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(Utils.deepClone(state));
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadState(this.history[this.historyIndex]);
            this.updateStatus('Undo');
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadState(this.history[this.historyIndex]);
            this.updateStatus('Redo');
        }
    }
    
    loadState(state) {
        this.components = state.components.map(data => Component.fromJSON(data));
        this.wires = state.wires.map(data => Wire.fromJSON(data));
        
        this.inputHandler.components = this.components;
        this.inputHandler.wires = this.wires;
        
        this.clearPropertiesPanel();
    }
    
    // UI updates
    updateStatus(message) {
        if (this.statusText) {
            this.statusText.textContent = message;
        }
    }
    
    // Export circuit as standard format
    exportAsStandardFormat() {
        const standardFormat = this.circuitParser.generateCircuitData(this.components, this.wires);
        
        const dataBlob = new Blob([standardFormat], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'circuit.txt';
        link.click();
        
        this.updateStatus('Circuit exported as standard format');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.circuitSimulator = new CircuitSimulator();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitSimulator;
}