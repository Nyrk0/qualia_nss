/**
 * Fast Fourier Transform (FFT) Implementation
 * 
 * A radix-2 Cooley-Tukey FFT implementation for real-valued signals.
 * Used for cepstrum analysis in comb-filtering detection.
 */

export class FFT {
  /**
   * Create a new FFT instance
   * @param {number} size - FFT size (must be a power of 2)
   */
  constructor(size) {
    this.size = size;
    this.table = this._makeTable(size);
  }
  
  /**
   * Create twiddle factor lookup table
   * @private
   */
  _makeTable(size) {
    const table = new Array(size * 2);
    for (let i = 0; i < size; i++) {
      const angle = -Math.PI * i / size;
      table[i * 2] = Math.cos(angle);     // Real part
      table[i * 2 + 1] = Math.sin(angle); // Imaginary part
    }
    return table;
  }
  
  /**
   * Compute the FFT of a real-valued signal
   * @param {Float32Array} inR - Input signal (real part)
   * @param {Float32Array} [outR] - Output real part (optional)
   * @param {Float32Array} [outI] - Output imaginary part (optional)
   * @returns {Object} Object with 're' and 'im' properties for real and imaginary parts
   */
  realTransform(inR, outR, outI) {
    const n = this.size;
    const table = this.table;
    
    // Initialize output arrays if not provided
    if (!outR) outR = new Float32Array(n);
    if (!outI) outI = new Float32Array(n);
    
    // Bit-reverse copy
    const bits = Math.log2(n);
    for (let i = 0; i < n; i++) {
      const j = this._reverseBits(i, bits);
      outR[j] = inR[i];
      outI[j] = 0;
    }
    
    // Cooley-Tukey FFT
    for (let s = 1; s <= bits; s++) {
      const m = 1 << s;
      const m2 = m >> 1;
      
      for (let k = 0; k < n; k += m) {
        for (let j = 0; j < m2; j++) {
          // Twiddle factor
          const idx = j * n / m * 2;
          const twR = table[idx];
          const twI = table[idx + 1];
          
          // Butterfly operation
          const tR = outR[k + j + m2] * twR - outI[k + j + m2] * twI;
          const tI = outR[k + j + m2] * twI + outI[k + j + m2] * twR;
          
          const uR = outR[k + j];
          const uI = outI[k + j];
          
          outR[k + j] = uR + tR;
          outI[k + j] = uI + tI;
          outR[k + j + m2] = uR - tR;
          outI[k + j + m2] = uI - tI;
        }
      }
    }
    
    return { re: outR, im: outI };
  }
  
  /**
   * Reverse the bits of an integer
   * @private
   */
  _reverseBits(x, bits) {
    let y = 0;
    for (let i = 0; i < bits; i++) {
      y = (y << 1) | (x & 1);
      x >>>= 1;
    }
    return y;
  }
  
  /**
   * Compute the inverse FFT
   * @param {Float32Array} inR - Input real part
   * @param {Float32Array} inI - Input imaginary part
   * @param {Float32Array} [outR] - Output real part (optional)
   * @param {Float32Array} [outI] - Output imaginary part (optional)
   * @returns {Object} Object with 're' and 'im' properties for real and imaginary parts
   */
  inverseTransform(inR, inI, outR, outI) {
    const n = this.size;
    
    // Conjugate the input
    const conjI = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      conjI[i] = -inI[i];
    }
    
    // Compute forward FFT of conjugated input
    const result = this.realTransform(conjI, outR, outI);
    
    // Conjugate and scale the result
    const scale = 1 / n;
    for (let i = 0; i < n; i++) {
      result.re[i] *= scale;
      result.im[i] *= -scale;
    }
    
    return result;
  }
}
