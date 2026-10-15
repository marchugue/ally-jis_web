import { Student, MatchCard, Conversation, Notification } from '@/types/ally';

export const INTERESTS_BY_CATEGORY: Record<string, { label: string; color: string }[]> = {
  Technology: [
    { label: 'Coding', color: 'blue' },
    { label: 'Web Design', color: 'blue' },
    { label: 'AI & ML', color: 'blue' },
    { label: 'Cybersecurity', color: 'blue' },
    { label: 'Game Dev', color: 'blue' },
    { label: 'Robotics', color: 'blue' },
  ],
  Arts: [
    { label: 'Photography', color: 'pink' },
    { label: 'Drawing', color: 'pink' },
    { label: 'Music', color: 'pink' },
    { label: 'Dancing', color: 'pink' },
    { label: 'Filmmaking', color: 'pink' },
    { label: 'Creative Writing', color: 'pink' },
  ],
  Nature: [
    { label: 'Hiking', color: 'green' },
    { label: 'Environment', color: 'green' },
    { label: 'Gardening', color: 'green' },
    { label: 'Camping', color: 'green' },
    { label: 'Bird Watching', color: 'green' },
  ],
  Sports: [
    { label: 'Basketball', color: 'orange' },
    { label: 'Volleyball', color: 'orange' },
    { label: 'Swimming', color: 'orange' },
    { label: 'Badminton', color: 'orange' },
    { label: 'Football', color: 'orange' },
    { label: 'Fitness', color: 'orange' },
  ],
  Leadership: [
    { label: 'Community Service', color: 'purple' },
    { label: 'Student Gov', color: 'purple' },
    { label: 'Volunteering', color: 'purple' },
    { label: 'Debate', color: 'purple' },
    { label: 'Public Speaking', color: 'purple' },
  ],
  Lifestyle: [
    { label: 'Cooking', color: 'amber' },
    { label: 'Reading', color: 'amber' },
    { label: 'Travel', color: 'amber' },
    { label: 'Anime', color: 'amber' },
    { label: 'Gaming', color: 'amber' },
    { label: 'Fashion', color: 'amber' },
  ],
};

export const ALL_INTERESTS = Object.values(INTERESTS_BY_CATEGORY).flat().map(i => i.label);

export const INTEREST_COLOR_MAP: Record<string, string> = {};
Object.values(INTERESTS_BY_CATEGORY).flat().forEach(({ label, color }) => {
  INTEREST_COLOR_MAP[label] = color;
});

export const ORGANIZATIONS = [
  "Artisan's Society",
  "Adventist Ministry College and University Students' Excelsior",
  'Automotive Technology Society',
  'CHMSU-A Kabanda',
  'CHMSU-Alijis Performing Arts',
  'Circle of Peer Facilitators',
  'Computer Technology Society',
  'CHMSU Alijis Vocals',
  'CHMSU Python Esports Club',
  'CHMSU University Student Government',
  'CHMSUans Red Cross Youth Council',
  "D' Culinarianz",
  "D' Machinist",
  'Electronics and Communication Technology Society',
  "Future Technical Educators' Society",
  'Information Systems Society',
  'Information Technology Society',
  'Institute of Computer Engineers of the Philippines, Student Edition CHMSU Alijis',
  'Institute of Electronics Engineers of the Philippines-Negros Occidental Student Chapter CHMSU-Alijis',
  'Integrated Institute of Electrical Student Society',
  'Junior Safety Officer of Negros Occidental',
  'New Life Apostolic Campus Ministries',
  'Research Enthusiasts CHMSU-Alijis',
  "Philippine Institute of Cyber Security Professionals' Junior - CHMSU-A",
  'United Seniors Organization',
  'Unsullied Frisbee Club',
  'The Technopacer',
  "Youth Movers' Movement",
];

export const DEPARTMENTS = [
  'College of Computer Studies',
  'College of Education',
  'College of Industrial Technology',
  'College of Engineering',
];

export const COURSES_BY_DEPT: Record<string, string[]> = {
  'College of Computer Studies': ['Information Technology', 'Information System'],
  'College of Education': ['Technical Vocational Teacher Education'],
  'College of Industrial Technology': [
    'Automotive',
    'Architectural Drafting',
    'Computer Technology',
    'Culinary',
    'Electrical',
    'Electronics',
    'Mechanical Technology',
  ],
  'College of Engineering': ['Computer Engineering', 'Electronics Engineering'],
};

