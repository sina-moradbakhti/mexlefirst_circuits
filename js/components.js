// Circuit component definitions and rendering

class Component {
    constructor(type, position, rotation = 0) {
        this.id = Utils.generateId();
        this.type = type;
        this.position = position.clone();
        this.rotation = rotation;
        this.selected = false;
        this.highlighted = false;
        this.connections = [];
        this.properties = {};
        
        // Initialize default properties based on type
        this.initializeProperties();
    }
    
    initializeProperties() {
        switch (this.type) {
            case 'resistor':
                this.properties = {
                    resistance: 1000, // Ohms
                    tolerance: 5, // Percent
                    power: 0.25 // Watts
                };
                break;
            case 'capacitor':
                this.properties = {
                    capacitance: 1e-6, // Farads
                    voltage: 25, // Volts
                    type: 'ceramic'
                };
                break;
            case 'inductor':
                this.properties = {
                    inductance: 1e-3, // Henries
                    current: 1, // Amperes
                    type: 'air'
                };
                break;
            case 'voltage':
                this.properties = {
                    voltage: 5, // Volts
                    frequency: 0, // Hz (0 = DC)
                    phase: 0 // Degrees
                };
                break;
            case 'ground':
                this.properties = {};
                break;
            case 'wire':
                this.properties = {
                    resistance: 0 // Ohms
                };
                break;
        }
    }
    
    // Get connection points for this component
    getConnectionPoints() {
        const points = [];
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        
        switch (this.type) {
            case 'resistor':
            case 'capacitor':
            case 'inductor':
                // Two-terminal components
                points.push(
                    new Vector2(
                        this.position.x - 30 * cos,
                        this.position.y - 30 * sin
                    ),
                    new Vector2(
                        this.position.x + 30 * cos,
                        this.position.y + 30 * sin
                    )
                );
                break;
            case 'voltage':
                // Two-terminal voltage source
                points.push(
                    new Vector2(
                        this.position.x - 25 * cos,
                        this.position.y - 25 * sin
                    ),
                    new Vector2(
                        this.position.x + 25 * cos,
                        this.position.y + 25 * sin
                    )
                );
                break;
            case 'ground':
                // Single connection point
                points.push(this.position.clone());
                break;
        }
        
        return points;
    }
    
    // Check if point is inside component bounds
    containsPoint(point) {
        const bounds = this.getBounds();
        return Utils.pointInRect(point, bounds);
    }
    
    // Get bounding rectangle
    getBounds() {
        const size = this.getSize();
        return {
            x: this.position.x - size.width / 2,
            y: this.position.y - size.height / 2,
            width: size.width,
            height: size.height
        };
    }
    
    // Get component size
    getSize() {
        switch (this.type) {
            case 'resistor':
                return { width: 80, height: 20 };
            case 'capacitor':
                return { width: 60, height: 40 };
            case 'inductor':
                return { width: 80, height: 30 };
            case 'voltage':
                return { width: 50, height: 50 };
            case 'ground':
                return { width: 30, height: 30 };
            default:
                return { width: 40, height: 20 };
        }
    }
    
    // Render the component
    render(ctx, camera) {
        ctx.save();
        
        // Transform to component coordinate system
        const screenPos = Utils.worldToScreen(this.position, camera);
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(this.rotation);
        ctx.scale(camera.zoom, camera.zoom);
        
        // Set styles
        ctx.strokeStyle = this.selected ? '#f39c12' : (this.highlighted ? '#e74c3c' : '#2c3e50');
        ctx.lineWidth = this.selected || this.highlighted ? 2 : 1;
        ctx.fillStyle = '#ffffff';
        
        // Render based on type
        switch (this.type) {
            case 'resistor':
                this.renderResistor(ctx);
                break;
            case 'capacitor':
                this.renderCapacitor(ctx);
                break;
            case 'inductor':
                this.renderInductor(ctx);
                break;
            case 'voltage':
                this.renderVoltageSource(ctx);
                break;
            case 'ground':
                this.renderGround(ctx);
                break;
        }
        
        // Render connection points if selected
        if (this.selected) {
            this.renderConnectionPoints(ctx);
        }
        
        ctx.restore();
        
        // Render label
        this.renderLabel(ctx, camera);
    }
    
    renderResistor(ctx) {
        // Draw resistor body
        ctx.beginPath();
        ctx.rect(-30, -8, 60, 16);
        ctx.fill();
        ctx.stroke();
        
        // Draw leads
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-30, 0);
        ctx.moveTo(30, 0);
        ctx.lineTo(40, 0);
        ctx.stroke();
        
        // Draw zigzag pattern
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        for (let i = 0; i < 6; i++) {
            const x = -25 + i * 8;
            const y = (i % 2 === 0) ? -6 : 6;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(25, 0);
        ctx.stroke();
    }
    
    renderCapacitor(ctx) {
        // Draw leads
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(-10, 0);
        ctx.moveTo(10, 0);
        ctx.lineTo(30, 0);
        ctx.stroke();
        
        // Draw plates
        ctx.beginPath();
        ctx.moveTo(-10, -15);
        ctx.lineTo(-10, 15);
        ctx.moveTo(10, -15);
        ctx.lineTo(10, 15);
        ctx.stroke();
    }
    
