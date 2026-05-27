'use client';
import { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface Props {
  onTranscript: (text: string) => void;
}

type AnySpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: { [key: number]: { [key: number]: { transcript: string } }; length: number } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function VoiceInput({ onTranscript }: Props) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<AnySpeechRecognition | null>(null);

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const w = window as unknown as Record<string, new () => AnySpeechRecognition>;
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (e) => {
      const transcript = Array.from({ length: e.results.length })
        .map((_, i) => e.results[i][0].transcript)
        .join(' ');
      onTranscript(transcript);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Stop listening' : 'Speak to fill'}
      className={`p-1.5 rounded-full transition-colors ${listening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'}`}
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  );
}
