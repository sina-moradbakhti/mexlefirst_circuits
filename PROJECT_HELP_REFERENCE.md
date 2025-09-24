# Circuit Simulator - Complete Project Reference

## PROJECT OVERVIEW
This is a sophisticated web-based circuit simulator similar to Falstad CircuitJS, built for electrical engineering applications. It supports standard circuit data formats and provides interactive circuit design, simulation, and analysis capabilities.

## CORE ARCHITECTURE

### File Structure
```
mexlefirst_circuits/
├── index.html              # Main HTML interface
├── styles.css              # Complete styling
├── js/
│   ├── main.js             # Main application controller (CircuitSimulator class)
│   ├── components.js       # Component definitions (Component, Wire, ComponentFactory)
│   ├── circuit-parser.js   # Circuit data parser (CircuitParser class)
│   ├── circuit-simulator.js # Circuit analysis engine (CircuitAnalyzer class)
│   ├── renderer.js         # Canvas rendering engine (Renderer class)
│   ├── input-handler.js    # Mouse/keyboard input (InputHandler class)
│   └── utils.js            # Utility functions (Utils, Vector2)
├── README.md               # Comprehensive documentation
├── example-embed.html      # Embedding example
└── help_01.png            # Reference image
```

### Main Classes & Responsibilities

#### 1. CircuitSimulator (main.js)
- **Primary controller** managing the entire application
- Coordinates all other classes and handles UI interactions
- Manages circuit state, history (undo/redo), and properties panel
- Handles file import/export and circuit parsing
- Contains pre-built test circuits (voltage divider, parallel resistors, RC circuit, series resistors)

#### 2. Component & Wire (components.js)
- **Component class**: Represents circuit elements (resistor, capacitor, inductor, voltage source, ground)
- **Wire class**: Represents connections between components
- **ComponentFactory**: Creates components and wires
- Each component has properties, connection points, rendering methods, and JSON serialization

#### 3. CircuitParser (circuit-parser.js)
- Parses standard electrical engineering circuit format
- Converts between visual components and text format
- Supports format: `r x1 y1 x2 y2 flags resistance` (resistor example)
- Validates circuit data and provides example circuits

#### 4. CircuitAnalyzer (circuit-simulator.js)
- **Advanced circuit simulation engine**
- Performs nodal analysis using Gaussian elimination
- Builds netlists from visual components
- Calculates node voltages, component currents, and power dissipation
- Validates circuits and generates analysis reports

#### 5. Renderer (renderer.js)
- Canvas-based rendering system
- Handles zoom, pan, and coordinate transformations
- Renders components, wires, selection highlights, and connection points
- Optimized for smooth real-time updates

#### 6. InputHandler (input-handler.js)
- Manages all mouse and keyboard interactions
- Handles component placement, selection, movement, and deletion
- Wire drawing with visual feedback
- Tool switching and multi-selection support

## KEY FEATURES

### Circuit Design
- **Interactive placement**: Click to place components
- **Wire drawing**: Click-and-drag wire connections
- **Component rotation**: Automatic and manual rotation
- **Grid snapping**: Precise component alignment
- **Multi-selection**: Select and manipulate multiple components
- **Properties editing**: Real-time component value editing

### Standard Format Support
```
r 548 100 548 228 0 12000    # Resistor: 12kΩ
c 250 100 350 100 0 100      # Capacitor: 100pF
l 400 100 500 100 0 10       # Inductor: 10μH
v 100 200 100 300 0 5        # Voltage Source: 5V
g 100 350 0                  # Ground
w 200 100 250 100            # Wire connection
```

### Circuit Simulation
- **Nodal analysis**: Solves circuit equations using matrix methods
- **Component analysis**: Calculates voltage, current, and power for each component
- **Circuit validation**: Checks for floating nodes, excessive currents, power ratings
- **Detailed reports**: Human-readable analysis with node voltages and component values

### Built-in Test Circuits
1. **Voltage Divider**: 9V battery with 2kΩ and 1kΩ resistors in series
2. **Parallel Resistors**: 5V battery with 1kΩ and 2kΩ resistors in parallel
3. **RC Circuit**: 12V battery with 10kΩ resistor and 100μF capacitor
4. **Series Resistors**: 15V battery with three resistors (1kΩ, 2kΩ, 3kΩ) in series

## TECHNICAL IMPLEMENTATION

### Component Connection System
- Each component has precise connection points calculated based on position and rotation
- Wire connections use exact coordinate matching with tolerance
- Connection groups are built by analyzing wire endpoints and component connection points
- Netlist generation maps visual connections to electrical nodes

### Simulation Engine
- **Matrix-based solver**: Uses Gaussian elimination for nodal analysis
- **Component models**: 
  - Resistors: Ohm's law (V = IR)
  - Voltage sources: Ideal voltage with large conductance method
  - Capacitors: Open circuit in DC analysis
  - Inductors: Short circuit in DC analysis
- **Ground reference**: Node 0 is always ground (0V)

