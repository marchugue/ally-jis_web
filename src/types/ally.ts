export interface Student {
  id: string;
  name: string;
  username: string | null;
  email: string;
  course: string;
  yearLevel: string;
  department: string;
  bio: string;
  avatar: string;
  interests: string[];
  organizations: string[];
  isVerified: boolean;
  joinedAt: string;
  // Collected via the profile edit form for future matchmaking use
  // (compatibility scoring / gradual-reveal stages, Phase 2) — not
  // required, all optional.
  zodiacSign?: string | null;
  personalityType?: string | null;
  musicTaste?: string[];
  movieInterests?: string[];
  ageRange?: string | null;
  matchGenderPreference?: string | null;
}

export interface MessageReplyPreview {
  id: string;
  senderId: string;
  senderName?: string;
  content: string | null;
  imageUrl?: string | null;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  content: string | null;
  imageUrl?: string | null;
  timestamp: string;
  createdAt?: string;
  isRead: boolean;
  status?: 'sending' | 'sent' | 'failed'; // client-only; undefined = sent (from server)
  blocked?: boolean; // true when a 'failed' status was caused by a 403 block, not a network error
  replyTo?: MessageReplyPreview | null;
  reactions?: MessageReaction[];
  isDeleted?: boolean;
  deletedForMe?: boolean;
}

export type BlockStatus = 'none' | 'blockedByMe' | 'blockedByOther' | 'mutual';

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderId: string;
  unreadCount: number;
  sharedInterests: string[];
  messages: Message[];
  blockStatus: BlockStatus;
  icebreakersEnabled: boolean;
  variant: 'regular' | 'anonymous' | 'anonymous_ended';
  /** PHT consecutive-day streak for this conversation (all types, including regular DMs). */
  dayStreak: number;
  matchInfo: {
    matchId: string;
    stage: number;
    dayStreak: number;
    partnerAlias: string | null;
    partnerAvatar: string | null;
    ended: boolean;
  } | null;
}

export interface MatchCard {
  student: Student;
  sharedInterests: string[];
  sharedOrgs: string[];
  matchPercentage: number;
  connectionStatus: 'none' | 'pending' | 'accepted';
}

export interface Notification {
  id: string;
  type: 'match' | 'friend_request' | 'message' | 'accepted' | 'anon_match' | 'new_follower';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
}

export type OnboardingStep = 1 | 2 | 3 | 4;

export interface OnboardingData {
  step: OnboardingStep;
  basicInfo: {
    username: string;
    email: string;
    password: string;
  };
  academicDetails: {
    course: string;
    yearLevel: string;
    department: string;
  };
  interests: string[];
  organizations: string[];
  bio: string;
  avatar: string;
}