export const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

// Mock students data
export const MOCK_STUDENTS: Student[] = [];

export const CURRENT_USER: Student = {
  id: '1',
  username: 'alex_dr',
  name: 'alex_dr',
  email: 'alex@chmsu.edu.ph',
  course: 'Information Technology',
  yearLevel: '2nd Year',
  department: 'College of Computer Studies',
  bio: 'IT student passionate about building cool stuff and making friends across CHMSU! 🚀',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&q=80',
  interests: ['Coding', 'Photography', 'Hiking', 'Community Service', 'Music'],
  organizations: ['Information Technology Society', 'CHMSU University Student Government'],
  isVerified: true,
  joinedAt: '2024-04-01',
};

export function calculateMatchPercentage(userA: Student, userB: Student): number {
  if (!userA || !userB) return 20;

  const aInterests = Array.isArray(userA.interests) ? userA.interests : [];
  const bInterests = Array.isArray(userB.interests) ? userB.interests : [];
  const aOrgs = Array.isArray(userA.organizations) ? userA.organizations : [];
  const bOrgs = Array.isArray(userB.organizations) ? userB.organizations : [];

  const sharedInterests = aInterests.filter(i => bInterests.includes(i));
  const sharedOrgs = aOrgs.filter(o => bOrgs.includes(o));

  const sameDept = Boolean(userA.department && userB.department && userA.department.toLowerCase() === userB.department.toLowerCase());
  const sameCourse = Boolean(userA.course && userB.course && userA.course.toLowerCase() === userB.course.toLowerCase());
  const sameYear = Boolean(userA.yearLevel && userB.yearLevel && userA.yearLevel.toLowerCase() === userB.yearLevel.toLowerCase());

  // Interest compatibility (up to 55 points)
  const totalUnique = new Set([...aInterests, ...bInterests]).size;
  let interestScore = 0;
  if (totalUnique > 0 && sharedInterests.length > 0) {
    interestScore = (sharedInterests.length / totalUnique) * 45 + Math.min(sharedInterests.length * 3, 10);
  }

  // Academic compatibility (up to 25 points)
  let academicScore = 0;
  if (sameCourse) academicScore += 15;
  else if (sameDept) academicScore += 8;
  if (sameYear) academicScore += 5;

  // Organization bonus (up to 15 points)
  const orgScore = Math.min(sharedOrgs.length * 5, 15);

  // Baseline peer points for being a CHMSU student (15 points)
  const baseScore = 15;

  const total = Math.round(baseScore + interestScore + academicScore + orgScore);
  return Math.min(Math.max(total, 15), 99);
}

export function getSharedInterests(userA: Student, userB: Student): string[] {
  if (!userA?.interests || !userB?.interests) return [];
  return userA.interests.filter(i => userB.interests.includes(i));
}

export function getSharedOrgs(userA: Student, userB: Student): string[] {
  if (!userA?.organizations || !userB?.organizations) return [];
  return userA.organizations.filter(o => userB.organizations.includes(o));
}

export function getMatchBadgeColor(percentage: number, sharedCount: number): string {
  if (sharedCount >= 4 || percentage >= 80) return 'green';
  if (sharedCount >= 2 || percentage >= 60) return 'orange';
  if (sharedCount >= 1 || percentage >= 40) return 'yellow';
  return 'gray';
}

export function generateMatches(currentUser: Student, allStudents: Student[]): MatchCard[] {
  if (!allStudents || allStudents.length === 0) return [];
  return allStudents
    .filter(student => !currentUser || student.id !== currentUser.id)
    .map(student => {
      const sharedInterests = getSharedInterests(currentUser, student);
      const sharedOrgs = getSharedOrgs(currentUser, student);
      const matchPercentage = calculateMatchPercentage(currentUser, student);
      return {
        student,
        sharedInterests,
        sharedOrgs,
        matchPercentage,
        connectionStatus: 'none' as const,
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
}

export const MOCK_CONVERSATIONS: Conversation[] = [];

export const MOCK_NOTIFICATIONS: Notification[] = [];
