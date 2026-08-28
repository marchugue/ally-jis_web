// src/components/match/MatchRevealPanel.tsx

import { useEffect, useState } from 'react';
import { Lock, LogOut, MessageSquareText, UserPlus } from 'lucide-react';
import { AnonymousAvatar } from './AnonymousAvatar';
import { apiClient } from '@/api/client';
import type { RevealData, TimelineData, MatchIdentityView } from '@/api/client';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MatchRevealPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  stage: number;
  reveal: RevealData | null;
  identity: Pick<MatchIdentityView, 'partnerAlias' | 'partnerAvatar'> | null;
  onUseIcebreaker: (text: string) => void;
  onFriendRequestSent?: () => void;
  onEndMatch?: () => void;
  ended?: boolean;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{children}</span>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-jakarta">{label}</span>
      <span className="text-sm font-medium text-gray-800 font-jakarta">{value}</span>
    </div>
  );
}

function TimelineTab({ matchId, stage, partnerAlias }: { matchId: string; stage: number; partnerAlias: string }) {
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .getMatchTimeline(matchId)
      .then((data) => {
        if (!cancelled) setTimeline(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [matchId, stage]);

  if (loading) return <p className="text-sm text-gray-400 text-center py-8">Loading…</p>;

  if (!timeline || timeline.locked) {
    return (
      <div className="flex flex-col items-center text-center py-10 px-4">
        <Lock className="text-gray-300 mb-3" size={28} />
        <p className="text-sm text-gray-500 max-w-[220px]">Keep talking to unlock {partnerAlias}'s world.</p>
      </div>
    );
  }

  if (timeline.posts.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No posts yet.</p>;
  }

  return (
    <div className={`space-y-3 py-2 ${timeline.blurred ? 'blur-sm select-none pointer-events-none' : ''}`}>
      {timeline.posts.map((post) => (
        <div key={post.id} className="bg-gray-50 rounded-2xl p-3">
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words mb-2">{post.content}</p>
          {post.mediaUrls[0] && (
            <img src={post.mediaUrls[0]} alt="" className="rounded-xl max-h-48 w-full object-cover mb-2" />
          )}
          <div className="flex gap-3 text-xs text-gray-400">
            <span>{post.likesCount} likes</span>
            <span>{post.commentsCount} comments</span>
          </div>
        </div>
      ))}
      {timeline.blurred && (
        <p className="text-center text-xs text-gray-400 pt-1">Full timeline unlocks at Close Connection.</p>
      )}
    </div>
  );
}

export function MatchRevealPanel({
  open,
  onOpenChange,
  matchId,
  stage,
  reveal,
  identity,
  onUseIcebreaker,
  onFriendRequestSent,
  onEndMatch,
  ended,
}: MatchRevealPanelProps) {
  const [sendingRequest, setSendingRequest] = useState(false);
  const partnerAlias = identity?.partnerAlias ?? 'your match';
  const partner = reveal?.partner;

  const handleFriendRequest = async () => {
    if (!partner?.userId) return;
    setSendingRequest(true);
    try {
      await apiClient.sendConnectionRequest(partner.userId);
      onFriendRequestSent?.();
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto font-jakarta">
        <SheetHeader className="mb-3">
          <SheetTitle className="flex items-center gap-2 text-left">
            <AnonymousAvatar
              avatarKey={identity?.partnerAvatar}
              size={36}
              photoUrl={stage >= 2 ? partner?.blurredAvatarUrl ?? partner?.avatarUrl : null}
              photoBlur={stage >= 4 ? 'none' : stage === 3 ? 'medium' : 'heavy'}
            />
            {partner?.fullName ?? partnerAlias}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="about">
          <TabsList className="w-full">
            <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-5 pt-3">
            {stage < 1 && (
              <div className="flex flex-col items-center text-center py-6 px-4">
                <Lock className="text-gray-300 mb-3" size={28} />
                <p className="text-sm text-gray-500 max-w-[220px]">
                  Chat for a few days to start unlocking things about {partnerAlias}.
                </p>
              </div>
            )}

            {stage >= 1 && (
              <>
                {reveal?.compatibilityScore !== null && (
                  <div className="bg-[#1A6B3C]/5 rounded-2xl p-3 text-center">
                    <p className="text-2xl font-bold text-[#1A6B3C]">{reveal?.compatibilityScore}%</p>
                    <p className="text-xs text-gray-500">compatible</p>
                  </div>
                )}

                {(reveal?.sharedInterests.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Shared Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {reveal?.sharedInterests.map((i) => <Chip key={i}>{i}</Chip>)}
                    </div>
                  </div>
                )}

                {(reveal?.sharedCategories.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">In Common</p>
                    <div className="flex flex-wrap gap-1.5">
                      {reveal?.sharedCategories.map((c) => <Chip key={c}>{c}</Chip>)}
                    </div>
                  </div>
                )}

                <div>
                  <InfoRow label="Age range" value={partner?.ageRange} />
                  <InfoRow label="Zodiac" value={partner?.zodiacSign} />
                  <InfoRow label="Personality" value={partner?.personalityType} />
                  <InfoRow label="Studying" value={partner?.studyCategory} />
                  <InfoRow label="Favorite hobby" value={partner?.favoriteHobby} />
                  <InfoRow label="Name starts with" value={partner?.firstNameLetter} />
                  <InfoRow label="Username" value={partner?.username ? `@${partner.username}` : null} />
                </div>

                {(partner?.musicTaste?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Music Taste</p>
                    <div className="flex flex-wrap gap-1.5">
                      {partner?.musicTaste?.map((m) => <Chip key={m}>{m}</Chip>)}
                    </div>
                  </div>
                )}

                {(partner?.movieInterests?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Movie Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {partner?.movieInterests?.map((m) => <Chip key={m}>{m}</Chip>)}
                    </div>
                  </div>
                )}

                {reveal?.conversationInsights && (
                  <div className="flex gap-4 text-center">
                    <div className="flex-1 bg-gray-50 rounded-xl py-2">
                      <p className="text-base font-semibold text-gray-800">{reveal.conversationInsights.totalMessages}</p>
                      <p className="text-[11px] text-gray-400">messages</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl py-2">
                      <p className="text-base font-semibold text-gray-800">{reveal.conversationInsights.daysActive}</p>
                      <p className="text-[11px] text-gray-400">days talked</p>
                    </div>
                  </div>
                )}

                {(reveal?.icebreakers.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Icebreakers</p>
                    <div className="flex flex-col gap-2">
                      {reveal?.icebreakers.map((text) => (
                        <button
                          key={text}
                          onClick={() => {
                            onUseIcebreaker(text);
                            onOpenChange(false);
                          }}
                          className="flex items-center gap-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2.5 transition-colors"
                        >
                          <MessageSquareText size={14} className="text-[#1A6B3C] shrink-0" />
                          {text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {stage >= 4 && partner?.userId && (
                  <button
                    onClick={handleFriendRequest}
                    disabled={sendingRequest}
                    className="w-full flex items-center justify-center gap-2 bg-[#1A6B3C] text-white font-semibold py-3 rounded-2xl hover:bg-[#155a33] transition-colors disabled:opacity-60"
                  >
                    <UserPlus size={16} />
                    {sendingRequest ? 'Sending…' : `Add ${partner.fullName ?? partnerAlias}`}
                  </button>
                )}
              </>
            )}

            {/* Available regardless of stage — a match can be ended at any
                point, not just after something unlocks. */}
            {onEndMatch && !ended && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-3 rounded-2xl hover:bg-red-50 transition-colors">
                    <LogOut size={16} />
                    End match
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End this match?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This ends the chat for both of you and can't be undone. {partnerAlias} won't be notified who
                      you are.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep chatting</AlertDialogCancel>
                    <AlertDialogAction onClick={onEndMatch} className="bg-red-500 hover:bg-red-600">
                      End match
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="pt-3">
            <TimelineTab matchId={matchId} stage={stage} partnerAlias={partnerAlias} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
