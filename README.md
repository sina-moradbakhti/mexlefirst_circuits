# Circuit Simulator

A web-based interactive circuit visualization tool similar to Falstad CircuitJS, designed for electrical engineering applications with support for standard circuit data formats.

## Features

### Core Functionality
- **Interactive Circuit Design**: Drag and drop components to create circuits
- **Standard Format Support**: Parse and generate circuit data in electrical engineering standard format
- **Component Library**: Resistors, capacitors, inductors, voltage sources, ground, and wires
- **Real-time Visualization**: Smooth rendering with zoom and pan capabilities
- **Component Properties**: Editable component values and properties
- **Export/Import**: Save and load circuits in JSON format

### User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Grid Snapping**: Automatic alignment to grid for precise placement
- **Tool Selection**: Quick access to different tools via buttons or keyboard shortcuts
- **Properties Panel**: Edit component values and properties in real-time
- **Status Bar**: Real-time feedback and coordinate display

### Advanced Features
- **Zoom and Pan**: Navigate large circuits easily
- **Component Rotation**: Rotate components to any angle
- **Multi-selection**: Select and manipulate multiple components
- **Undo/Redo**: Full history management
- **Wire Drawing**: Interactive wire placement with visual feedback

## Circuit Data Format

The simulator supports the standard electrical engineering circuit format:

```
r x1 y1 x2 y2 flags resistance    # Resistor
c x1 y1 x2 y2 flags capacitance   # Capacitor  
l x1 y1 x2 y2 flags inductance    # Inductor
v x1 y1 x2 y2 flags voltage       # Voltage Source
g x y flags                       # Ground
w x1 y1 x2 y2                     # Wire
```

### Example Circuit Data
```
r 548 100 548 228 0 12000
c 250 100 350 100 0 100
l 400 100 500 100 0 10
v 100 200 100 300 0 5
g 100 350 0
w 200 100 250 100
w 350 100 400 100
```

## Usage

### Getting Started
1. Open `index.html` in a web browser
2. Use the component buttons to select tools
3. Click on the canvas to place components
4. Use the wire tool to connect components
5. Select components to edit their properties

### Keyboard Shortcuts
- **S**: Select tool
- **W**: Wire tool
- **R**: Resistor tool
- **C**: Capacitor tool
- **L**: Inductor tool
- **V**: Voltage source tool
- **G**: Ground tool
- **Delete**: Delete selected components
- **Ctrl+A**: Select all
- **Ctrl+C**: Copy selected
- **Ctrl+V**: Paste
- **Ctrl+Z**: Undo
- **Ctrl+Shift+Z**: Redo
- **R**: Rotate selected components
- **Escape**: Cancel current action

### Mouse Controls
- **Left Click**: Select/place components
- **Right Click**: Context menu/cancel action
- **Middle Click + Drag**: Pan view
- **Ctrl + Left Drag**: Pan view
- **Mouse Wheel**: Zoom in/out
- **Drag**: Move selected components

## Integration

### Embedding in Flutter Web
```html
<iframe src="path/to/circuit-simulator/index.html" 
        width="100%" 
        height="600px" 
        frameborder="0">
</iframe>
```

### Embedding in Admin Panel
```html
<div class="circuit-container">
    <iframe src="circuit-simulator/index.html" 
            width="100%" 
            height="500px">
    </iframe>
</div>
```

### API Integration
The simulator can be controlled via JavaScript:

```javascript
// Access the simulator instance
const simulator = window.circuitSimulator;

// Load circuit data
simulator.parseCircuitInput();

// Export circuit
const circuitData = simulator.circuitParser.generateCircuitData(
    simulator.components, 
    simulator.wires
);

// Clear circuit
simulator.clearCircuit();
```

## File Structure

```
mexlefirst_circuits/
├── index.html              # Main HTML file
├── styles.css              # Styling
├── js/
│   ├── main.js             # Main application controller
│   ├── components.js       # Component definitions and rendering
│   ├── circuit-parser.js   # Circuit data parser
│   ├── renderer.js         # Canvas rendering engine
│   ├── input-handler.js    # Mouse and keyboard input
│   └── utils.js            # Utility functions
├── README.md               # This file
└── help_01.png            # Reference image
```

## Component Types

### Resistor
- **Symbol**: Rectangular box with zigzag pattern
- **Properties**: Resistance (Ω), Tolerance (%), Power (W)
- **Format**: `r x1 y1 x2 y2 flags resistance`

### Capacitor
- **Symbol**: Two parallel plates
- **Properties**: Capacitance (F), Voltage (V), Type
- **Format**: `c x1 y1 x2 y2 flags capacitance`

### Inductor
- **Symbol**: Coil/spiral
- **Properties**: Inductance (H), Current (A), Type
- **Format**: `l x1 y1 x2 y2 flags inductance`

### Voltage Source
- **Symbol**: Circle with + and - symbols
- **Properties**: Voltage (V), Frequency (Hz), Phase (°)
- **Format**: `v x1 y1 x2 y2 flags voltage`

### Ground
- **Symbol**: Ground symbol with multiple lines
- **Properties**: None
- **Format**: `g x y flags`

### Wire
- **Symbol**: Simple line connection
- **Properties**: Resistance (Ω)
- **Format**: `w x1 y1 x2 y2`

## Customization

### Adding New Components
1. Add component definition in `components.js`
2. Add rendering logic in the `render()` method
3. Add parser support in `circuit-parser.js`
4. Add UI button in `index.html`

### Styling
Modify `styles.css` to customize:
- Colors and themes
- Component appearance
- UI layout
- Responsive behavior

### Extending Functionality
- Add new tools in `input-handler.js`
- Extend circuit format in `circuit-parser.js`
- Add simulation capabilities
- Integrate with external APIs

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile**: Responsive design with touch support

## Performance

- **Canvas Rendering**: Hardware-accelerated 2D canvas
- **Efficient Updates**: Only redraws when necessary
- **Memory Management**: Proper cleanup and garbage collection
- **Large Circuits**: Optimized for circuits with 1000+ components

## Future Enhancements

1. **Circuit Simulation**: Add electrical simulation capabilities
2. **Component Library**: Expand with more component types
3. **Schematic Export**: Export to standard formats (SVG, PDF)
4. **Collaboration**: Real-time collaborative editing
5. **Hardware Integration**: Connect to real hardware devices
6. **Advanced Analysis**: Frequency response, transient analysis

## License

This project is open source and available under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For questions, issues, or feature requests, please create an issue in the project repository.