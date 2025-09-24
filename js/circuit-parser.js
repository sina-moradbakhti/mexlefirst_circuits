// Circuit parser for standard electrical engineering format

class CircuitParser {
    constructor() {
        this.components = [];
        this.wires = [];
    }
    
    // Parse circuit data from text format
    parseCircuitData(circuitText) {
        const lines = circuitText.split('\n').filter(line => line.trim() !== '');
        const parsedComponents = [];
        const parsedWires = [];
        
        lines.forEach((line, index) => {
            try {
                const parsed = this.parseLine(line.trim());
                if (parsed) {
                    if (parsed.type === 'wire') {
                        parsedWires.push(parsed);
                    } else {
                        parsedComponents.push(parsed);
                    }
                }
            } catch (error) {
                console.warn(`Error parsing line ${index + 1}: ${line}`, error);
            }
        });
        
        return {
            components: parsedComponents,
            wires: parsedWires
        };
    }
    
    // Parse a single line of circuit data
    parseLine(line) {
        // Remove extra whitespace and split by spaces
        const parts = line.split(/\s+/);
        
        if (parts.length < 2) {
            throw new Error('Invalid line format');
        }
        
        const componentType = parts[0].toLowerCase();
        
        // Parse based on component type
        switch (componentType) {
            case 'r': // Resistor: r x1 y1 x2 y2 flags resistance
                return this.parseResistor(parts);
            case 'c': // Capacitor: c x1 y1 x2 y2 flags capacitance
                return this.parseCapacitor(parts);
            case 'l': // Inductor: l x1 y1 x2 y2 flags inductance
                return this.parseInductor(parts);
            case 'v': // Voltage source: v x1 y1 x2 y2 flags voltage
                return this.parseVoltageSource(parts);
            case 'g': // Ground: g x y flags
                return this.parseGround(parts);
            case 'w': // Wire: w x1 y1 x2 y2
                return this.parseWire(parts);
            default:
                console.warn(`Unknown component type: ${componentType}`);
                return null;
        }
    }
    
    parseResistor(parts) {
        // Format: r x1 y1 x2 y2 flags resistance
        if (parts.length < 7) {
            throw new Error('Invalid resistor format');
        }
        
        const x1 = parseFloat(parts[1]);
        const y1 = parseFloat(parts[2]);
        const x2 = parseFloat(parts[3]);
        const y2 = parseFloat(parts[4]);
        const flags = parseInt(parts[5]);
        const resistance = parseFloat(parts[6]);
        
        const position = new Vector2((x1 + x2) / 2, (y1 + y2) / 2);
        const rotation = Math.atan2(y2 - y1, x2 - x1);
        
        const component = ComponentFactory.createComponent('resistor', position, rotation);
        component.properties.resistance = resistance;
        
        return component;
    }
    
    parseCapacitor(parts) {
        // Format: c x1 y1 x2 y2 flags capacitance
        if (parts.length < 7) {
            throw new Error('Invalid capacitor format');
        }
        
        const x1 = parseFloat(parts[1]);
        const y1 = parseFloat(parts[2]);
        const x2 = parseFloat(parts[3]);
        const y2 = parseFloat(parts[4]);
        const flags = parseInt(parts[5]);
        const capacitance = parseFloat(parts[6]);
        
        const position = new Vector2((x1 + x2) / 2, (y1 + y2) / 2);
        const rotation = Math.atan2(y2 - y1, x2 - x1);
        
        const component = ComponentFactory.createComponent('capacitor', position, rotation);
        component.properties.capacitance = capacitance * 1e-12; // Convert pF to F
        
        return component;
    }
    
    parseInductor(parts) {
        // Format: l x1 y1 x2 y2 flags inductance
        if (parts.length < 7) {
            throw new Error('Invalid inductor format');
        }
        
        const x1 = parseFloat(parts[1]);
        const y1 = parseFloat(parts[2]);
        const x2 = parseFloat(parts[3]);
        const y2 = parseFloat(parts[4]);
        const flags = parseInt(parts[5]);
        const inductance = parseFloat(parts[6]);
        
        const position = new Vector2((x1 + x2) / 2, (y1 + y2) / 2);
        const rotation = Math.atan2(y2 - y1, x2 - x1);
        
        const component = ComponentFactory.createComponent('inductor', position, rotation);
        component.properties.inductance = inductance * 1e-6; // Convert μH to H
        
        return component;
    }
    
