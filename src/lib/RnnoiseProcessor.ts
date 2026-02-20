/**
 * RNNoise WASM processor wrapper.
 * Jitsi Meet implementasyonundan adapte edilmiştir.
 *
 * RNNoise: https://github.com/xiph/rnnoise
 * rnnoise-wasm: https://github.com/jitsi/rnnoise-wasm
 */

interface IRnnoiseModule extends EmscriptenModule {
  _rnnoise_create: () => number;
  _rnnoise_destroy: (context: number) => void;
  _rnnoise_process_frame: (context: number, input: number, output: number) => number;
}

/** RNNoise'un beklediği PCM sample sayısı (480 sample = 10ms @ 48kHz) */
export const RNNOISE_SAMPLE_LENGTH = 480;

/** Buffer boyutu (480 sample * 4 byte/float32) */
const RNNOISE_BUFFER_SIZE = RNNOISE_SAMPLE_LENGTH * 4;

/** 16-bit PCM dönüşümü için shift değeri */
const SHIFT_16_BIT = 32768;

/**
 * RNNoise WASM modülünü sarmalayan işlemci sınıfı.
 * PCM ses verisi üzerinde gürültü bastırma ve VAD (Voice Activity Detection) sağlar.
 */
export default class RnnoiseProcessor {
  private _context: number;
  private _destroyed = false;
  private _wasmInterface: IRnnoiseModule;
  private _wasmPcmInput: number;
  private _wasmPcmInputF32Index: number;

  constructor(wasmInterface: IRnnoiseModule) {
    try {
      this._wasmInterface = wasmInterface;
      this._wasmPcmInput = this._wasmInterface._malloc(RNNOISE_BUFFER_SIZE);
      this._wasmPcmInputF32Index = this._wasmPcmInput >> 2;

      if (!this._wasmPcmInput) {
        throw new Error('WASM input bellek tamponu oluşturulamadı!');
      }

      this._context = this._wasmInterface._rnnoise_create();
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  /** WASM kaynaklarını serbest bırakır */
  private _releaseWasmResources(): void {
    if (this._wasmPcmInput) {
      this._wasmInterface._free(this._wasmPcmInput);
    }
    if (this._context) {
      this._wasmInterface._rnnoise_destroy(this._context);
    }
  }

  /** RNNoise'un beklediği PCM sample sayısını döndürür */
  getSampleLength(): number {
    return RNNOISE_SAMPLE_LENGTH;
  }

  /** İşlemciyi yok eder ve kaynakları serbest bırakır */
  destroy(): void {
    if (this._destroyed) return;
    this._releaseWasmResources();
    this._destroyed = true;
  }

  /** İşlemcinin yok edilip edilmediğini kontrol eder */
  isDestroyed(): boolean {
    return this._destroyed;
  }

  /**
   * Ses çerçevesini işler, gürültü bastırma uygular ve VAD skoru döndürür.
   *
   * @param pcmFrame - 480 sample içeren Float32Array (giriş/çıkış)
   * @param shouldDenoise - true ise pcmFrame gürültüsü bastırılmış veriyle değiştirilir
   * @returns VAD skoru (0-1 arası, 1 = ses var)
   */
  processAudioFrame(pcmFrame: Float32Array, shouldDenoise = false): number {
    if (this._destroyed) return 0;

    // Float32 PCM'i 16-bit aralığına dönüştür (RNNoise formatı)
    for (let i = 0; i < RNNOISE_SAMPLE_LENGTH; i++) {
      this._wasmInterface.HEAPF32[this._wasmPcmInputF32Index + i] = pcmFrame[i] * SHIFT_16_BIT;
    }

    // RNNoise işlemi (aynı buffer giriş/çıkış olarak kullanılır)
    const vadScore = this._wasmInterface._rnnoise_process_frame(
      this._context,
      this._wasmPcmInput,
      this._wasmPcmInput
    );

    // Gürültüsü bastırılmış veriyi geri dönüştür
    if (shouldDenoise) {
      for (let i = 0; i < RNNOISE_SAMPLE_LENGTH; i++) {
        pcmFrame[i] = this._wasmInterface.HEAPF32[this._wasmPcmInputF32Index + i] / SHIFT_16_BIT;
      }
    }

    return vadScore;
  }
}
