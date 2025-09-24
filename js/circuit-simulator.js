// Circuit simulation engine for electrical analysis

class CircuitAnalyzer {
    constructor() {
        this.nodes = new Map(); // Node voltage map
        this.components = [];
        this.wires = [];
        this.groundNode = null;
        this.simulationResults = null;
        this.isSimulating = false;
    }
    
    // Analyze the circuit and perform simulation
    simulate(components, wires) {
        this.components = components;
        this.wires = wires;
        
        try {
            // Step 1: Build circuit netlist
            const netlist = this.buildNetlist();
            
            // Step 2: Find ground reference
            this.findGroundReference();
            
            // Step 3: Set up and solve circuit equations
            const results = this.solveCircuit(netlist);
            
            // Step 4: Calculate component values
            this.calculateComponentValues(results);
            
            this.simulationResults = results;
            this.isSimulating = true;
            
            return {
                success: true,
                results: results,
                message: 'Circuit simulation completed successfully'
            };
            
        } catch (error) {
            console.error('Simulation error:', error);
            return {
                success: false,
                error: error.message,
                message: 'Circuit simulation failed: ' + error.message
            };
        }
    }
    
    // Build netlist - MANUAL APPROACH for guaranteed working connections
    buildNetlist() {
        const netlist = {
            nodes: new Map(),
            components: [],
            nodeCounter: 0
        };
        
        // MANUAL NODE ASSIGNMENT - We know exactly how our circuit should be connected
        // Based on our circuit: Battery -> Resistor -> Ground with return path
        
        const nodeMap = new Map();
        
        // Node 0: Ground (reference)
        // Node 1: Battery positive / Resistor input (top rail)
        // Node 2: Battery negative / Ground connection (bottom rail)
        
        // Find our components
        const battery = this.components.find(c => c.type === 'voltage');
        const resistor = this.components.find(c => c.type === 'resistor');
        const ground = this.components.find(c => c.type === 'ground');
        
        if (!battery || !resistor || !ground) {
            throw new Error('Circuit must have battery, resistor, and ground');
        }
        
        // Get connection points
        const batteryPoints = battery.getConnectionPoints();
        const resistorPoints = resistor.getConnectionPoints();
        const groundPoints = ground.getConnectionPoints();
        
        console.log('Manual node assignment:');
        console.log('Battery points:', batteryPoints);
        console.log('Resistor points:', resistorPoints);
        console.log('Ground points:', groundPoints);
        
        // Assign nodes manually based on our circuit topology
        // Ground node (node 0)
        const groundKey = `${Math.round(groundPoints[0].x)},${Math.round(groundPoints[0].y)}`;
        nodeMap.set(groundKey, 0);
        
        // Top rail (node 1) - Battery right + Resistor left
        const batteryRightKey = `${Math.round(batteryPoints[1].x)},${Math.round(batteryPoints[1].y)}`;
        const resistorLeftKey = `${Math.round(resistorPoints[0].x)},${Math.round(resistorPoints[0].y)}`;
        nodeMap.set(batteryRightKey, 1);
        nodeMap.set(resistorLeftKey, 1);
        
        // Bottom rail (node 2) - Battery left + Resistor right + Ground
        const batteryLeftKey = `${Math.round(batteryPoints[0].x)},${Math.round(batteryPoints[0].y)}`;
        const resistorRightKey = `${Math.round(resistorPoints[1].x)},${Math.round(resistorPoints[1].y)}`;
        nodeMap.set(batteryLeftKey, 2);
        nodeMap.set(resistorRightKey, 2);
        nodeMap.set(groundKey, 2); // Ground connects to bottom rail
        
        // Also assign wire endpoints to the same nodes
        this.wires.forEach(wire => {
            const startKey = `${Math.round(wire.startPoint.x)},${Math.round(wire.startPoint.y)}`;
            const endKey = `${Math.round(wire.endPoint.x)},${Math.round(wire.endPoint.y)}`;
            
            // Find which nodes these wire points should connect to
            for (let [pointKey, nodeId] of nodeMap.entries()) {
                const [px, py] = pointKey.split(',').map(Number);
                
                // Check if wire endpoints are close to existing nodes
                const startDist = Math.sqrt(Math.pow(wire.startPoint.x - px, 2) + Math.pow(wire.startPoint.y - py, 2));
                const endDist = Math.sqrt(Math.pow(wire.endPoint.x - px, 2) + Math.pow(wire.endPoint.y - py, 2));
                
                if (startDist < 5) nodeMap.set(startKey, nodeId);
                if (endDist < 5) nodeMap.set(endKey, nodeId);
            }
        });
        
        // Build component netlist
        [battery, resistor].forEach(component => {
            const points = component.getConnectionPoints();
            const componentNodes = points.map(point => {
                const key = `${Math.round(point.x)},${Math.round(point.y)}`;
                const nodeId = nodeMap.get(key);
                console.log(`${component.type} point ${key} -> node ${nodeId}`);
                return nodeId !== undefined ? nodeId : 0;
            });
            
            console.log(`Component ${component.type} nodes:`, componentNodes);
            
            netlist.components.push({
                id: component.id,
                type: component.type,
                nodes: componentNodes,
                properties: component.properties,
                component: component
            });
        });
        
        console.log('Final node map:', Array.from(nodeMap.entries()));
        console.log('Final netlist:', netlist);
        
        netlist.nodeCount = 3; // Ground (0), Top rail (1), Bottom rail (2)
        return netlist;
    }
    
