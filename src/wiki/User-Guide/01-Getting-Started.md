# Getting Started with Qualia-NSS 🚀

Welcome to **Qualia-NSS** - your comprehensive toolkit for designing natural surround sound loudspeaker systems! This guide will help you get up and running quickly.

## 🎯 What is Qualia-NSS?

Qualia-NSS is a web-based application that provides professional-grade tools for:
- **Speaker Analysis**: Measure and analyze driver characteristics
- **Filter Design**: Create crossover networks for multi-way speakers
- **Cabinet Modeling**: Design optimal enclosures for your drivers
- **Real-time Testing**: Use your microphone for live acoustic measurements
- **3D Visualization**: See frequency response in stunning 3D spectrograms

## 🌐 System Requirements

### Minimum Requirements
- **Browser**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **JavaScript**: Enabled (required)
- **Web Audio API**: Supported (automatic in modern browsers)

### Recommended Setup
- **Microphone**: USB or built-in mic for measurements
- **Audio Interface**: For professional measurement workflows
- **Screen Resolution**: 1280x720 or higher
- **RAM**: 4GB+ for complex 3D visualizations

### Network Requirements
- **Connection**: Internet for initial loading (works offline after)
- **Bandwidth**: Minimal (static files only)
- **Latency**: Not critical (all processing is local)

## 🏃‍♂️ Quick Start Guide

### Step 1: Launch the Application
1. Open your web browser
2. Navigate to your Qualia-NSS installation (e.g., `http://localhost:8080/` or `https://qualia-nss.com/`)
3. Wait for the application to load (should take just a few seconds)

### Step 2: Explore the Interface

#### Main Navigation Bar
```
🍀 QUALIA•NSS    [Speakers] [Filters] [Cabinets] [7bandmeter] [Spectrogram] [Wiki]    💡
```

