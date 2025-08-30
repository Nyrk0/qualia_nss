# Tone Control Web Component

A professional frequency slider with integrated speaker toggle for audio applications.

## Features

- **Logarithmic frequency mapping** (20 Hz - 20 kHz)
- **Advanced frequency snapping** to useful frequency points
- **Built-in colormaps** for frequency-based visual feedback
- **1 kHz default** initialization
- **Full-width responsive** design
- **Accessibility** support with ARIA labels

## Usage

```html
<tone-control id="myToneControl"></tone-control>
```

## API Reference

### Properties

#### `frequency` (Number)
Get/set the current frequency in Hz.
```javascript
toneControl.frequency = 1000; // Set to 1 kHz
console.log(toneControl.frequency); // Get current frequency
```

#### `active` (Boolean)
Get/set the speaker toggle state.
```javascript
toneControl.active = true; // Enable speaker
console.log(toneControl.active); // Check if active
```

#### `label` (String)
Get/set custom label text (overrides frequency display).
```javascript
toneControl.label = "Test Tone"; // Custom label
toneControl.label = ""; // Reset to frequency display
```

#### `colormap` (String)
Get/set the built-in colormap mode.
```javascript
toneControl.colormap = 'qualia7band'; // Default
toneControl.colormap = 'googleturbo';  // Alternative
```

**Available colormaps:**
- `'qualia7band'` (default): Professional 7-band frequency colormap
- `'googleturbo'`: Google Research Turbo colormap

#### `colorForFrequency` (Function)
**Legacy/compatibility**: External color function injection.
```javascript
// For backward compatibility only - use built-in colormaps instead
toneControl.colorForFrequency = (freq) => `hsl(${freq/100}, 50%, 50%)`;
```

### Events

#### `frequencychange`
Fired when frequency changes via user interaction.
```javascript
toneControl.addEventListener('frequencychange', (e) => {
    console.log('Frequency:', e.detail.frequency); // Hz value
    console.log('Slider value:', e.detail.value);  // 0-1 normalized
});
```

#### `toggle`
Fired when speaker button is clicked.
```javascript
toneControl.addEventListener('toggle', (e) => {
    console.log('Active:', e.detail.active); // Boolean state
});
```

#### `start` / `stop`
Fired when transitioning to/from active state.
```javascript
toneControl.addEventListener('start', (e) => {
    console.log('Tone started at:', e.detail.frequency, 'Hz');
});

toneControl.addEventListener('stop', (e) => {
    console.log('Tone stopped');
});
```

## Frequency Snapping

The component automatically snaps to useful frequency points:

**Snap Targets:**
- **Low frequencies**: 20, 25, 31.5, 40, 50, 63, 80 Hz
- **Mid frequencies**: 100, 200, 300, ..., 10000 Hz (100 Hz steps)
- **High frequencies**: 11000, 12000, ..., 20000 Hz (1 kHz steps)

**Tolerance**: 0.5% of target frequency or minimum 0.5 Hz

## Built-in Colormaps

### Qualia 7band (Default)
Professional psychoacoustic frequency bands:
- **20-60 Hz**: Dark red - Sub-bass
- **60-250 Hz**: Crimson - Bass
- **250-500 Hz**: Tomato - Low Mid
- **500-2000 Hz**: Dark orange - Midrange
- **2000-4000 Hz**: Lime green - Upper Mid
- **4000-6000 Hz**: Dodger blue - Presence
- **6000-20000 Hz**: Medium purple - Brilliance

### Google Turbo
Research-grade perceptually uniform colormap:
- **Low frequencies**: Purple to blue
- **Mid frequencies**: Blue to green to yellow
- **High frequencies**: Yellow to orange to red

## Examples

### Basic Usage
```html
<tone-control id="basicTone"></tone-control>

<script>
const tone = document.getElementById('basicTone');

// Listen for frequency changes
tone.addEventListener('frequencychange', (e) => {
    console.log(`Frequency: ${e.detail.frequency} Hz`);
});

// Listen for toggle
tone.addEventListener('toggle', (e) => {
    console.log(`Speaker: ${e.detail.active ? 'ON' : 'OFF'}`);
});
</script>
```

### With Google Turbo Colormap
```html
<tone-control id="turboTone" colormap="googleturbo"></tone-control>
```

### Programmatic Control
```javascript
const tone = document.getElementById('myTone');

// Set frequency to 440 Hz (A4)
tone.frequency = 440;

// Enable speaker
tone.active = true;

// Switch to Google Turbo colors
tone.colormap = 'googleturbo';

// Custom label
tone.label = "A4 Note";
```

## CSS Customization

The component uses CSS custom properties for theming:
```css
tone-control {
    --tone-color: #9aa6b2; /* Default component color */
    --panel-border-color: #333; /* Used in some contexts */
    --text-color: #ddd; /* Text color inheritance */
}
```

## Architecture Notes

- **Component-level colormap**: Independent of module visualizations
- **Global consistency**: Same colormap across all modules
- **Future OAuth integration**: Ready for user preference storage
- **Accessibility**: Full ARIA support and semantic HTML

## Browser Support

- **Modern browsers** with Web Components support
- **ES6+ required** for component functionality
- **Shadow DOM** for style isolation
- **Custom Elements v1** specification

---

**Important**: This component's colormap system is independent of module colormaps (like spectrogram visualization colors). See `dev/dev_directives/colormap_architecture.md` for details.