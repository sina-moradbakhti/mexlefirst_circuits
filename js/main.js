// Main application controller

class CircuitSimulator {
    constructor() {
        this.canvas = document.getElementById('circuitCanvas');
        this.renderer = new Renderer(this.canvas);
        this.inputHandler = new InputHandler(this.canvas, this.renderer);
        this.circuitParser = new CircuitParser();
        this.analyzer = new CircuitAnalyzer();
        
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
        document.getElementById('simulateBtn').addEventListener('click', () => this.simulateCircuit());
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
        // Create a SUPER SIMPLE working circuit with EXACT connection points
        this.components = [];
        this.wires = [];
        
        // Create voltage source (5V battery) - horizontal orientation
        const battery = ComponentFactory.createComponent('voltage', new Vector2(200, 200), 0);
        battery.properties.voltage = 5;
        this.components.push(battery);
        
        // Create resistor (1kΩ) - horizontal orientation  
        const resistor = ComponentFactory.createComponent('resistor', new Vector2(400, 200), 0);
        resistor.properties.resistance = 1000;
        this.components.push(resistor);
        
        // Create ground - positioned at the right end
        const ground = ComponentFactory.createComponent('ground', new Vector2(480, 200), 0);
        this.components.push(ground);
        
        // Get the EXACT connection points from each component
        const batteryPoints = battery.getConnectionPoints();
        const resistorPoints = resistor.getConnectionPoints();
        const groundPoints = ground.getConnectionPoints();
        
        console.log('Battery connection points:', batteryPoints);
        console.log('Resistor connection points:', resistorPoints);
        console.log('Ground connection points:', groundPoints);
        
        // Create wires using the EXACT connection points
        // Wire from battery right to resistor left
        const wire1 = ComponentFactory.createWire(batteryPoints[1], resistorPoints[0]);
        this.wires.push(wire1);
        
        // Wire from resistor right to ground
        const wire2 = ComponentFactory.createWire(resistorPoints[1], groundPoints[0]);
        this.wires.push(wire2);
        
        // Wire from battery left to complete the circuit (going down and around)
        const wire3 = ComponentFactory.createWire(batteryPoints[0], new Vector2(batteryPoints[0].x, 300));
        this.wires.push(wire3);
        
        const wire4 = ComponentFactory.createWire(new Vector2(batteryPoints[0].x, 300), new Vector2(groundPoints[0].x, 300));
        this.wires.push(wire4);
        
        const wire5 = ComponentFactory.createWire(new Vector2(groundPoints[0].x, 300), groundPoints[0]);
        this.wires.push(wire5);
        
        // Update references
        this.inputHandler.components = this.components;
        this.inputHandler.wires = this.wires;
        
        // Fit to view and save state
        this.renderer.fitToView(this.components, this.wires);
        this.saveState();
        
        this.updateStatus('Loaded circuit with exact connection points');
        
        // Update the text area to show what we created
        const circuitData = this.circuitParser.generateCircuitData(this.components, this.wires);
        this.circuitInput.value = circuitData;
    }
    
    // Test different circuit configurations
    loadTestCircuit(circuitType) {
        this.components = [];
        this.wires = [];
        
        switch (circuitType) {
            case 'voltage_divider':
                this.createVoltageDividerCircuit();
                break;
            case 'parallel_resistors':
                this.createParallelResistorCircuit();
                break;
            case 'rc_circuit':
                this.createRCCircuit();
                break;
            case 'series_resistors':
                this.createSeriesResistorCircuit();
                break;
            default:
                this.loadExampleCircuit();
                return;
        }
        
        // Update references
        this.inputHandler.components = this.components;
        this.inputHandler.wires = this.wires;
        
        // Fit to view and save state
        this.renderer.fitToView(this.components, this.wires);
        this.saveState();
        
        this.updateStatus(`Loaded ${circuitType} test circuit`);
        
        // Update the text area
        const circuitData = this.circuitParser.generateCircuitData(this.components, this.wires);
        this.circuitInput.value = circuitData;
    }
    