### Rendering System
- **Canvas 2D**: Hardware-accelerated rendering
- **Camera system**: World-to-screen coordinate transformation
- **Zoom/Pan**: Smooth navigation with mouse wheel and drag
- **Visual feedback**: Selection highlights, connection points, wire previews

### Data Persistence
- **JSON export/import**: Complete circuit state serialization
- **Standard format**: Text-based circuit data compatible with other tools
- **History management**: Undo/redo with state snapshots (50 levels)

## USER INTERFACE

### Toolbar Sections
1. **Components**: Resistor, Capacitor, Inductor, Voltage Source, Ground, Wire
2. **Controls**: Simulate, Clear, Export, Import
3. **View**: Zoom In/Out, Reset View
4. **Test Circuits**: Pre-built example circuits
5. **Input**: Text area for circuit data parsing

### Properties Panel
- **Dynamic content**: Updates based on selected component
- **Editable properties**: Resistance, capacitance, inductance, voltage
- **Position/rotation**: Precise component positioning
- **Real-time updates**: Changes applied immediately

### Status Bar
- **Current tool**: Shows active tool and instructions
- **Coordinates**: Mouse position display
- **Operation feedback**: Success/error messages

## KEYBOARD SHORTCUTS
- **S**: Select tool
- **W**: Wire tool
- **R**: Resistor tool
- **C**: Capacitor tool
- **L**: Inductor tool
- **V**: Voltage source tool
- **G**: Ground tool
- **Delete**: Delete selected components
- **Ctrl+A**: Select all
- **Ctrl+C/V**: Copy/paste
- **Ctrl+Z**: Undo
- **Ctrl+Shift+Z**: Redo
- **R**: Rotate selected components
- **Escape**: Cancel current action

## INTEGRATION CAPABILITIES

### Embedding
```html
<iframe src="path/to/circuit-simulator/index.html" 
        width="100%" height="600px" frameborder="0">
</iframe>
```

### JavaScript API
```javascript
const simulator = window.circuitSimulator;
simulator.parseCircuitInput();
const circuitData = simulator.circuitParser.generateCircuitData(
    simulator.components, simulator.wires
);
simulator.clearCircuit();
```

## DEVELOPMENT NOTES

### Code Organization
- **Modular design**: Each class has specific responsibilities
- **Event-driven**: UI interactions trigger appropriate handlers
- **State management**: Centralized state with history tracking
- **Error handling**: Comprehensive validation and error reporting

### Performance Optimizations
- **Efficient rendering**: Only redraws when necessary
- **Connection caching**: Pre-calculated connection points
- **Matrix operations**: Optimized linear algebra for circuit solving
- **Memory management**: Proper cleanup and garbage collection

### Browser Compatibility
- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **Canvas 2D**: Hardware acceleration where available
- **Touch support**: Mobile-friendly interface
- **Responsive design**: Adapts to different screen sizes

## SIMULATION ACCURACY

### Supported Analysis
- **DC analysis**: Steady-state voltage and current calculations
- **Linear components**: Resistors, ideal voltage sources
- **Reactive components**: Simplified models for capacitors and inductors
- **Node voltage method**: Industry-standard circuit analysis technique

### Limitations
- **DC only**: No AC frequency analysis
- **Linear models**: No non-linear components (diodes, transistors)
- **Ideal components**: No parasitic effects or tolerances
- **Small circuits**: Optimized for educational/demonstration circuits

## FUTURE ENHANCEMENT POSSIBILITIES

### Simulation Features
- **AC analysis**: Frequency response and phasor analysis
- **Transient analysis**: Time-domain simulation
- **Non-linear components**: Diodes, transistors, op-amps
- **SPICE integration**: Industry-standard simulation engine

### User Interface
- **Component library**: Expanded component selection
- **Schematic symbols**: IEEE/IEC standard symbols
- **Print/export**: PDF and SVG export capabilities
- **Collaboration**: Real-time multi-user editing

### Advanced Features
- **Parameter sweeps**: Automated analysis across component ranges
- **Monte Carlo**: Statistical analysis with component tolerances
- **Optimization**: Automated circuit design optimization
- **Hardware integration**: Connection to real measurement equipment

## TROUBLESHOOTING

### Common Issues
1. **Simulation fails**: Check for ground reference and proper connections
2. **Components not connecting**: Verify exact coordinate alignment
3. **Import errors**: Validate circuit data format
4. **Performance issues**: Reduce circuit complexity or browser zoom level

### Debug Information
- Browser console shows detailed connection and simulation data
- Component connection points are logged during simulation
- Matrix equations and solutions are available in console output

## PROJECT CONTEXT
This circuit simulator was developed as a comprehensive educational and professional tool for electrical circuit analysis. It combines the visual appeal of modern web interfaces with the mathematical rigor of professional circuit simulation tools. The codebase is well-structured, documented, and designed for both standalone use and integration into larger educational or engineering platforms.

The project demonstrates advanced JavaScript programming techniques, including object-oriented design, canvas graphics programming, mathematical computation, and user interface development. It serves as an excellent example of a complete, production-ready web application for technical/engineering purposes.