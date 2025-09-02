# Understanding dBFS in Digital Audio Systems

## dBFS Overview

dBFS (decibels full scale) is a unit of measurement in digital audio systems that quantifies the amplitude of a signal relative to the maximum possible level before clipping occurs. The scale is referenced to 0 dBFS, which represents the highest signal level a digital system can handle without introducing distortion.

### Key Points

-   **Digital Scale**: dBFS measures signal levels within digital audio environments, with 0 dBFS as the absolute maximum before clipping causes audible distortion.
-   **Negative Values**: Signals below the maximum are expressed as negative values (e.g., -6 dBFS, -12 dBFS), indicating their distance from the maximum threshold.
-   **Clipping Prevention**: Monitoring dBFS levels is essential for audio engineers to keep signals below 0 dBFS, ensuring clean audio without distortion.
-   **Microphone Context**: In recording setups, dBFS reflects the digitized output of a microphone after analog-to-digital conversion, typically displayed in digital audio workstations (DAWs).
-   **Microphone Sensitivity**: Microphones vary in sensitivity, impacting the amount of gain needed to achieve optimal dBFS levels. More sensitive microphones require less gain to reach desired levels.
-   **Practical Use**: dBFS is crucial for setting appropriate input levels during recording or mixing to maintain high-quality, undistorted audio.

### Sources

