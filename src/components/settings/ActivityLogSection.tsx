// src/components/settings/ActivityLogSection.tsx
//
// Facebook-style Activity Log integrated directly as a Settings category.
// No modals — renders inline within the Settings page detail pane.

import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Trash2,
  RefreshCw,
  FileText,
  MessageSquare,
  Heart,
  UserPlus,
  UserMinus,
  UserX,
  ShieldCheck,
  KeyRound,
  LogIn,
  Shield,
  Smartphone,
  Laptop,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import type {
  ActivityBucket,
  ActivityLogRow,
  ActivityGroup,
  FormattedActivityResponse,
} from '@/api/types';

const BUCKET_TABS: Array<{ id: ActivityBucket | 'all'; label: string; icon: React.ElementType }> = [
  { id: 'all', label: 'All Activity', icon: History },
  { id: 'content', label: 'Posts & Comments', icon: FileText },
  { id: 'connections', label: 'Allies & Follows', icon: UserPlus },
  { id: 'security', label: 'Security & Logins', icon: KeyRound },
  { id: 'safety', label: 'Privacy & Safety', icon: Shield },
];

function getActionIcon(action: string, bucket: ActivityBucket) {
  if (action.includes('login')) {
    return { icon: LogIn, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' };
  }
  if (action.includes('password')) {
    return { icon: KeyRound, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' };
  }
  if (action.includes('blocked')) {
    return { icon: UserX, color: 'text-red-500 bg-red-50 dark:bg-red-950/40' };
  }
  if (action.includes('comment')) {
    return { icon: MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' };
  }
  if (action.includes('reaction') || action.includes('like')) {
    return { icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' };
  }
  if (action.includes('ally') || action.includes('connected') || action.includes('follow')) {
    return { icon: UserPlus, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40' };
  }
  if (action.includes('unfollow') || action.includes('removed')) {
    return { icon: UserMinus, color: 'text-gray-500 bg-gray-100 dark:bg-white/10' };
  }

  switch (bucket) {
    case 'security':
      return { icon: ShieldCheck, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' };
    case 'connections':
      return { icon: UserPlus, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40' };
    case 'safety':
      return { icon: Shield, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' };
    default:
      return { icon: FileText, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' };
  }
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const ActivityLogSection: React.FC = () => {
  const [activeBucket, setActiveBucket] = useState<ActivityBucket | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<ActivityGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fetchLogs = useCallback(
    async (bucket: ActivityBucket | 'all', cursor?: string, append = false) => {
      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);

        const res: FormattedActivityResponse = await apiClient.listActivityLogs({
          bucket,
          cursor,
          limit: 25,
        });

        if (append) {
          setGroups((prev) => {
            const map = new Map<string, ActivityGroup>();
            prev.forEach((g) => map.set(g.dateKey, { ...g, items: [...g.items] }));
            res.groups.forEach((g) => {
              if (map.has(g.dateKey)) {
                const existing = map.get(g.dateKey)!;
                existing.items = [...existing.items, ...g.items];
              } else {
                map.set(g.dateKey, { ...g });
              }
            });
            return Array.from(map.values());
          });
        } else {
          setGroups(res.groups || []);
        }

        setTotalCount(res.totalCount || 0);
        setNextCursor(res.nextCursor);
      } catch (err) {
        console.error('Failed to load activity logs:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchLogs(activeBucket);
  }, [activeBucket, fetchLogs]);

  const handleDeleteItem = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.deleteActivityLog(id);
      setGroups((prev) =>
        prev
          .map((g) => ({
            ...g,
            items: g.items.filter((item) => item.id !== id),
          }))
          .filter((g) => g.items.length > 0)
      );
      setTotalCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to delete activity item:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearActivities = async () => {
    setClearing(true);
    try {
      const bucketParam = activeBucket === 'all' ? undefined : activeBucket;
      await apiClient.clearActivityLogs(bucketParam);
      setGroups([]);
      setTotalCount(0);
      setNextCursor(undefined);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear activity logs:', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Card */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="border-b border-gray-100 dark:border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History size={20} className="text-[#1A6B3C] dark:text-emerald-400" /> Activity Log
              <span className="px-2 py-0.5 rounded-full text-xs font-jakarta font-bold bg-[#1A6B3C]/10 text-[#1A6B3C] dark:bg-emerald-950/60 dark:text-emerald-400">
                {totalCount} {totalCount === 1 ? 'record' : 'records'}
              </span>
            </h3>
            <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">
              Review and manage your actions, logins, and interactions across Ally-jis (Facebook style).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => fetchLogs(activeBucket)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-white/10 text-xs font-jakarta font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            {totalCount > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-jakarta font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {BUCKET_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeBucket === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveBucket(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-jakarta text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1A6B3C] text-white shadow-xs dark:bg-emerald-600'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/5'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Clear Confirmation Banner */}
        {showClearConfirm && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-jakarta text-red-800 dark:text-red-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>
                Clear all activities in{' '}
                <strong>{activeBucket === 'all' ? 'All Activity' : activeBucket}</strong>? This cannot be undone.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="px-3 py-1.5 text-xs font-jakarta rounded-lg text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearActivities}
                disabled={clearing}
                className="px-3.5 py-1.5 text-xs font-jakarta font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                {clearing ? 'Clearing...' : 'Confirm Clear'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Activity Entries List */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 size={28} className="animate-spin text-[#1A6B3C] dark:text-emerald-400" />
            <p className="font-jakarta text-xs">Loading activity logs...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
              <History size={26} />
            </div>
            <div>
              <h4 className="font-fraunces text-base font-bold text-gray-800 dark:text-gray-200">
                No activity found
              </h4>
              <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 max-w-sm mt-1">
                Actions taken in this category will automatically be recorded here for your personal security and reference.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.dateKey} className="space-y-2.5">
                <div className="py-1 flex items-center gap-2">
                  <span className="font-fraunces text-xs font-bold text-gray-800 dark:text-gray-200">
                    {group.dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-gray-100 dark:border-white/10" />
                </div>

                <div className="space-y-2">
                  {group.items.map((item: ActivityLogRow) => {
                    const { icon: ActionIcon, color } = getActionIcon(item.action, item.bucket);
                    const isMobile = item.device_info?.toLowerCase().includes('mobile');

                    return (
                      <div
                        key={item.id}
                        className="group p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${color}`}
                          >
                            <ActionIcon size={17} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-jakarta text-xs font-bold text-gray-900 dark:text-white">
                                {item.title}
                              </span>
                              <span className="text-[10px] font-jakarta text-gray-400 dark:text-gray-500">
                                {formatTime(item.created_at)}
                              </span>
                            </div>

                            {item.summary && (
                              <p className="font-jakarta text-xs text-gray-600 dark:text-gray-300 mt-1 break-words line-clamp-2 leading-relaxed">
                                {item.summary}
                              </p>
                            )}

                            {/* Audit metadata pill: device / IP */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {item.device_info && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-jakarta text-gray-400 dark:text-gray-500 bg-white dark:bg-black/30 border border-gray-200/60 dark:border-white/5 px-2 py-0.5 rounded-md">
                                  {isMobile ? <Smartphone size={10} /> : <Laptop size={10} />}
                                  {item.device_info}
                                </span>
                              )}
                              {item.ip_address && (
                                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                                  IP: {item.ip_address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deletingId === item.id}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer shrink-0"
                          title="Delete this record"
                          aria-label="Delete activity record"
                        >
                          {deletingId === item.id ? (
                            <Loader2 size={14} className="animate-spin text-red-500" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {nextCursor && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => fetchLogs(activeBucket, nextCursor, true)}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-jakarta font-bold text-[#1A6B3C] dark:text-emerald-400 bg-[#1A6B3C]/10 dark:bg-emerald-950/40 hover:bg-[#1A6B3C]/20 transition-colors cursor-pointer"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Loading older activities...
                    </>
                  ) : (
                    'Load older activities'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogSection;
