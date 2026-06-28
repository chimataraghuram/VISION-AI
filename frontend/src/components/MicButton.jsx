/**
 * MicButton Component
 * Microphone recording toggle using Web Speech API.
 * Calls onTranscript(text) when speech ends.
 */
import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

export default function MicButton({ onTranscript, onError, disabled = false }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    // Check browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        transcriptRef.current += ' ' + finalTranscript;
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      const transcript = transcriptRef.current.trim();
      if (transcript && onTranscript) {
        onTranscript(transcript);
      }
      transcriptRef.current = '';
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      transcriptRef.current = '';

      if (onError) {
        const messages = {
          'no-speech': 'No speech detected. Please speak clearly and try again.',
          'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
          'network': 'Network error during speech recognition. Please check your connection.',
        };
        onError(messages[event.error] || `Speech error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, [onTranscript, onError]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      transcriptRef.current = '';
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-100 rounded-lg text-surface-500 text-sm">
        <MicOff className="w-4 h-4" />
        <span>Speech not supported in this browser. Use Chrome.</span>
      </div>
    );
  }

  return (
    <button
      onClick={toggleListening}
      disabled={disabled}
      className={`flex items-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm
        ${isListening
          ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
          : 'bg-primary-600 hover:bg-primary-700 text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isListening ? 'Click to stop recording' : 'Click to start recording'}
    >
      {isListening ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Recording... (click to stop)</span>
        </>
      ) : (
        <>
          <Mic className="w-5 h-5" />
          <span>Start Recording</span>
        </>
      )}
    </button>
  );
}
