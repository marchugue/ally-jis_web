// src/components/match/MatchRevealPanel.tsx

import { useEffect, useState } from 'react';
import { Lock, LogOut, MessageSquareText, Users, Zap, Star, CheckCircle2, Circle } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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

const POINTS_PER_STAGE = 500;

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-medium">{children}</span>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5 last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 font-jakarta">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 font-jakarta">{value}</span>
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
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Feed Locked</p>
        <p className="text-xs text-gray-500 max-w-[220px]">Reach Stage 4 to unlock {partnerAlias}'s feed in the Allies filter.</p>
      </div>
    );
  }

  if (timeline.posts.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-10 px-4">
        <Users size={28} className="text-emerald-400 mb-3" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Feed Unlocked!</p>
        <p className="text-xs text-gray-500 max-w-[220px]">{partnerAlias} hasn't posted anything yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2">
      {/* Stage 4 anonymous notice */}
      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl px-3 py-2">
        <Users size={14} className="text-emerald-500 shrink-0" />
        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-jakarta">
          Viewing {partnerAlias}'s posts — still <strong>anonymous</strong> until you both reveal.
        </p>
      </div>
      {timeline.posts.map((post) => (
        <div key={post.id} className="bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl p-3">
          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words mb-2">{post.content}</p>
          {post.mediaUrls[0] && (
            <img src={post.mediaUrls[0]} alt="" className="rounded-xl max-h-48 w-full object-cover mb-2" />
          )}
          <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span>{post.likesCount} likes</span>
            <span>{post.commentsCount} comments</span>
          </div>
        </div>
      ))}
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
  onFriendRequestSent: _onFriendRequestSent,
  onEndMatch,
  ended,
}: MatchRevealPanelProps) {
  const partnerAlias = identity?.partnerAlias ?? 'your match';
  const partner = reveal?.partner;
  const stagePoints = reveal?.stagePoints ?? 0;
  const effectiveMultiplier = reveal?.effectiveMultiplier ?? 1;
  const pointsProgress = stage >= 4 ? 100 : Math.min(100, Math.round((stagePoints / POINTS_PER_STAGE) * 100));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto font-jakarta">
        <SheetHeader className="mb-3">
          <SheetTitle className="flex items-center gap-2 text-left">
            <AnonymousAvatar
              avatarKey={identity?.partnerAvatar}
              size={36}
              photoUrl={null}
              photoBlur="heavy"
            />
            {partnerAlias}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="about">
          <TabsList className="w-full">
            <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1">Feed</TabsTrigger>
          </TabsList>

          {/* ── About Tab ── */}
          <TabsContent value="about" className="space-y-4 pt-3">
            {/* Points summary bar */}
            {stage >= 1 && stage < 4 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 font-mono">
                    <Star size={11} className="text-amber-500" />
                    Stage {stage} • {stagePoints}/{POINTS_PER_STAGE} pts
                  </span>
                  <span className="flex items-center gap-1 text-orange-500 dark:text-orange-400 font-mono font-bold">
                    <Zap size={11} />
                    {effectiveMultiplier}×
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#1A6B3C] to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pointsProgress > 0 ? 3 : 0, pointsProgress)}%` }}
                  />
                </div>
              </div>
            )}

            {stage < 1 && (
              <div className="flex flex-col items-center text-center py-6 px-4">
                <Lock className="text-gray-300 mb-3" size={28} />
                <p className="text-sm text-gray-500 max-w-[220px]">
                  Start chatting to unlock things about {partnerAlias}.
                </p>
              </div>
            )}

            {stage >= 1 && (
              <>
                {reveal?.compatibilityScore !== null && (
                  <div className="bg-[#1A6B3C]/5 dark:bg-emerald-500/10 border border-transparent dark:border-white/10 rounded-2xl p-3 text-center">
                    <p className="text-2xl font-bold text-[#1A6B3C] dark:text-emerald-400">{reveal?.compatibilityScore}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">compatible</p>
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
                    <div className="flex-1 bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-xl py-2">
                      <p className="text-base font-semibold text-gray-800 dark:text-white">{reveal.conversationInsights.totalMessages}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">messages</p>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-xl py-2">
                      <p className="text-base font-semibold text-gray-800 dark:text-white">{reveal.conversationInsights.daysActive}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">days talked</p>
                    </div>
                  </div>
                )}

                {(reveal?.icebreakers.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Icebreakers</p>
                    <div className="flex flex-col gap-2">
                      {reveal?.icebreakers.map((text) => (
                        <button
                          key={text}
                          onClick={() => {
                            onUseIcebreaker(text);
                            onOpenChange(false);
                          }}
                          className="flex items-center gap-2 text-left text-sm bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-transparent dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-xl px-3 py-2.5 transition-colors"
                        >
                          <MessageSquareText size={14} className="text-[#1A6B3C] dark:text-emerald-400 shrink-0" />
                          {text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stage 4 feed unlock notice — no identity reveal */}
                {stage >= 4 && (
                  <div className="w-full flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium py-3 px-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                    <Users size={18} className="shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Campus Allies — Feed Unlocked!</p>
                      <p className="text-xs opacity-80 mt-0.5">
                        {partnerAlias}'s posts are now in your Allies feed. Still anonymous until you both choose to reveal.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {onEndMatch && !ended && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-3 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
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

          {/* ── Daily Tasks Tab ── */}
          <TabsContent value="tasks" className="pt-3 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <Star size={12} className="text-amber-500" />
                Today's Tasks <span className="font-normal text-gray-400">(reset 12am PHT)</span>
              </p>
              <p className="text-xs text-gray-400">Complete tasks with {partnerAlias} to earn points and advance stages.</p>
            </div>

            {/* Multiplier info */}
            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-800/30 rounded-xl px-3 py-2">
              <Zap size={14} className="text-orange-500 shrink-0" />
              <p className="text-xs text-orange-700 dark:text-orange-300 font-jakarta">
                Current multiplier: <strong>{effectiveMultiplier}×</strong>
                {reveal?.dayStreak ? ` (${reveal.dayStreak}d streak bonus included)` : ''}
              </p>
            </div>

            {(reveal?.dailyTasks?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center text-center py-6">
                <Lock size={24} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No tasks available for your current stage.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reveal?.dailyTasks?.map((task) => {
                  const bothDone = task.myCompleted && task.partnerCompleted;
                  return (
                    <div
                      key={task.taskId}
                      className={cn(
                        'rounded-xl border p-3.5',
                        bothDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                          : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {bothDone ? (
                          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                        ) : (
                          <Circle size={18} className="text-gray-300 dark:text-gray-600 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-jakarta font-semibold text-sm text-gray-800 dark:text-gray-200">{task.label}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{task.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold font-mono text-[#1A6B3C] dark:text-emerald-400">
                            +{Math.round(task.basePoints * effectiveMultiplier)}pt
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">{task.basePoints}×{effectiveMultiplier}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2.5 pl-[30px]">
                        <span className={cn('text-xs font-jakarta flex items-center gap-1', task.myCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400')}>
                          {task.myCompleted ? <CheckCircle2 size={11} /> : <Circle size={11} />} You
                        </span>
                        <span className={cn('text-xs font-jakarta flex items-center gap-1', task.partnerCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400')}>
                          {task.partnerCompleted ? <CheckCircle2 size={11} /> : <Circle size={11} />} {partnerAlias}
                        </span>
                        {task.myPointsAwarded > 0 && (
                          <span className="ml-auto text-[10px] font-mono text-amber-500">+{task.myPointsAwarded} earned</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Feed/Timeline Tab ── */}
          <TabsContent value="timeline" className="pt-3">
            <TimelineTab matchId={matchId} stage={stage} partnerAlias={partnerAlias} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
