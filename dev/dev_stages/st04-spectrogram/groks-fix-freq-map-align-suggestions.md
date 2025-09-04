# Spectrogram Module Suggestions and Issues
https://grok.com/c/949e0772-0e73-453f-9ee4-b169a2ccba82

## Veredict:
Gemini 2.5 Pro was able to fix the frequency mapping issue, also draw the frequency ticks and guidelines. – Alex W. Rettig E. (alex.rettig@qualia-nss.com) date: 2025-09-04 time: 19:30:00 UTC

--

## Alignment Misalignment of 1kHz Tone Peak
- **Observation**: The 1kHz tone peak appears to the left of the 1k frequency mark in the front view, despite a 48kHz sample rate.
- **Cause**: The current logarithmic mapping (`pow(256.0, gTexCoord0.x - 1.0)`) in the `sonogramVertexShader` may not accurately reflect the bin-to-frequency conversion for a 48kHz sample rate with a typical 2048-bin FFT, causing a shift in the peak position.
- **Suggestion**: Recalibrate the frequency mapping to align with the 20Hz to 20kHz human hearing range. Use a logarithmic scale based on bin indices:
  - Update the shader with: `float x = log2((gTexCoord0.x * 2047.0) * (48000.0 / 2048.0) / 20.0) / log2(1000.0);`
  - This maps the 43rd bin (~1000Hz at 23.44Hz/bin) to approximately `gTexCoord0.x = 0.5`, aligning with the 1k mark.
- **Verification**: Test with a 1kHz tone and adjust if the FFT size differs (e.g., 4096 bins would shift to bin 85).

## Perspective Compensation
- **Observation**: The 3D perspective (tilted front view) may exaggerate the horizontal shift due to parallax.
- **Suggestion**: Use the click handler’s ray-casting logic to project the peak’s position at maximum amplitude and dynamically adjust HTML label offsets to match the apparent location.

## Additional Issue: 80Hz Graph Minimum
- **Observation**: The graph appears to start near 80Hz, whereas the human hearing range should begin at 20Hz, as indicated by the axis labels.
- **Cause**: The FFT binning or texture sampling might exclude lower frequencies due to hardware limits, default analyser node settings, or an offset in the `vertexFrequencyData` sampling.
- **Suggestion**: 
  - Check the analyser node’s `frequencyBinCount` and ensure it starts from the lowest bin (0Hz). Adjust the `minDecibels` property to -100dB to capture the full range.
  - Modify the `sonogramVertexShader` to enforce the 20Hz minimum by clamping the frequency calculation: `float freq = max(20.0, (gTexCoord0.x * 2047.0) * (48000.0 / 2048.0));`.
  - Verify the texture offset (`vertexYOffset`) doesn’t skip the lower frequency bins.

## Frequency Ticks and Guidelines
- **Observation**: The image shows frequency ticks (20, 60, 100, ..., 20k) but lacks guidelines from -100 to 0 dBFS across the front view.
- **Suggestion**: Enhance the `spectrogramAnalyserView` to draw vertical guidelines at frequency ticks and horizontal dBFS lines. This can be implemented in the WebGL rendering loop using the `lineVertexShader` and `lineFragmentShader`.