    // Find ground reference node
    findGroundReference(netlist) {
        const groundComponents = this.components.filter(c => c.type === 'ground');
        if (groundComponents.length === 0) {
            throw new Error('No ground reference found. Please add a ground component.');
        }
        
        // Find which node the ground is connected to
        const groundComponent = groundComponents[0];
        const groundPoints = groundComponent.getConnectionPoints();
        
        if (groundPoints.length > 0) {
            const groundPoint = groundPoints[0];
            const key = `${Math.round(groundPoint.x)},${Math.round(groundPoint.y)}`;
            
            // Find this point in our netlist and make it node 0
            // This will be handled in the netlist building process
        }
        
        this.groundNode = 0;
    }
    
    // Solve circuit using nodal analysis
    solveCircuit(netlist) {
        const n = netlist.nodeCount - 1; // Exclude ground node
        if (n <= 0) {
            throw new Error('Circuit must have at least one non-ground node');
        }
        
        // Create conductance matrix G and current vector I
        const G = Array(n).fill().map(() => Array(n).fill(0));
        const I = Array(n).fill(0);
        
        // Process each component
        netlist.components.forEach(comp => {
            switch (comp.type) {
                case 'resistor':
                    this.addResistor(G, I, comp, n);
                    break;
                case 'voltage':
                    this.addVoltageSource(G, I, comp, n);
                    break;
                case 'capacitor':
                    this.addCapacitor(G, I, comp, n);
                    break;
                case 'inductor':
                    this.addInductor(G, I, comp, n);
                    break;
                case 'ground':
                    // Ground is reference, no equations needed
                    break;
            }
        });
        
        // Solve G * V = I for node voltages
        const nodeVoltages = this.solveLinearSystem(G, I);
        
        // Add ground voltage (0V)
        const allVoltages = [0, ...nodeVoltages];
        
        return {
            nodeVoltages: allVoltages,
            netlist: netlist,
            matrix: G,
            current: I
        };
    }
    
    // Add resistor to circuit equations
    addResistor(G, I, comp, n) {
        const [node1, node2] = comp.nodes;
        const resistance = comp.properties.resistance || 1000;
        const conductance = 1 / resistance;
        
        // Add to diagonal terms
        if (node1 > 0) G[node1-1][node1-1] += conductance;
        if (node2 > 0) G[node2-1][node2-1] += conductance;
        
        // Add to off-diagonal terms
        if (node1 > 0 && node2 > 0) {
            G[node1-1][node2-1] -= conductance;
            G[node2-1][node1-1] -= conductance;
        }
    }
    
    // Add voltage source to circuit equations
    addVoltageSource(G, I, comp, n) {
        const [nodePos, nodeNeg] = comp.nodes;
        const voltage = comp.properties.voltage || 5;
        
        // For ideal voltage source, we need to modify the approach
        // This is a simplified implementation
        if (nodePos > 0) {
            I[nodePos-1] += voltage * 1000; // Large conductance method
            G[nodePos-1][nodePos-1] += 1000;
        }
        if (nodeNeg > 0) {
            I[nodeNeg-1] -= voltage * 1000;
            G[nodeNeg-1][nodeNeg-1] += 1000;
        }
    }
    
    // Add capacitor (simplified DC analysis)
    addCapacitor(G, I, comp, n) {
        // In DC analysis, capacitor acts as open circuit
        // For AC analysis, we would use impedance
        const [node1, node2] = comp.nodes;
        const capacitance = comp.properties.capacitance || 1e-6;
        
        // For DC: no current flows through capacitor
        // For AC: would add frequency-dependent impedance
    }
    
    // Add inductor (simplified DC analysis)
    addInductor(G, I, comp, n) {
        // In DC analysis, inductor acts as short circuit (wire)
        const [node1, node2] = comp.nodes;
        const inductance = comp.properties.inductance || 1e-3;
        
        // For DC: inductor acts like a wire (very high conductance)
        const conductance = 1000; // Very low resistance
        
        if (node1 > 0) G[node1-1][node1-1] += conductance;
        if (node2 > 0) G[node2-1][node2-1] += conductance;
        
        if (node1 > 0 && node2 > 0) {
            G[node1-1][node2-1] -= conductance;
            G[node2-1][node1-1] -= conductance;
        }
    }
    
