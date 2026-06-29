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
}

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
  type: 'match' | 'friend_request' | 'message' | 'accepted';
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