    createVoltageDividerCircuit() {
        // 9V battery with two resistors in series (voltage divider)
        const battery = ComponentFactory.createComponent('voltage', new Vector2(150, 200), Math.PI/2);
        battery.properties.voltage = 9;
        this.components.push(battery);
        
        const r1 = ComponentFactory.createComponent('resistor', new Vector2(300, 150), 0);
        r1.properties.resistance = 2000; // 2kΩ
        this.components.push(r1);
        
        const r2 = ComponentFactory.createComponent('resistor', new Vector2(300, 250), 0);
        r2.properties.resistance = 1000; // 1kΩ
        this.components.push(r2);
        
        const ground = ComponentFactory.createComponent('ground', new Vector2(150, 300), 0);
        this.components.push(ground);
        
        // Get exact connection points
        const batteryPoints = battery.getConnectionPoints();
        const r1Points = r1.getConnectionPoints();
        const r2Points = r2.getConnectionPoints();
        const groundPoints = ground.getConnectionPoints();
        
        // Wire connections
        this.wires.push(ComponentFactory.createWire(batteryPoints[0], r1Points[0])); // Battery + to R1
        this.wires.push(ComponentFactory.createWire(r1Points[1], r2Points[0])); // R1 to R2 (middle node)
        this.wires.push(ComponentFactory.createWire(r2Points[1], batteryPoints[1])); // R2 to Battery -
        this.wires.push(ComponentFactory.createWire(batteryPoints[1], groundPoints[0])); // Battery - to Ground
    }
    
    createParallelResistorCircuit() {
        // 5V battery with two resistors in parallel
        const battery = ComponentFactory.createComponent('voltage', new Vector2(150, 200), 0);
        battery.properties.voltage = 5;
        this.components.push(battery);
        
        const r1 = ComponentFactory.createComponent('resistor', new Vector2(350, 150), 0);
        r1.properties.resistance = 1000; // 1kΩ
        this.components.push(r1);
        
        const r2 = ComponentFactory.createComponent('resistor', new Vector2(350, 250), 0);
        r2.properties.resistance = 2000; // 2kΩ
        this.components.push(r2);
        
        const ground = ComponentFactory.createComponent('ground', new Vector2(500, 200), 0);
        this.components.push(ground);
        
        // Get exact connection points
        const batteryPoints = battery.getConnectionPoints();
        const r1Points = r1.getConnectionPoints();
        const r2Points = r2.getConnectionPoints();
        const groundPoints = ground.getConnectionPoints();
        
        // Wire connections for parallel circuit
        this.wires.push(ComponentFactory.createWire(batteryPoints[1], r1Points[0])); // Battery + to R1 left
        this.wires.push(ComponentFactory.createWire(batteryPoints[1], r2Points[0])); // Battery + to R2 left
        this.wires.push(ComponentFactory.createWire(r1Points[1], groundPoints[0])); // R1 right to ground
        this.wires.push(ComponentFactory.createWire(r2Points[1], groundPoints[0])); // R2 right to ground
        this.wires.push(ComponentFactory.createWire(batteryPoints[0], groundPoints[0])); // Battery - to ground
    }
    
    createRCCircuit() {
        // RC circuit with battery, resistor, and capacitor
        const battery = ComponentFactory.createComponent('voltage', new Vector2(150, 200), 0);
        battery.properties.voltage = 12;
        this.components.push(battery);
        
        const resistor = ComponentFactory.createComponent('resistor', new Vector2(300, 150), 0);
        resistor.properties.resistance = 10000; // 10kΩ
        this.components.push(resistor);
        
        const capacitor = ComponentFactory.createComponent('capacitor', new Vector2(300, 250), 0);
        capacitor.properties.capacitance = 100e-6; // 100μF
        this.components.push(capacitor);
        
        const ground = ComponentFactory.createComponent('ground', new Vector2(450, 200), 0);
        this.components.push(ground);
        
        // Get exact connection points
        const batteryPoints = battery.getConnectionPoints();
        const resistorPoints = resistor.getConnectionPoints();
        const capacitorPoints = capacitor.getConnectionPoints();
        const groundPoints = ground.getConnectionPoints();
        
        // Wire connections
        this.wires.push(ComponentFactory.createWire(batteryPoints[1], resistorPoints[0])); // Battery + to R
        this.wires.push(ComponentFactory.createWire(resistorPoints[1], capacitorPoints[0])); // R to C
        this.wires.push(ComponentFactory.createWire(capacitorPoints[1], groundPoints[0])); // C to ground
        this.wires.push(ComponentFactory.createWire(batteryPoints[0], groundPoints[0])); // Battery - to ground
    }
    
