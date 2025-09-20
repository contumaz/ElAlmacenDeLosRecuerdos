import { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export const useTranscription = () => {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    setIsTranscribing(listening);
  }, [listening]);

  const startTranscription = () => {
    if (browserSupportsSpeechRecognition) {
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const stopTranscription = () => {
    if (browserSupportsSpeechRecognition) {
      SpeechRecognition.stopListening();
    }
  };

  return {
    transcript,
    isTranscribing,
    startTranscription,
    stopTranscription,
    resetTranscript,
    hasRecognitionSupport: browserSupportsSpeechRecognition,
  };
};