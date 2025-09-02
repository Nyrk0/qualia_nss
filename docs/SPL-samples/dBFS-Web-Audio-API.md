Web Audio API:

AnalyserNode.getFloatTimeDomainData: Returns raw PCM samples as floating-point values between -1.0 and 1.0, where 1.0 corresponds to 0 dBFS.
AnalyserNode.getByteTimeDomainData: Returns values from 0 to 255, centered at 128, requiring conversion to -1.0 to 1.0.
AnalyserNode.getByteFrequencyData: Returns frequency bin amplitudes (0–255), which need RMS calculation and scaling to dBFS.


Scaling to dBFS: Convert the raw signal amplitude to dBFS using the formula 20 * log10(amplitude), where amplitude is normalized to a 0–1 range (or 1 for full scale). For time-domain data, compute the RMS (root mean square) of samples to get the signal level.

Example Code: MicrophoneSpectrumAnalyzer.jsx
Below is a React component that captures microphone input, processes it with the Web Audio API, and scales the readings to dBFS for display as a level meter. This assumes you’re working with time-domain data for a simple level meter, but I’ll include comments for adapting it to frequency-domain data (spectrum analyzer).
jsximport React, { useState, useEffect, useRef } from 'react';
import './MicrophoneSpectrumAnalyzer.css'; // Optional: for styling

const MicrophoneSpectrumAnalyzer = () => {
  const [level, setLevel] = useState(-Infinity); // dBFS level
  const [isMonitoring, setIsMonitoring] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize microphone and audio context
  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048; // Adjust for desired resolution
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      setIsMonitoring(true);
      updateLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  // Stop monitoring
  const stopMonitoring = () => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsMonitoring(false);
    setLevel(-Infinity);
    cancelAnimationFrame(animationFrameRef.current);
  };

  // Update microphone level in dBFS
  const updateLevel = () => {
    if (!analyserRef.current) return;

    // Use time-domain data for level metering
    const dataArray = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(dataArray);

    // Calculate RMS (root mean square) of the signal
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sumSquares += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);

    // Convert RMS to dBFS: 20 * log10(rms), with clamping to avoid -Infinity
    const dbFS = rms > 0 ? 20 * Math.log10(rms) : -Infinity;

    // Update state with the dBFS level
    setLevel(dbFS);

    // Continue updating
    animationFrameRef.current = requestAnimationFrame(updateLevel);
  };

  // For frequency-domain data (spectrum analyzer)
  const updateFrequencyLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Average frequency bins (or select a specific range for speech, e.g., 100-8000 Hz)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;

    // Scale from 0-255 to 0-1, then to dBFS
    const amplitude = avg / 255;
    const dbFS = amplitude > 0 ? 20 * Math.log10(amplitude) - 48 : -Infinity; // -48 dB adjustment for typical scaling
    setLevel(dbFS);

    animationFrameRef.current = requestAnimationFrame(updateFrequencyLevel);
  };

  // Toggle monitoring
  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => stopMonitoring();
  }, []);

  return (
    <div className="mic-analyzer">
      <h2>Microphone Level Meter</h2>
      <div className="level-meter">
        <div
          className="level-bar"
          style={{
            width: `${Math.max(0, (level + 100) * 100 / 100)}%`, // Map -100 to 0 dBFS to 0-100%
            backgroundColor: level > -6 ? 'red' : level > -20 ? 'yellow' : 'green',
          }}
        />
      </div>
      <p>Level: {level.toFixed(1)} dBFS</p>
      <button onClick={toggleMonitoring}>
        {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
      </button>
    </div>
  );
};