- **QUALIA•NSS Logo**: Return to home page
- **Speakers**: Analyze driver specifications and frequency response
- **Filters**: Design crossover networks and filters
- **Cabinets**: Calculate enclosure dimensions and characteristics
- **7bandmeter**: Real-time psychoacoustic level metering
- **Spectrogram**: 3D frequency/time analysis with WebGL
- **Wiki**: This documentation system (you're here now!)
- **💡**: Toggle between light and dark themes

#### Sidebar (Module-specific)
Each module has a dedicated sidebar with:
- **Controls**: Parameter adjustments and settings
- **Options**: Module-specific features and tools
- **Results**: Real-time calculations and measurements

### Step 3: Your First Project

#### Choose Your Starting Point:

**🔰 Beginner Path**: Start with Filter Design
1. Click **[Filters]** in the navigation
2. Experiment with different filter types
3. Observe the real-time frequency response
4. Learn how cutoff frequency and slope affect the sound

**🔧 Hands-on Path**: Jump to Measurements  
1. Click **[7bandmeter]** for real-time analysis
2. Allow microphone access when prompted
3. Play music and watch the frequency bands respond
4. Use this to understand what you're hearing

**🎨 Visual Path**: Explore 3D Visualization
1. Click **[Spectrogram]** for stunning 3D graphics
2. Allow microphone access for live input
3. Whistle, clap, or play music to see sound in 3D
4. Adjust the test tone frequency with the slider

## 🎛️ Understanding the Tools

### Speakers Module 📊
**Purpose**: Analyze individual drivers and complete speaker systems

**Key Features**:
- Import manufacturer specifications
- Plot frequency response curves  
- Calculate sensitivity and impedance
- Compare multiple drivers side-by-side

**When to Use**: 
- Selecting drivers for a new project
- Understanding existing speaker characteristics
- Troubleshooting performance issues

### Filters Module 🔊
**Purpose**: Design crossover networks for multi-way speakers

**Key Features**:
- High-pass, low-pass, band-pass, and notch filters
- Adjustable cutoff frequency and slope
- Real-time frequency response visualization
- Phase and group delay analysis

**When to Use**:
- Designing two-way or three-way speakers
- Protecting tweeters from low frequencies
- Creating custom frequency responses

### Cabinets Module 📦
**Purpose**: Calculate optimal enclosure designs

**Key Features**:
- Sealed, ported, passive radiator, and transmission line designs
- Internal volume calculations
- Port tuning and dimensions
- Frequency response prediction

**When to Use**:
- Designing new speaker enclosures
- Optimizing existing cabinet dimensions
- Understanding how enclosures affect sound

### 7bandmeter Module 📈
**Purpose**: Real-time psychoacoustic analysis

**Key Features**:
- Seven-band level metering
- Psychoacoustic frequency weighting
- Real-time microphone input
- Visual feedback for acoustic measurements

**When to Use**:
- Measuring room acoustics
- Analyzing music content
- Real-time system monitoring
- Educational demonstrations

### Spectrogram Module 🌈
**Purpose**: 3D visualization of frequency content over time

**Key Features**:
- WebGL-powered 3D graphics
- Real-time microphone analysis
- Adjustable test tone generator
- Google Chrome Music Lab colormap
- Interactive 3D navigation

**When to Use**:
- Visualizing complex audio signals
- Understanding how sounds change over time
- Impressive demonstrations and presentations
- Advanced acoustic analysis

## 🎵 Audio Permissions

### Microphone Access
Most modules require microphone access for measurements:

1. **Browser Prompt**: Click "Allow" when requested
2. **Manual Enable**: Go to browser settings if needed
3. **Troubleshooting**: Refresh page if audio doesn't work
4. **Privacy**: All processing is local - no audio is transmitted

### Audio Context
The Web Audio API requires user interaction to start:
- Click any button or control in the module
- Audio will activate automatically after first interaction
- No special configuration required

## 🎨 Customization Options

### Theme Selection
- **Dark Theme** (default): Easy on the eyes for long sessions
- **Light Theme**: Better visibility in bright environments
- **Auto-switching**: Preference saved in browser storage

### Module Layout
- **Responsive Design**: Adapts to screen size automatically  
- **Sidebar**: Collapsible on mobile devices
- **Full-screen Mode**: Some modules support expanded view

## 🆘 Getting Help

### Built-in Documentation
- **Wiki Module**: Comprehensive guides and references (you're here!)
- **Tooltips**: Hover over controls for quick help
- **Console**: Check browser developer tools for detailed logs

### Common Issues

#### "Microphone not working"
1. Check browser permissions
2. Try refreshing the page
3. Ensure microphone is connected and working
4. Test with other apps to verify hardware

#### "Module not loading"
1. Check console for JavaScript errors
2. Ensure modern browser (see requirements above)
3. Try different browser or incognito mode
4. Clear browser cache if necessary

#### "Slow performance"
1. Close other browser tabs
2. Disable browser extensions temporarily
3. Use hardware acceleration if available
4. Try lower-resolution display settings

## 📚 Learning Path

### Recommended Order for New Users:

1. **[Getting Started](01-Getting-Started.md)** ← You are here
2. **[Understanding Filters](02-Understanding-Filters.md)** - Learn filter fundamentals
3. **[Cabinet Design Guide](03-Cabinet-Design.md)** - Understand enclosures
4. **[Measurement Techniques](04-Measurement-Guide.md)** - Use the analysis tools
5. **[Advanced Topics](05-Advanced-Techniques.md)** - Expert-level features

### Project-Based Learning:
- **[Two-Way Speaker Project](Projects/Two-Way-Speaker.md)** - Complete walkthrough
- **[Room Correction Setup](Projects/Room-Correction.md)** - Measurement and EQ
- **[Subwoofer Integration](Projects/Subwoofer-Design.md)** - Low-frequency optimization

## 🚀 Ready to Begin?

You're now ready to start your Qualia-NSS journey! Here are some suggested next steps:

- **🎛️ Explore**: Click through each module to see what's available
- **🎧 Listen**: Use the 7bandmeter to analyze your favorite music
- **📊 Design**: Try creating a simple filter in the Filters module
- **📖 Learn**: Continue with the [Understanding Filters](02-Understanding-Filters.md) guide

**Happy designing!** 🎵

---

**Next Guide**: [Understanding Filters](02-Understanding-Filters.md) →

*Questions? Check the [FAQ](../Support/FAQ.md) or explore the [Developer Documentation](../Developer-Docs/) for technical details.*