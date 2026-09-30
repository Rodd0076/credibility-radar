import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { blink } from '@/lib/blink';

const MAX_RECORDING_MS = 90_000;
type CaptureState = 'idle' | 'recording' | 'transcribing';

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Voice transcription failed. Please try again.';
}

function blobToDataUrl(blob: any): Promise<string> {
  const FileReaderConstructor = (globalThis as any).FileReader;
  if (!FileReaderConstructor) return Promise.reject(new Error('This browser cannot read audio recordings.'));

  return new Promise((resolve, reject) => {
    const reader = new FileReaderConstructor();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Could not read the voice recording.'));
    reader.onerror = () => reject(new Error('Could not read the voice recording.'));
    reader.readAsDataURL(blob);
  });
}

export function useVoiceTranscription(onTranscript: (text: string) => void, enabled: boolean) {
  const [state, setState] = useState<CaptureState>('idle');
  const [error, setError] = useState<string | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const mountedRef = useRef(true);
  const webRecorderRef = useRef<any>(null);
  const webStreamRef = useRef<any>(null);
  const webChunksRef = useRef<any[]>([]);
  const nativeRecordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const transcribe = useCallback(async (audio: string | ArrayBuffer) => {
    if (mountedRef.current) setState('transcribing');
    try {
      const { text } = await blink.ai.transcribeAudio({ audio, language: 'en' });
      if (!mountedRef.current) return;
      const transcript = text.trim();
      if (!transcript) throw new Error('No speech was detected. Try recording again.');
      onTranscriptRef.current(transcript);
      setError(null);
    } catch (e) {
      if (mountedRef.current) setError(errorMessage(e));
    } finally {
      if (mountedRef.current) setState('idle');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;

    if (Platform.OS === 'web') {
      const recorder = webRecorderRef.current;
      if (recorder?.state === 'recording') recorder.stop();
      return;
    }

    const recording = nativeRecordingRef.current;
    nativeRecordingRef.current = null;
    if (!recording) return;
    if (mountedRef.current) setState('transcribing');

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const uri = recording.getURI();
      if (!uri) throw new Error('The recording could not be opened.');
      const response = await fetch(uri);
      if (!response.ok) throw new Error('Could not read the voice recording.');
      await transcribe(await response.arrayBuffer());
    } catch (e) {
      if (mountedRef.current) {
        setError(errorMessage(e));
        setState('idle');
      }
    }
  }, [transcribe]);

  const startRecording = useCallback(async () => {
    if (!enabled || state !== 'idle') return;
    setError(null);

    try {
      if (Platform.OS === 'web') {
        const browser = globalThis as any;
        if (!browser.navigator?.mediaDevices?.getUserMedia || !browser.MediaRecorder) {
          throw new Error('Voice recording is not supported in this browser.');
        }
        const stream = await browser.navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new browser.MediaRecorder(stream);
        webStreamRef.current = stream;
        webRecorderRef.current = recorder;
        webChunksRef.current = [];
        recorder.ondataavailable = (event: any) => {
          if (event.data?.size) webChunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          webStreamRef.current?.getTracks().forEach((track: any) => track.stop());
          webStreamRef.current = null;
          webRecorderRef.current = null;
          const chunks = webChunksRef.current;
          webChunksRef.current = [];
          if (!mountedRef.current) return;
          if (!chunks.length) {
            setError('No voice data was captured. Try recording again.');
            setState('idle');
            return;
          }
          const BlobConstructor = (globalThis as any).Blob;
          const blob = new BlobConstructor(chunks, {
            type: recorder.mimeType || chunks[0]?.type || 'audio/webm',
          });
          void blobToDataUrl(blob).then(transcribe).catch((e) => {
            if (mountedRef.current) {
              setError(errorMessage(e));
              setState('idle');
            }
          });
        };
        recorder.start();
      } else {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) throw new Error('Allow microphone access to record voice.');
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await recording.startAsync();
        nativeRecordingRef.current = recording;
      }

      setState('recording');
      timerRef.current = setTimeout(() => { void stopRecording(); }, MAX_RECORDING_MS);
    } catch (e) {
      webStreamRef.current?.getTracks().forEach((track: any) => track.stop());
      webStreamRef.current = null;
      nativeRecordingRef.current = null;
      setState('idle');
      setError(errorMessage(e));
    }
  }, [enabled, state, stopRecording, transcribe]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (webRecorderRef.current?.state === 'recording') {
        webRecorderRef.current.onstop = null;
        webRecorderRef.current.stop();
      }
      webStreamRef.current?.getTracks().forEach((track: any) => track.stop());
      void nativeRecordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  return { state, error, startRecording, stopRecording };
}
