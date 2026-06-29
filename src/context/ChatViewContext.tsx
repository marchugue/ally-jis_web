import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface ChatViewContextValue {
  /** True when a conversation thread is actively open on a mobile viewport.
   *  TopNav uses this to hide both the top bar and bottom nav, so the
   *  conversation gets the full screen — like Messenger/Instagram DMs. */
  isChatFocused: boolean;
  setChatFocused: (focused: boolean) => void;
}

const ChatViewContext = createContext<ChatViewContextValue | undefined>(undefined);

export function ChatViewProvider({ children }: { children: ReactNode }) {
  const [isChatFocused, setChatFocused] = useState(false);

  const value = useMemo(() => ({ isChatFocused, setChatFocused }), [isChatFocused]);

  return <ChatViewContext.Provider value={value}>{children}</ChatViewContext.Provider>;
}

export function useChatView() {
  const ctx = useContext(ChatViewContext);
  if (!ctx) {
    throw new Error('useChatView must be used within a ChatViewProvider');
  }
  return ctx;
}