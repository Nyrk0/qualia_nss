We have the following loudspeaker setup:



Set A: 2 front stereo loudspeakers (frequency response ~100 Hz–20 kHz), positioned ~3.5 m in front of the listener, spaced ~2 m apart. Fundamental resonance (Fs) = 100 Hz.



Set B: 2 side/back stereo loudspeakers (frequency response ~50 Hz–2 kHz), positioned ~1 m to each side of the listener. Fundamental resonance (Fs) = 50 Hz, i.e., one octave below Set A (1/2 harmonic).



This configuration introduces an audio delay between Set A and Set B. That delay, combined with natural room reflections, produces both reverberation and comb-filtering effects.



Question:

Which audio measurement tools can reliably measure:



Reverberation (using a standard magnitude such as RT60 or similar)



Comb-filtering (detecting constructive/destructive interference and cancelled frequencies)



Time delay (in milliseconds between loudspeaker sets)



Requirements:



Should include a built-in signal generator (sine sweeps, pink noise, etc.) for playback through the loudspeakers.



Should allow measurement with a laptop or mobile device microphone (uncalibrated is acceptable).



Goal: detect delay, reverberation, and comb-filtering artifacts to validate the design — which deliberately avoids duplicating signals >2 kHz across sets (to reduce comb-filtering) while enhancing reverberation and spaciousness for a more natural surround sound, based on psychoacoustic principles.



Looking to what audio tool can we code into an webapp to fulfill requirements. 



Think.