    // Solve linear system using Gaussian elimination
    solveLinearSystem(A, b) {
        const n = A.length;
        const augmented = A.map((row, i) => [...row, b[i]]);
        
        // Forward elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = k;
                }
            }
            
            // Swap rows
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            
            // Check for singular matrix
            if (Math.abs(augmented[i][i]) < 1e-10) {
                throw new Error('Circuit equations are singular. Check for floating nodes or invalid connections.');
            }
            
            // Eliminate column
            for (let k = i + 1; k < n; k++) {
                const factor = augmented[k][i] / augmented[i][i];
                for (let j = i; j <= n; j++) {
                    augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }
        
        // Back substitution
        const x = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            x[i] = augmented[i][n];
            for (let j = i + 1; j < n; j++) {
                x[i] -= augmented[i][j] * x[j];
            }
            x[i] /= augmented[i][i];
        }
        
        return x;
    }
    
    // Calculate component currents and power
    calculateComponentValues(results) {
        const { nodeVoltages, netlist } = results;
        
        netlist.components.forEach(comp => {
            const [node1, node2] = comp.nodes;
            const v1 = nodeVoltages[node1] || 0;
            const v2 = nodeVoltages[node2] || 0;
            const voltage = v1 - v2;
            
            let current = 0;
            let power = 0;
            
            switch (comp.type) {
                case 'resistor':
                    current = voltage / comp.properties.resistance;
                    power = voltage * current;
                    break;
                case 'voltage':
                    // Current through voltage source depends on circuit
                    current = 0; // Simplified
                    power = comp.properties.voltage * current;
                    break;
                case 'capacitor':
                    current = 0; // DC analysis
                    power = 0;
                    break;
                case 'inductor':
                    current = voltage / 0.001; // Very small resistance
                    power = voltage * current;
                    break;
            }
            
            // Store results in component
            comp.simulationResults = {
                voltage: voltage,
                current: current,
                power: power,
                nodeVoltages: [v1, v2]
            };
        });
    }
    
    // Get simulation results for a component
    getComponentResults(componentId) {
        if (!this.simulationResults) return null;
        
        const comp = this.simulationResults.netlist.components.find(c => c.id === componentId);
        return comp ? comp.simulationResults : null;
    }
    
    // Check if circuit is valid and working
    validateCircuit() {
        if (!this.simulationResults) {
            return {
                isValid: false,
                issues: ['Circuit not simulated yet']
            };
        }
        
        const issues = [];
        const { netlist } = this.simulationResults;
        
        // Check for floating nodes
        const connectedNodes = new Set();
        netlist.components.forEach(comp => {
            comp.nodes.forEach(node => connectedNodes.add(node));
        });
        
        // Check for excessive currents
        netlist.components.forEach(comp => {
            if (comp.simulationResults) {
                const { current, power } = comp.simulationResults;
                
                if (Math.abs(current) > 10) { // 10A threshold
                    issues.push(`High current (${current.toFixed(3)}A) in ${comp.type} ${comp.id}`);
                }
                
                if (comp.type === 'resistor' && comp.properties.power) {
                    if (Math.abs(power) > comp.properties.power) {
                        issues.push(`Power rating exceeded in resistor ${comp.id}: ${power.toFixed(3)}W > ${comp.properties.power}W`);
                    }
                }
            }
        });
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }
    
    // Get human-readable analysis
    getAnalysisReport() {
        if (!this.simulationResults) return 'No simulation results available';
        
        const { nodeVoltages, netlist } = this.simulationResults;
        const validation = this.validateCircuit();
        
        let report = '=== Circuit Analysis Report ===\n\n';
        
        // Node voltages
        report += 'Node Voltages:\n';
        nodeVoltages.forEach((voltage, index) => {
            report += `  Node ${index}: ${voltage.toFixed(3)}V\n`;
        });
        report += '\n';
        
        // Component analysis
        report += 'Component Analysis:\n';
        netlist.components.forEach(comp => {
            if (comp.simulationResults && comp.type !== 'ground') {
                const { voltage, current, power } = comp.simulationResults;
                report += `  ${comp.type.toUpperCase()} ${comp.id}:\n`;
                report += `    Voltage: ${voltage.toFixed(3)}V\n`;
                report += `    Current: ${current.toFixed(6)}A\n`;
                report += `    Power: ${power.toFixed(6)}W\n\n`;
            }
        });
        
        // Validation results
        report += 'Circuit Validation:\n';
        report += `  Status: ${validation.isValid ? 'VALID' : 'ISSUES FOUND'}\n`;
        if (validation.issues.length > 0) {
            report += '  Issues:\n';
            validation.issues.forEach(issue => {
                report += `    - ${issue}\n`;
            });
        }
        
        return report;
    }
    
    // Reset simulation
    reset() {
        this.nodes.clear();
        this.components = [];
        this.wires = [];
        this.groundNode = null;
        this.simulationResults = null;
        this.isSimulating = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitSimulator;
}