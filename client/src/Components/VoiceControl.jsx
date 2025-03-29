"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VoiceControl = ({ isListening, setIsListening, onCommand }) => {
  useEffect(() => {
    let recognition = null;

    if ("webkitSpeechRecognition" in window) {
      recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true; // Enable continuous listening
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        // Provide audio feedback only when manually activated
        if (!isListening) {
          const utterance = new SpeechSynthesisUtterance(
            "Voice control activated"
          );
          utterance.volume = 0.5;
          window.speechSynthesis.speak(utterance);
        }
      };

      recognition.onend = () => {
        // Restart recognition only if isListening is true and recognition was not manually stopped
        if (isListening) {
          recognition.start();
        }
      };

      recognition.onresult = (event) => {
        const command =
          event.results[event.results.length - 1][0].transcript.toLowerCase();
        onCommand(command);
        // Provide command feedback
        const utterance = new SpeechSynthesisUtterance(`Executing: ${command}`);
        utterance.volume = 0.5;
        window.speechSynthesis.speak(utterance);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }

    if (isListening && recognition) {
      recognition.start();
    }

    return () => {
      if (recognition) {
        recognition.onend = null; // Prevent onend from restarting recognition
        recognition.stop();
        // Provide stop feedback only when manually deactivated
        if (isListening) {
          const utterance = new SpeechSynthesisUtterance(
            "Voice control deactivated"
          );
          utterance.volume = 0.5;
          window.speechSynthesis.speak(utterance);
        }
      }
    };
  }, [isListening, onCommand]);

  return (
    <motion.button
      onClick={() => setIsListening(!isListening)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
        isListening ? "bg-teal-500" : "bg-slate-700"
      } text-white hover:opacity-90 transition-all duration-300 relative overflow-hidden`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {isListening && (
          <motion.div
            className="absolute inset-0 bg-teal-600 opacity-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 2,
            }}
          />
        )}
      </AnimatePresence>

      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 relative z-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        animate={isListening ? { scale: [1, 1.2, 1] } : {}}
        transition={
          isListening ? { repeat: Number.POSITIVE_INFINITY, duration: 1.5 } : {}
        }
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </motion.svg>
      <span className="relative z-10">
        {isListening ? "Listening..." : "Enable Voice Commands"}
      </span>

      {isListening && (
        <motion.div
          className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 bg-white rounded-full"
              animate={{
                height: ["6px", "12px", "6px"],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 0.8,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.button>
  );
};

export default VoiceControl;
