# 7‑Band Colormap (Tone Slider)

This document describes the color mapping used to color the tone slider by frequency. It preserves the existing band hues at each band’s middle frequency while adding perceptually smooth interpolation across the audible range with extreme endpoints.

## Anchor Colors

Anchors define exact colors at key frequencies. Interpolation is log‑frequency between adjacent anchors.

- 20 Hz → #2a0000 (extreme Sub‑bass)
- 40 Hz → #8b0000 (Sub‑bass middle)
- 122.5 Hz → #dc143c (Bass middle)
- 353.6 Hz → #ff6347 (Low Mid middle)
- 1000 Hz → #ff8c00 (Midrange middle)
- 2828.4 Hz → #32cd32 (Upper Mid middle)
- 4898.8 Hz → #1e90ff (Presence middle)
- 14000 Hz → #9370db (Brilliance middle)
- 20000 Hz → #e9acff (extreme Brilliance)

These are consistent with the band palette in `7band-Level-Meter-Report.md`, adding extremes for 20 Hz and 20 kHz.

## 7band-colormap QUALIA·NSS

| Band | Name | Frequency Range | Center Freq | Color Code |
|------|------|----------------|-------------|------------|
| 1 | Sub-bass | 20-60 Hz | 34.6 Hz | #8b0000 |
| 2 | Bass | 60-250 Hz | 122.5 Hz | #dc143c |
| 3 | Low Mid | 250-500 Hz | 353.6 Hz | #ff6347 |
| 4 | Midrange | 500-2000 Hz | 1000 Hz | #ff8c00 |
| 5 | Upper Mid | 2000-4000 Hz | 2828.4 Hz | #32cd32 |
| 6 | Presence | 4000-6000 Hz | 4898.8 Hz | #1e90ff |
| 7 | Brilliance | 6000-20000 Hz | 10954.5 Hz | #9370db |
| 8 | **Total** | **20-20000 Hz** | **Unfiltered** | **#808080** |


### Proposed Turbo-based 7-band colormap (QUALIA·NSS)

Derived from Google Research's Turbo colormap (see References). Colors are representative hex samples from the Turbo gradient, mapped low→high frequency along the Turbo scale. These can be fine-tuned with exact sampled stops if needed.

| Band | Name        | Center Freq | Turbo Color (hex) |
|------|-------------|-------------|-------------------|
| 1    | Sub-bass    | 34.6 Hz     | #30123b           |
| 2    | Bass        | 122.5 Hz    | #4145ab           |
| 3    | Low Mid     | 353.6 Hz    | #1ea1fa           |
| 4    | Midrange    | 1000 Hz     | #20c997           |
| 5    | Upper Mid   | 2828.4 Hz   | #f4e61e           |
| 6    | Presence    | 4898.8 Hz   | #f99e1a           |
| 7    | Brilliance  | 10954.5 Hz  | #d03a3f           |
| 8    | Total       | —           | #808080 (neutral) |

#### Turbo-based (reversed) mapping

For audio semantics red→low and violet→high, use Turbo reversed along frequency (low Hz gets the red end). Representative picks:

| Band | Name        | Center Freq | Turbo (reversed) |
|------|-------------|-------------|------------------|
| 1    | Sub-bass    | 34.6 Hz     | #d03a3f          |
| 2    | Bass        | 122.5 Hz    | #f99e1a          |
| 3    | Low Mid     | 353.6 Hz    | #f4e61e          |
| 4    | Midrange    | 1000 Hz     | #20c997          |
| 5    | Upper Mid   | 2828.4 Hz   | #1ea1fa          |
| 6    | Presence    | 4898.8 Hz   | #4145ab          |
| 7    | Brilliance  | 10954.5 Hz  | #30123b          |
| 8    | Total       | —           | #808080 (neutral) |

Notes:
- Turbo endpoints run from dark purple (#30123b) to deep red (#7a0403). For 20–20k Hz applications, the above picks spread across the palette to maximize discriminability while preserving Turbo’s ordering.
- If you prefer stronger high‑end contrast, consider using a lighter red at the top (e.g., #ea443c) or adding a near‑white accent just below the top octave.

## Interpolation

- Domain: 20–20000 Hz
- Interpolation axis: logarithmic frequency
- Given f, find bracketing anchors (fL, colorL) and (fR, colorR), compute:
  - t = (ln f − ln fL) / (ln fR − ln fL)
  - color(f) = lerp(colorL, colorR, t) in RGB

This ensures perceptual continuity by spacing by octaves rather than linear Hz.

## Slider Gradient (1/3‑Octave Stops)

The slider track background is a linear gradient composed of fine stops:
- Stops at every 1/3 octave from 20 Hz to 20 kHz using the interpolated color at that frequency.
- All anchors are also injected explicitly to guarantee exact color at anchors.
- Positions are mapped to slider space by the same log mapping used by the slider itself.

1/3‑octave ratio r = 2^(1/3) ≈ 1.259921. Sequence: 20, 25.2, 31.7, 40, …, 20k Hz.

## Implementation Notes

- File: `src/tests/index.js`
  - Anchors: `this._colormapAnchors`
  - Color query: `_colorForFreq(freq)`
  - Gradient generation: `_generateOneThirdOctaveStops()` → `_updateSliderGradient()`
  - Current thumb/accent color: `_updateToneUI()` sets `--tone-color`.
- Styling hook: `input#toneSlider` uses CSS variable `--tone-color` for accent; background is a linear‑gradient with computed stops.

## Rationale

- Honors predefined band colors at band centers (e.g., 40 Hz, 1 kHz, 14 kHz).
- Extends to extremes with darker sub‑bass and lighter brilliance for clear semantic endpoints.
- Log spacing (1/3‑octave) matches audio perception and provides a smooth, informative track.

## References

- Mikhailov, Anton (2019). "Turbo, An Improved Rainbow Colormap for Visualization." Google Research Blog, August 20, 2019. https://research.google/blog/turbo-an-improved-rainbow-colormap-for-visualization/

## Example

- 20 Hz → #2a0000
- 40 Hz → #8b0000
- 14 kHz → #9370db
- 20 kHz → #dcd1ff

These appear exactly on the slider due to the explicit anchors and log mapping.
