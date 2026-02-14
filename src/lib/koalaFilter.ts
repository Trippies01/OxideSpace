/**
 * Picovoice Koala gürültü bastırma filtresi.
 * Mikrofon stream'ini Koala'dan geçirip temiz ses döndürür.
 *
 * Kurulum:
 * 1. https://console.picovoice.ai/ adresinden Access Key alın.
 * 2. Koala model dosyasını (koala_params.pv) indirip public/ klasörüne koyun.
 * 3. .env.local içinde VITE_PICOVOICE_ACCESS_KEY=your_key tanımlayın.
 */

import { KoalaWorker } from '@picovoice/koala-web';

const ACCESS_KEY = import.meta.env.VITE_PICOVOICE_ACCESS_KEY as string | undefined;
const MODEL_PATH = (import.meta.env.VITE_KOALA_MODEL_PATH as string) || '/koala_params.pv';

export function isKoalaAvailable(): boolean {
  return !!ACCESS_KEY && ACCESS_KEY.length > 0;
}

/**
 * Koala filtresi oluşturur. Access key yoksa null döner (filtre uygulanmaz).
 * Dönen fonksiyon: (stream) => işlenmiş MediaStream.
 * İşlem bittiğinde releaseKoalaFilter(handle) ile kaynakları serbest bırakın.
 */
export async function createKoalaFilter(): Promise<((stream: MediaStream) => Promise<MediaStream>) | null> {
  if (!isKoalaAvailable()) return null;

  try {
    const ctx = new AudioContext();
    const dest = ctx.createMediaStreamDestination();
    let nextStartTime = ctx.currentTime;
    let outSampleRate = 16000;

    const koala = await KoalaWorker.create(
      ACCESS_KEY!,
      (enhancedPcm: Int16Array) => {
        if (ctx.state === 'closed') return;
        const sr = outSampleRate;
        const duration = enhancedPcm.length / sr;
        const buffer = ctx.createBuffer(1, enhancedPcm.length, sr);
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < enhancedPcm.length; i++) channel[i] = enhancedPcm[i] / 32768;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(dest);
        source.start(nextStartTime);
        nextStartTime += duration;
      },
      { publicPath: MODEL_PATH },
      { processErrorCallback: (err) => console.warn('[Koala]', err) }
    );

    outSampleRate = koala.sampleRate;
    const frameLength = koala.frameLength;
    const sampleRate = koala.sampleRate;
    const inputSampleRate = ctx.sampleRate;
    const ratio = inputSampleRate / sampleRate; // örn. 48000/16000 = 3
    const frameBuffer: number[] = [];

    let prevSource: MediaStreamAudioSourceNode | null = null;
    let prevScript: ScriptProcessorNode | null = null;
    let prevGain: GainNode | null = null;

    const filter = (stream: MediaStream): Promise<MediaStream> => {
      return new Promise((resolve, reject) => {
        if (prevSource) prevSource.disconnect();
        if (prevScript) prevScript.disconnect();
        if (prevGain) prevGain.disconnect();
        prevSource = prevScript = prevGain = null;

        const source = ctx.createMediaStreamSource(stream);
        prevSource = source;
        const bufferSize = 4096;
        const scriptNode = ctx.createScriptProcessor(bufferSize, 1, 1);
        prevScript = scriptNode;
        const gain = ctx.createGain();
        prevGain = gain;
        gain.gain.value = 0;
        source.connect(scriptNode);
        scriptNode.connect(gain);
        gain.connect(dest);

        scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
          const input = e.inputBuffer.getChannelData(0);
          for (let i = 0; i < input.length; i += ratio) {
            const idx = Math.floor(i / ratio);
            if (idx >= input.length) break;
            const s = Math.max(-1, Math.min(1, input[Math.floor(i)]));
            frameBuffer.push(s * 32767);
            if (frameBuffer.length >= frameLength) {
              const frame = new Int16Array(frameLength);
              for (let j = 0; j < frameLength; j++) frame[j] = Math.max(-32768, Math.min(32767, Math.round(frameBuffer[j])));
              frameBuffer.splice(0, frameLength);
              try {
                koala.process(frame);
              } catch (err) {
                console.warn('[Koala] process:', err);
              }
            }
          }
        };

        stream.getAudioTracks()[0]?.addEventListener('ended', () => {
          scriptNode.disconnect();
          gain.disconnect();
          source.disconnect();
        });

        resolve(dest.stream);
      });
    };

    (filter as (stream: MediaStream) => Promise<MediaStream> & { _koala?: KoalaWorker })._koala = koala;
    return filter;
  } catch (err) {
    console.warn('[Koala] Filtre oluşturulamadı:', err);
    return null;
  }
}

/** Koala filtresi ile oluşturulmuş handle'ı serbest bırakır (opsiyonel; sayfa kapanınca da bırakılır). */
export async function releaseKoalaFilter(
  filter: ((stream: MediaStream) => Promise<MediaStream>) | null
): Promise<void> {
  const koala = (filter as (stream: MediaStream) => Promise<MediaStream> & { _koala?: KoalaWorker })?._koala;
  if (koala) {
    try {
      await koala.release();
    } catch (e) {
      console.warn('[Koala] release:', e);
    }
  }
}
