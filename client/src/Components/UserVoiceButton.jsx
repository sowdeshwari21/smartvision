"use client";
import { motion } from "framer-motion";

const UserVoiceButton = ({ isListening, setIsListening }) => {
  const toggleVoiceCommands = () => {
    setIsListening(!isListening);
  };

  return (
    <motion.button
      onClick={toggleVoiceCommands}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
        isListening ? "bg-amber-500" : "bg-slate-600"
      } text-white hover:opacity-90 transition-all duration-300`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        animate={isListening ? { rotate: [0, 15, -15, 0] } : {}}
        transition={
          isListening ? { repeat: Number.POSITIVE_INFINITY, duration: 1.5 } : {}
        }
      >
        {isListening ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 9v6m4-6v6m-7 4h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-5.197-3.07A1 1 0 008 9v6a1 1 0 001.555.832l5.197-3.07a1 1 0 000-1.664z"
          />
        )}
      </motion.svg>
      <span>
        {isListening ? "Deactivate Voice Commands" : "Activate Voice Commands"}
      </span>
      {isListening && (
        <motion.span
          className="absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-red-500 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 1.5,
          }}
        />
      )}
    </motion.button>
  );
};

export default UserVoiceButton;