    renderInductor(ctx) {
        // Draw leads
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-30, 0);
        ctx.moveTo(30, 0);
        ctx.lineTo(40, 0);
        ctx.stroke();
        
        // Draw coil
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const x = -30 + i * 15;
            ctx.arc(x + 7.5, 0, 7.5, Math.PI, 0, false);
        }
        ctx.stroke();
    }
    
    renderVoltageSource(ctx) {
        // Draw circle
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Draw leads
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(-20, 0);
        ctx.moveTo(20, 0);
        ctx.lineTo(25, 0);
        ctx.stroke();
        
        // Draw + and - symbols
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+', -8, 4);
        ctx.fillText('-', 8, 4);
    }
    
    renderGround(ctx) {
        // Draw ground symbol
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(0, 0);
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.moveTo(-10, 5);
        ctx.lineTo(10, 5);
        ctx.moveTo(-5, 10);
        ctx.lineTo(5, 10);
        ctx.stroke();
    }
    
    renderConnectionPoints(ctx) {
        const points = this.getConnectionPoints();
        ctx.fillStyle = '#e74c3c';
        
        points.forEach(point => {
            const screenPoint = Utils.worldToScreen(point, { zoom: 1, offset: new Vector2(0, 0) });
            ctx.beginPath();
            ctx.arc(screenPoint.x, screenPoint.y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
    
    renderLabel(ctx, camera) {
        const screenPos = Utils.worldToScreen(this.position, camera);
        const label = this.getLabel();
        
        if (label) {
            ctx.save();
            ctx.fillStyle = '#2c3e50';
            ctx.font = `${12 * camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(label, screenPos.x, screenPos.y + 25 * camera.zoom);
            ctx.restore();
        }
    }
    
    getLabel() {
        switch (this.type) {
            case 'resistor':
                return Utils.formatValue(this.properties.resistance, 'Ω');
            case 'capacitor':
                return Utils.formatValue(this.properties.capacitance, 'F');
            case 'inductor':
                return Utils.formatValue(this.properties.inductance, 'H');
            case 'voltage':
                return Utils.formatValue(this.properties.voltage, 'V');
            default:
                return '';
        }
    }
    
    // Serialize component to JSON
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            position: { x: this.position.x, y: this.position.y },
            rotation: this.rotation,
            properties: this.properties
        };
    }
    
    // Create component from JSON
    static fromJSON(data) {
        const component = new Component(data.type, new Vector2(data.position.x, data.position.y), data.rotation);
        component.id = data.id;
        component.properties = data.properties;
        return component;
    }
}

class Wire {
    constructor(startPoint, endPoint) {
        this.id = Utils.generateId();
        this.type = 'wire';
        this.startPoint = startPoint.clone();
        this.endPoint = endPoint.clone();
        this.selected = false;
        this.highlighted = false;
        this.properties = {
            resistance: 0
        };
    }
    
    // Check if point is near the wire
    containsPoint(point, threshold = 5) {
        return Utils.pointNearLine(point, this.startPoint, this.endPoint, threshold);
    }
    
    // Get bounding rectangle
    getBounds() {
        const minX = Math.min(this.startPoint.x, this.endPoint.x);
        const minY = Math.min(this.startPoint.y, this.endPoint.y);
        const maxX = Math.max(this.startPoint.x, this.endPoint.x);
        const maxY = Math.max(this.startPoint.y, this.endPoint.y);
        
        return {
            x: minX - 5,
            y: minY - 5,
            width: maxX - minX + 10,
            height: maxY - minY + 10
        };
    }
    
    // Render the wire
    render(ctx, camera) {
        ctx.save();
        
        const startScreen = Utils.worldToScreen(this.startPoint, camera);
        const endScreen = Utils.worldToScreen(this.endPoint, camera);
        
        ctx.strokeStyle = this.selected ? '#f39c12' : (this.highlighted ? '#e74c3c' : '#2c3e50');
        ctx.lineWidth = (this.selected || this.highlighted ? 3 : 2) * camera.zoom;
        
        ctx.beginPath();
        ctx.moveTo(startScreen.x, startScreen.y);
        ctx.lineTo(endScreen.x, endScreen.y);
        ctx.stroke();
        
        // Draw connection points if selected
        if (this.selected) {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(startScreen.x, startScreen.y, 4 * camera.zoom, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(endScreen.x, endScreen.y, 4 * camera.zoom, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // Serialize wire to JSON
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            startPoint: { x: this.startPoint.x, y: this.startPoint.y },
            endPoint: { x: this.endPoint.x, y: this.endPoint.y },
            properties: this.properties
        };
    }
    
    // Create wire from JSON
    static fromJSON(data) {
        const wire = new Wire(
            new Vector2(data.startPoint.x, data.startPoint.y),
            new Vector2(data.endPoint.x, data.endPoint.y)
        );
        wire.id = data.id;
        wire.properties = data.properties;
        return wire;
    }
}

// Component factory
class ComponentFactory {
    static createComponent(type, position, rotation = 0) {
        return new Component(type, position, rotation);
    }
    
    static createWire(startPoint, endPoint) {
        return new Wire(startPoint, endPoint);
    }
    
    static getAvailableTypes() {
        return ['resistor', 'capacitor', 'inductor', 'voltage', 'ground', 'wire'];
    }
}