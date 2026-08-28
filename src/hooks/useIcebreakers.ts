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
  /** When false, suppresses all suggestion triggers and clears any
   *  currently-shown suggestions. Defaults to true so existing callers
   *  that don't pass it keep working unchanged. */
  enabled?: boolean;
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

export function useIcebreakers({
  messages,
  currentUser,
  otherUser,
  onSendIcebreaker,
  enabled = true,
}: IcebreakerHookProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastIcebreakerMessageCountRef = useRef(0);
  const nextRandomTriggerRef = useRef(
    Math.floor(Math.random() * (RANDOM_TRIGGER_RANGE.max - RANDOM_TRIGGER_RANGE.min + 1)) + RANDOM_TRIGGER_RANGE.min
  );

  // Reset state when the other participant changes
  useEffect(() => {
    setSuggestions([]);
    setIsDismissed(false);
    lastIcebreakerMessageCountRef.current = messages.length;
    nextRandomTriggerRef.current =
      Math.floor(Math.random() * (RANDOM_TRIGGER_RANGE.max - RANDOM_TRIGGER_RANGE.min + 1)) + RANDOM_TRIGGER_RANGE.min;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUser.id]); // intentionally only reset on participant change, not every messages update

  // Clear any visible suggestions the moment icebreakers are turned off,
  // so toggling off in ConversationInfoPanel takes effect immediately
  // rather than waiting for the next trigger check.
  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
    }
  }, [enabled]);

  // ─── FIX: depend on primitive fields, not the whole currentUser/otherUser
  // objects. Previously this closed over `currentUser` and `otherUser` as
  // object deps — but because MessagesPage rebuilt the otherUser literal on
  // every render, the useCallback reference changed every render, which made
  // every effect that listed it as a dep re-run endlessly.
  const currentUserInterests = currentUser.interests;
  const currentUserCourse = currentUser.course;
  const otherUserInterests = otherUser.interests;
  const otherUserCourse = otherUser.course;
  const otherUserId = otherUser.id;

  const getSharedInterestQuestions = useCallback(() => {
    const otherInterests = otherUserInterests || [];
    const shared = (currentUserInterests || []).filter(i => otherInterests.includes(i));
    const questions: string[] = [];

    if (shared.length > 0) {
      shared.slice(0, 2).forEach(interest => {
        questions.push(`How did you get into ${interest}?`);
      });
    }

    if (otherUserCourse) {
      if (currentUserCourse === otherUserCourse) {
        questions.push(`What's the hardest part about studying ${currentUserCourse}?`);
      } else {
        questions.push(`What's it like being in the ${otherUserCourse} program?`);
      }
    } else {
      questions.push("What are you currently studying at Alijis?");
    }

    return questions.slice(0, 3);
  }, [currentUserInterests, currentUserCourse, otherUserInterests, otherUserCourse, otherUserId]);

  const getRandomTrigger = useCallback(() => {
    const combined = [...HOT_TAKES, ...WOULD_YOU_RATHER];
    return combined[Math.floor(Math.random() * combined.length)];
  }, []); // no deps — pure random, never needs to change

  // Trigger 1: First Conversation — show shared-interest questions when inbox is empty
  useEffect(() => {
    if (!enabled) return;
    if (messages.length === 0 && !isDismissed) {
      setSuggestions(getSharedInterestQuestions());
    }
  }, [messages.length, getSharedInterestQuestions, isDismissed, enabled]);

  // Trigger 2: Idle Time — suggest a conversation starter after 2 hrs of silence
  // ─── FIX: was `[messages, ...]` — the full array is a new reference on every
  // poll, making this interval reset every 5 s. Changed to `messages.length`
  // so the effect only re-runs when the count actually changes.
  useEffect(() => {
    if (!enabled) return;
    if (messages.length === 0 || isDismissed) return;

    const lastMessage = messages[messages.length - 1];
    const lastTime = new Date(lastMessage.createdAt || lastMessage.timestamp).getTime();

    const checkIdle = () => {
      if (Date.now() - lastTime >= IDLE_TIME_THRESHOLD) {
        setSuggestions([getRandomTrigger()]);
      }
    };

    const timer = setInterval(checkIdle, 60000); // check every minute
    return () => clearInterval(timer);
  }, [messages.length, getRandomTrigger, isDismissed, enabled]);

  // Trigger 3: Random Mid-Conversation — surface a hot take / WYR after N messages
  useEffect(() => {
    if (!enabled) return;
    if (messages.length === 0) return;

    const diff = messages.length - lastIcebreakerMessageCountRef.current;
    if (diff >= nextRandomTriggerRef.current) {
      setSuggestions([getRandomTrigger()]);
      setIsDismissed(false);
      lastIcebreakerMessageCountRef.current = messages.length;
      nextRandomTriggerRef.current =
        Math.floor(Math.random() * (RANDOM_TRIGGER_RANGE.max - RANDOM_TRIGGER_RANGE.min + 1)) + RANDOM_TRIGGER_RANGE.min;
    }
  }, [messages.length, getRandomTrigger, enabled]);

  const dismiss = useCallback(() => {
    setSuggestions([]);
    setIsDismissed(true);
  }, []);

  const select = useCallback((question: string) => {
    onSendIcebreaker(question);
    setSuggestions([]);
  }, [onSendIcebreaker]);

  return { suggestions, dismiss, select };
}