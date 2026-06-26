import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Student } from '@/types/ally';

interface IcebreakerHookProps {
  messages: Message[];
  currentUser: Student;
  otherUser: {
    id: string;
    interests?: string[];
    course?: string;
  };
  onSendIcebreaker: (content: string) => void;
}

const IDLE_TIME_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours in ms
const RANDOM_TRIGGER_RANGE = { min: 10, max: 15 };

const HOT_TAKES = [
  "Pineapple on pizza: Masterpiece or mistake?",
  "Is cereal a soup?",
  "Is a hotdog a sandwich?",
  "Which is better: Night owl or Early bird?",
  "Android vs iOS: Let's settle this.",
  "What's your most controversial food opinion?",
  "Is water wet?"
];

const WOULD_YOU_RATHER = [
  "Would you rather always be 10 minutes late or 20 minutes early?",
  "Would you rather have unlimited free food or unlimited free travel?",
  "Would you rather be able to talk to animals or speak every human language?",
  "Would you rather live in a world with no music or no movies?",
  "Would you rather have a pause or a rewind button in your life?"
];

export function useIcebreakers({ messages, currentUser, otherUser, onSendIcebreaker }: IcebreakerHookProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastIcebreakerMessageCountRef = useRef(0);
  const nextRandomTriggerRef = useRef(Math.floor(Math.random() * (RANDOM_TRIGGER_RANGE.max - RANDOM_TRIGGER_RANGE.min + 1)) + RANDOM_TRIGGER_RANGE.min);

  // Reset state when otherUser changes
  useEffect(() => {
    setSuggestions([]);
    setIsDismissed(false);
    lastIcebreakerMessageCountRef.current = messages.length;
    nextRandomTriggerRef.current = Math.floor(Math.random() * (RANDOM_TRIGGER_RANGE.max - RANDOM_TRIGGER_RANGE.min + 1)) + RANDOM_TRIGGER_RANGE.min;
  }, [otherUser.id]);

  const getSharedInterestQuestions = useCallback(() => {
    const otherInterests = otherUser.interests || [];
    const shared = currentUser.interests.filter(i => otherInterests.includes(i));
    const questions: string[] = [];
    
    if (shared.length > 0) {
      shared.slice(0, 2).forEach(interest => {
        questions.push(`How did you get into ${interest}?`);
      });
    }

    if (otherUser.course) {
      if (currentUser.course === otherUser.course) {
        questions.push(`What's the hardest part about studying ${currentUser.course}?`);
      } else {
        questions.push(`What's it like being in the ${otherUser.course} program?`);
      }
    } else {
      questions.push("What are you currently studying at Alijis?");
    }

    return questions.slice(0, 3);
  }, [currentUser, otherUser]);

  const getRandomTrigger = useCallback(() => {
    const combined = [...HOT_TAKES, ...WOULD_YOU_RATHER];
    return combined[Math.floor(Math.random() * combined.length)];
  }, []);

  // Trigger 1: First Conversation
  useEffect(() => {
    if (messages.length === 0 && !isDismissed) {
      setSuggestions(getSharedInterestQuestions());
    }
  }, [messages.length, getSharedInterestQuestions, isDismissed]);

  // Trigger 2: Idle Time
  useEffect(() => {
    if (messages.length === 0 || isDismissed) return;

    const lastMessage = messages[messages.length - 1];
    const lastTime = new Date(lastMessage.createdAt || lastMessage.timestamp).getTime();
    
    const checkIdle = () => {
      const now = Date.now();
      if (now - lastTime >= IDLE_TIME_THRESHOLD) {
        setSuggestions([getRandomTrigger()]);
      }
    };

    const timer = setInterval(checkIdle, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [messages, getRandomTrigger, isDismissed]);

  // Trigger 3: Random Mid-Conversation
  useEffect(() => {
    if (messages.length === 0) return;

    const currentCount = messages.length;
    const diff = currentCount - lastIcebreakerMessageCountRef.current;

    if (diff >= nextRandomTriggerRef.current) {
      setSuggestions([getRandomTrigger()]);
      setIsDismissed(false);
      lastIcebreakerMessageCountRef.current = currentCount;
      nextRandomTriggerRef.current = Math.floor(Math.random() * (RANDOM_TRIGGER_RANGE.max - RANDOM_TRIGGER_RANGE.min + 1)) + RANDOM_TRIGGER_RANGE.min;
    }
  }, [messages.length, getRandomTrigger]);

  const dismiss = () => {
    setSuggestions([]);
    setIsDismissed(true);
  };

  const select = (question: string) => {
    onSendIcebreaker(question);
    setSuggestions([]);
  };

  return {
    suggestions,
    dismiss,
    select
  };
}
