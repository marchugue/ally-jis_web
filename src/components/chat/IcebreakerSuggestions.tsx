import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IcebreakerSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  onDismiss: () => void;
}

export function IcebreakerSuggestions({ suggestions, onSelect, onDismiss }: IcebreakerSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 pb-2">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white/80 backdrop-blur-sm border border-[#1A6B3C]/10 rounded-2xl p-3 shadow-lg shadow-[#1A6B3C]/5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A6B3C] uppercase tracking-wider">
              <Sparkles size={12} className="text-[#E8A838]" />
              Icebreakers
            </div>
            <button
              onClick={onDismiss}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Dismiss suggestions"
            >
              <X size={14} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(suggestion)}
                className="bg-[#1A6B3C]/5 hover:bg-[#1A6B3C]/10 border border-[#1A6B3C]/10 text-[#1A6B3C] text-xs font-medium py-2 px-3.5 rounded-full transition-all text-left max-w-full"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
