/**
 * RNNoise WASM gürültü bastırma filtresi.
 * Mikrofon stream'ini RNNoise'dan geçirip temiz ses döndürür.
 *
 * Dengeli gürültü bastırma:
 * - RNNoise ML tabanlı gürültü temizleme
 * - VAD ile arka plan gürültüsü azaltma
 * - Konuşma korunur, gürültüler azaltılır
 */

// @ts-expect-error - rnnoise-wasm tip tanımları yok
import { createRNNWasmModule } from '@jitsi/rnnoise-wasm';
import RnnoiseProcessor, { RNNOISE_SAMPLE_LENGTH } from './RnnoiseProcessor';

/** RNNoise her zaman kullanılabilir */
export function isRnnoiseAvailable(): boolean {
  return true;
}

interface RnnoiseFilterHandle {
  (stream: MediaStream): Promise<MediaStream>;
  _processor?: RnnoiseProcessor;
  _audioContext?: AudioContext;
  _cleanup?: () => void;
}

/** VAD eşik değeri - bu değerin altında ses azaltılır (0.0-1.0) */
const VAD_THRESHOLD = 0.3;

/** Gürültü azaltma miktarı (VAD düşükken) */
const NOISE_REDUCTION_FACTOR = 0.15;

/**
 * RNNoise filtresi oluşturur.
 */
export async function createRnnoiseFilter(): Promise<RnnoiseFilterHandle | null> {
  try {
    // WASM modülünü yükle
    const wasmModule = await createRNNWasmModule();
    const processor = new RnnoiseProcessor(wasmModule);
    const denoiseSampleSize = processor.getSampleLength(); // 480

    // AudioContext oluştur (48kHz)
    const audioContext = new AudioContext({ sampleRate: 48000 });
    const destination = audioContext.createMediaStreamDestination();

    // Kaynak takibi
    let prevSource: MediaStreamAudioSourceNode | null = null;
    let prevScript: ScriptProcessorNode | null = null;

    const filter: RnnoiseFilterHandle = async (stream: MediaStream): Promise<MediaStream> => {
      // Önceki bağlantıları temizle
      if (prevSource) prevSource.disconnect();
      if (prevScript) prevScript.disconnect();
      prevSource = prevScript = null;

      // Ses kaynağı oluştur
      const source = audioContext.createMediaStreamSource(stream);
      prevSource = source;

      // Buffer'lar
      const inputBuffer: number[] = [];
      const outputBuffer: number[] = [];

      // ScriptProcessor
      const bufferSize = 2048;
      const scriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
      prevScript = scriptNode;

      scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
        const input = e.inputBuffer.getChannelData(0);
        const output = e.outputBuffer.getChannelData(0);

        // Input'u buffer'a ekle
        for (let i = 0; i < input.length; i++) {
          inputBuffer.push(input[i]);
        }

        // RNNoise frame'leri işle (480 sample)
        while (inputBuffer.length >= denoiseSampleSize) {
          // Frame'i çıkar
          const frame = new Float32Array(denoiseSampleSize);
          for (let i = 0; i < denoiseSampleSize; i++) {
            frame[i] = inputBuffer.shift()!;
          }

          // RNNoise gürültü bastırma + VAD skoru
          const vadScore = processor.processAudioFrame(frame, true);

          // VAD skoruna göre ses seviyesini ayarla
          // Yüksek VAD = tam ses, Düşük VAD = azaltılmış ses
          let gain: number;
          if (vadScore >= VAD_THRESHOLD) {
            // Konuşma algılandı - tam ses
            gain = 1.0;
          } else {
            // Gürültü - azaltılmış ses (tamamen kesmiyoruz)
            gain = NOISE_REDUCTION_FACTOR + (vadScore / VAD_THRESHOLD) * (1 - NOISE_REDUCTION_FACTOR);
          }

          // Output'a ekle
          for (let i = 0; i < denoiseSampleSize; i++) {
            outputBuffer.push(frame[i] * gain);
          }
        }

        // Output'a yaz
        for (let i = 0; i < output.length; i++) {
          if (outputBuffer.length > 0) {
            output[i] = outputBuffer.shift()!;
          } else {
            output[i] = 0;
          }
        }
      };

      // Bağlantıları kur
      source.connect(scriptNode);
      scriptNode.connect(destination);

      // Track bittiğinde temizle
      stream.getAudioTracks()[0]?.addEventListener('ended', () => {
        scriptNode.disconnect();
        source.disconnect();
      });

      console.log('[RNNoise] Gürültü bastırma filtresi aktif');
      return destination.stream;
    };

    // Cleanup fonksiyonu
    filter._processor = processor;
    filter._audioContext = audioContext;
    filter._cleanup = () => {
      if (prevSource) prevSource.disconnect();
      if (prevScript) prevScript.disconnect();
      processor.destroy();
      audioContext.close();
    };

    return filter;
  } catch (err) {
    console.error('[RNNoise] Filtre oluşturulamadı:', err);
    return null;
  }
}

/**
 * RNNoise filtresi ile oluşturulmuş handle'ı serbest bırakır.
 */
export async function releaseRnnoiseFilter(
  filter: RnnoiseFilterHandle | null
): Promise<void> {
  if (!filter) return;

  try {
    filter._cleanup?.();
    filter._processor?.destroy();
    await filter._audioContext?.close();
  } catch (e) {
    console.warn('[RNNoise] release:', e);
  }
}
