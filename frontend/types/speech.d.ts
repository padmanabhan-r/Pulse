// Minimal Web Speech API typings used by lib/live-audio.ts
declare global {
  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }
  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    length: number;
    isFinal: boolean;
  }
  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((this: SpeechRecognition, ev: Event) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
  }
  // eslint-disable-next-line no-var
  var SpeechRecognition: SpeechRecognitionConstructor | undefined;
}
export {};