-   [Sound on Sound: Understanding dBFS](https://www.soundonsound.com/techniques/understanding-dbfs)
-   [Pro Audio Files: Digital Audio Levels and dBFS](https://theproaudiofiles.com/digital-audio-levels-dbfs/)
-   [Sweetwater: What is dBFS?](https://www.sweetwater.com/insync/dbfs/)

**Last Updated**: August 3, 2025, 11:01 PM EDT

---

## Understanding dBFS in REW (Room EQ Wizard)

Room EQ Wizard (REW) is a software tool used for measuring and analyzing audio systems, including room acoustics and microphone performance. To understand how REW calibrates decibels full scale (dBFS) to show internal microphone reading levels, such as those from a MacBook’s built-in microphone, we need to explore the calibration process and how dBFS relates to the microphone’s input levels. Since the MacBook’s internal microphone is a digital MEMS microphone, the process involves both the microphone’s characteristics and REW’s calibration procedures.

### dBFS Definition in REW

dBFS (decibels relative to full scale) is a unit of measurement for amplitude levels in digital audio systems, where 0 dBFS represents the maximum possible digital signal level before clipping occurs. All dBFS values are negative or zero, indicating how far below the maximum level a signal is (e.g., -6 dBFS is 50% of the maximum amplitude).

### REW’s Use of dBFS

In REW, the SPL meter displays the input level from the microphone in dBFS, reflecting the digital signal level captured by the soundcard or microphone. This is shown as a peak level (red bar) and RMS level (numeric indicator and colored bar) on the SPL meter.

### MacBook’s Internal Microphone

The MacBook’s built-in microphone is typically a digital MEMS microphone with a sensitivity often specified around -26 dBFS at 94 dB SPL (a standard reference level, equivalent to 1 Pa). This means that a 94 dB SPL sound produces a digital output of -26 dBFS in the audio system.

## Calibration Process in REW for Internal Microphone

To display accurate sound pressure level (SPL) readings from a MacBook’s internal microphone, REW requires calibration to map the digital dBFS levels to physical SPL values. Here’s how this is typically done:

### Soundcard Preferences Setup

-   In REW, open the Soundcard Preferences panel and select the MacBook’s internal microphone as the input device. For a MacBook, this is usually listed as “Built-in Microphone” in macOS audio settings.
-   REW sets the input volume control to unity gain (0 dB) by default for USB or built-in digital microphones, as these devices typically have fixed or limited gain control. This ensures the microphone’s raw digital output is used without additional software amplification.
-   If the “Control input volume” box is ticked in REW’s Soundcard Preferences, REW automatically manages the input gain. For MacBook microphones, this is often left at unity, as macOS may not allow fine-grained control over the internal mic’s gain.

### Checking Levels

-   In the Soundcard Preferences, click the `Check Levels` button. REW generates a test signal (e.g., a pink noise or sine wave) at a default RMS level of -12 dBFS through the selected output (e.g., MacBook speakers or an external device).
-   The internal microphone captures this signal, and REW displays the input level in dBFS on the SPL meter. For a USB or digital microphone like the MacBook’s, REW notes that input levels may be low (e.g., below -50 dBFS), which is normal due to the microphone’s sensitivity and lack of preamp gain.
-   The goal is to ensure the input level is within an acceptable range, typically -30 to -12 dBFS for analog mics, but digital mics like the MacBook’s may show lower levels (e.g., -50 dBFS or below). If levels are too low, you may need to increase the output volume or move the sound source closer to the microphone.

### SPL Calibration

To convert dBFS readings to SPL, REW requires an absolute SPL reference, typically obtained using an external SPL meter or a calibrator. However, for a MacBook’s internal microphone, calibration is more challenging because Apple does not provide detailed sensitivity specifications (e.g., dBFS at 94 dB SPL).

#### Manual Calibration with an External SPL Meter

1.  Play a steady test signal (e.g., a 1 kHz tone or pink noise) through a speaker at a known SPL (e.g., 94 dB SPL, measured with a calibrated SPL meter placed near the MacBook’s microphone).
2.  Open the REW SPL Meter (via the toolbar) and click the `Calibrate` button. Select the option to calibrate using an external test signal or a speaker driven by REW’s calibration signal.
3.  Enter the SPL reading from the external meter into REW’s calibration dialog. REW uses this to calculate an offset that maps the microphone’s dBFS input level to the corresponding SPL. For example, if the MacBook mic shows -26 dBFS for a 94 dB SPL input, REW stores this sensitivity data to adjust future readings.

#### Using a Calibration File

-   If the microphone’s sensitivity is known (e.g., -26 dBFS at 94 dB SPL, as is typical for some MEMS mics), you can create a calibration file for REW. Add a line at the start of the file, such as `Sensitivity -26 dBFS`, indicating the dBFS level at 94 dB SPL.
-   Load this file in REW’s Mic/Meter settings. REW uses the sensitivity data to automatically calculate the SPL calibration offset without needing an external meter. However, this assumes the sensitivity value is accurate for the MacBook’s specific microphone, which may not be publicly documented.

### Displaying SPL Readings

-   Once calibrated, REW displays the maximum SPL that can be measured with the current input settings.
-   For higher SPLs, you’d need to reduce input sensitivity (if possible) or adjust the external SPL meter’s range and recalibrate.
-   REW’s SPL meter corrects the dBFS input levels using the calibration offset and any loaded microphone calibration file. The meter displays SPL in dB (e.g., 75 dB SPL) rather than raw dBFS, accounting for the microphone’s sensitivity and the soundcard’s gain.
-   The meter shows real-time SPL, equivalent sound level (Leq), or sound exposure level (LE), with options for Fast (125 ms) or Slow (1 s) time constants and frequency weightings (e.g., A, C, or Z).
-   For a MacBook’s internal mic, the displayed SPL is accurate only if the calibration was done correctly and the input gain settings remain unchanged. Changes to macOS audio settings or apps using the microphone (e.g., Zoom) may alter the input gain, requiring recalibration.

## Specifics for MacBook’s Internal Microphone

-   **Sensitivity and dBFS**: Without Apple’s official specs, we can estimate based on typical MEMS microphones. A sensitivity of -26 dBFS at 94 dB SPL means that for every 1 dB change in SPL, the dBFS level changes by 1 dB (e.g., 120 dB SPL = 0 dBFS, 68 dB SPL = -52 dBFS).
-   **Dynamic Range**: The MacBook’s microphone likely has a dynamic range of 60–90 dB, capable of capturing sounds from ~30 dB SPL (quiet speech) to ~120 dB SPL (loud sounds, near clipping). In REW, this translates to dBFS levels from ~-90 dBFS (noise floor) to 0 dBFS.
-   **Challenges**: The MacBook’s internal mic may be affected by macOS audio processing (e.g., automatic gain control, noise suppression), which can alter dBFS readings. Disable these features in macOS Sound Settings or third-party apps if possible. Additionally, the mic’s high-pass filter (cutting below ~250 Hz) may affect low-frequency measurements.

## Example Calibration Workflow

1.  **Setup**: In REW, select the MacBook’s internal microphone as the input. Ensure no other apps are using the mic.
2.  **Check Levels**: Play a -12 dBFS test signal through a speaker. In REW’s Soundcard Preferences, verify the input level is within -50 to -12 dBFS (typical for digital mics). Adjust speaker volume or distance if needed.
3.  **Calibrate SPL**:
    -   Use an external SPL meter to measure a 94 dB SPL tone at the MacBook’s mic.
    -   In REW’s SPL Meter, enter the 94 dB SPL value during calibration. If the mic reads -26 dBFS, REW calculates the offset (e.g., 94 - (-26) = 120 dB SPL at 0 dBFS).
    -   Alternatively, create a calibration file with `Sensitivity -26 dBFS` and load it in REW.
4.  **Measure**: Run measurements in REW. The SPL meter now displays accurate SPL values, adjusted from dBFS based on the calibration.

### Notes

-   **Accuracy Limitations**: Without an external SPL meter or precise sensitivity data, calibration is approximate. The MacBook’s mic is not a professional measurement tool, so results may vary due to its frequency response and environmental factors.
-   **Verification**: To confirm calibration, play a known SPL level (e.g., 80 dB SPL) and check if REW’s SPL meter matches. If not, adjust the calibration offset or recheck the setup.
-   **Software Conflicts**: macOS updates or apps like Teams may alter mic gain, affecting dBFS readings. Close conflicting apps and recheck levels.

---

If you have an external SPL meter or specific sensitivity data for the MacBook’s microphone, please share, and I can provide a more tailored calibration process!