    createSeriesResistorCircuit() {
        // Three resistors in series
        const battery = ComponentFactory.createComponent('voltage', new Vector2(150, 200), 0);
        battery.properties.voltage = 15;
        this.components.push(battery);
        
        const r1 = ComponentFactory.createComponent('resistor', new Vector2(300, 200), 0);
        r1.properties.resistance = 1000; // 1kΩ
        this.components.push(r1);
        
        const r2 = ComponentFactory.createComponent('resistor', new Vector2(450, 200), 0);
        r2.properties.resistance = 2000; // 2kΩ
        this.components.push(r2);
        
        const r3 = ComponentFactory.createComponent('resistor', new Vector2(600, 200), 0);
        r3.properties.resistance = 3000; // 3kΩ
        this.components.push(r3);
        
        const ground = ComponentFactory.createComponent('ground', new Vector2(150, 300), 0);
        this.components.push(ground);
        
        // Get exact connection points
        const batteryPoints = battery.getConnectionPoints();
        const r1Points = r1.getConnectionPoints();
        const r2Points = r2.getConnectionPoints();
        const r3Points = r3.getConnectionPoints();
        const groundPoints = ground.getConnectionPoints();
        
        // Wire connections
        this.wires.push(ComponentFactory.createWire(batteryPoints[1], r1Points[0])); // Battery + to R1
        this.wires.push(ComponentFactory.createWire(r1Points[1], r2Points[0])); // R1 to R2
        this.wires.push(ComponentFactory.createWire(r2Points[1], r3Points[0])); // R2 to R3
        this.wires.push(ComponentFactory.createWire(r3Points[1], new Vector2(600, 300))); // R3 down
        this.wires.push(ComponentFactory.createWire(new Vector2(600, 300), new Vector2(150, 300))); // Bottom rail
        this.wires.push(ComponentFactory.createWire(new Vector2(150, 300), groundPoints[0])); // To ground
        this.wires.push(ComponentFactory.createWire(batteryPoints[0], groundPoints[0])); // Battery - to ground
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
    
    // Circuit simulation
    simulateCircuit() {
        if (this.components.length === 0) {
            alert('Please add some components to simulate');
            return;
        }
        
        this.updateStatus('Running circuit simulation...');
        
        // Debug: Show circuit information
        console.log('=== CIRCUIT DEBUG INFO ===');
        console.log('Components:', this.components.length);
        console.log('Wires:', this.wires.length);
        
        this.components.forEach((comp, i) => {
            const points = comp.getConnectionPoints();
            console.log(`Component ${i} (${comp.type}):`, {
                position: comp.position,
                connectionPoints: points,
                properties: comp.properties
            });
        });
        
        this.wires.forEach((wire, i) => {
            console.log(`Wire ${i}:`, {
                start: wire.startPoint,
                end: wire.endPoint
            });
        });
        
        try {
            const result = this.analyzer.simulate(this.components, this.wires);
            
            if (result.success) {
                this.showSimulationResults(result);
                this.updateStatus('Circuit simulation completed successfully');
            } else {
                console.error('Simulation failed:', result);
                alert('Simulation failed: ' + result.message);
                this.updateStatus('Simulation failed');
            }
        } catch (error) {
            console.error('Simulation error:', error);
            alert('Simulation error: ' + error.message);
            this.updateStatus('Simulation error');
        }
    }
    
    showSimulationResults(result) {
        const report = this.analyzer.getAnalysisReport();
        const validation = this.analyzer.validateCircuit();
        
        // Create a popup window with results
        const popup = window.open('', 'SimulationResults', 'width=600,height=800,scrollbars=yes');
        popup.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Circuit Simulation Results</title>
                <style>
                    body { font-family: 'Courier New', monospace; margin: 20px; background: #f5f5f5; }
                    .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; }
                    .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
                    .valid { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                    .invalid { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
                    pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
                    .close-btn { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px; }
                    .close-btn:hover { background: #2980b9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Circuit Simulation Results</h1>
                        <p>Analysis completed at ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <div class="status ${validation.isValid ? 'valid' : 'invalid'}">
                        <strong>Circuit Status: ${validation.isValid ? 'VALID ✓' : 'ISSUES FOUND ⚠'}</strong>
                        ${validation.issues.length > 0 ? '<ul>' + validation.issues.map(issue => '<li>' + issue + '</li>').join('') + '</ul>' : ''}
                    </div>
                    
                    <h2>Detailed Analysis</h2>
                    <pre>${report}</pre>
                    
                    <button class="close-btn" onclick="window.close()">Close</button>
                </div>
            </body>
            </html>
        `);
        popup.document.close();
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