    parseVoltageSource(parts) {
        // Format: v x1 y1 x2 y2 flags voltage
        if (parts.length < 7) {
            throw new Error('Invalid voltage source format');
        }
        
        const x1 = parseFloat(parts[1]);
        const y1 = parseFloat(parts[2]);
        const x2 = parseFloat(parts[3]);
        const y2 = parseFloat(parts[4]);
        const flags = parseInt(parts[5]);
        const voltage = parseFloat(parts[6]);
        
        const position = new Vector2((x1 + x2) / 2, (y1 + y2) / 2);
        const rotation = Math.atan2(y2 - y1, x2 - x1);
        
        const component = ComponentFactory.createComponent('voltage', position, rotation);
        component.properties.voltage = voltage;
        
        return component;
    }
    
    parseGround(parts) {
        // Format: g x y flags
        if (parts.length < 4) {
            throw new Error('Invalid ground format');
        }
        
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        const flags = parseInt(parts[3]);
        
        const position = new Vector2(x, y);
        
        return ComponentFactory.createComponent('ground', position, 0);
    }
    
    parseWire(parts) {
        // Format: w x1 y1 x2 y2
        if (parts.length < 5) {
            throw new Error('Invalid wire format');
        }
        
        const x1 = parseFloat(parts[1]);
        const y1 = parseFloat(parts[2]);
        const x2 = parseFloat(parts[3]);
        const y2 = parseFloat(parts[4]);
        
        const startPoint = new Vector2(x1, y1);
        const endPoint = new Vector2(x2, y2);
        
        return ComponentFactory.createWire(startPoint, endPoint);
    }
    
    // Generate circuit data in standard format
    generateCircuitData(components, wires) {
        const lines = [];
        
        // Generate component lines
        components.forEach(component => {
            const line = this.componentToLine(component);
            if (line) {
                lines.push(line);
            }
        });
        
        // Generate wire lines
        wires.forEach(wire => {
            const line = this.wireToLine(wire);
            if (line) {
                lines.push(line);
            }
        });
        
        return lines.join('\n');
    }
    
    componentToLine(component) {
        const pos = component.position;
        const rotation = component.rotation;
        const length = this.getComponentLength(component.type);
        
        // Calculate end points based on rotation
        const dx = Math.cos(rotation) * length / 2;
        const dy = Math.sin(rotation) * length / 2;
        
        const x1 = Math.round(pos.x - dx);
        const y1 = Math.round(pos.y - dy);
        const x2 = Math.round(pos.x + dx);
        const y2 = Math.round(pos.y + dy);
        
        switch (component.type) {
            case 'resistor':
                return `r ${x1} ${y1} ${x2} ${y2} 0 ${component.properties.resistance}`;
            case 'capacitor':
                const capacitanceInPF = component.properties.capacitance * 1e12;
                return `c ${x1} ${y1} ${x2} ${y2} 0 ${capacitanceInPF}`;
            case 'inductor':
                const inductanceInUH = component.properties.inductance * 1e6;
                return `l ${x1} ${y1} ${x2} ${y2} 0 ${inductanceInUH}`;
            case 'voltage':
                return `v ${x1} ${y1} ${x2} ${y2} 0 ${component.properties.voltage}`;
            case 'ground':
                return `g ${Math.round(pos.x)} ${Math.round(pos.y)} 0`;
            default:
                return null;
        }
    }
    
    wireToLine(wire) {
        const x1 = Math.round(wire.startPoint.x);
        const y1 = Math.round(wire.startPoint.y);
        const x2 = Math.round(wire.endPoint.x);
        const y2 = Math.round(wire.endPoint.y);
        
        return `w ${x1} ${y1} ${x2} ${y2}`;
    }
    
    getComponentLength(type) {
        switch (type) {
            case 'resistor':
            case 'inductor':
                return 80;
            case 'capacitor':
                return 60;
            case 'voltage':
                return 50;
            default:
                return 40;
        }
    }
    
    // Example circuit data for testing
    getExampleCircuit() {
        return `r 100 100 200 100 0 1000
c 250 100 350 100 0 100
l 400 100 500 100 0 10
v 100 200 100 300 0 5
g 100 350 0
w 200 100 250 100
w 350 100 400 100
w 100 300 100 350`;
    }
    
    // Validate circuit data format
    validateCircuitData(circuitText) {
        const lines = circuitText.split('\n').filter(line => line.trim() !== '');
        const errors = [];
        
        lines.forEach((line, index) => {
            try {
                this.parseLine(line.trim());
            } catch (error) {
                errors.push(`Line ${index + 1}: ${error.message}`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitParser;
}