// src/components/ActivityLogModal.tsx
//
// Facebook-style Activity Log viewer modal for Web.
// Allows users to filter by category, view chronological date groupings,
// inspect device/IP audit trails, and delete/clear items.

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
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
import { apiClient } from '../api/client';
import type {
  ActivityBucket,
  ActivityLogRow,
  ActivityGroup,
  FormattedActivityResponse,
} from '../api/types';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BUCKET_TABS: Array<{ id: ActivityBucket | 'all'; label: string; icon: React.ElementType }> = [
  { id: 'all', label: 'All Activity', icon: History },
  { id: 'content', label: 'Posts & Comments', icon: FileText },
  { id: 'connections', label: 'Allies & Follows', icon: UserPlus },
  { id: 'security', label: 'Security & Logins', icon: KeyRound },
  { id: 'safety', label: 'Privacy & Safety', icon: Shield },
];

function getActionIcon(action: string, bucket: ActivityBucket) {
  if (action.includes('login')) return { icon: LogIn, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' };
  if (action.includes('password')) return { icon: KeyRound, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' };
  if (action.includes('blocked')) return { icon: UserX, color: 'text-red-500 bg-red-50 dark:bg-red-950/40' };
  if (action.includes('comment')) return { icon: MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' };
  if (action.includes('reaction') || action.includes('like')) return { icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' };
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

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose }) => {
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
          // Merge groups
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
    if (isOpen) {
      fetchLogs(activeBucket);
    }
  }, [isOpen, activeBucket, fetchLogs]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-white dark:bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A6B3C]/10 dark:bg-emerald-950/50 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center">
              <History size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
                  Activity Log
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#1A6B3C]/10 text-[#1A6B3C] dark:bg-emerald-950/60 dark:text-emerald-400">
                  {totalCount} {totalCount === 1 ? 'record' : 'records'}
                </span>
              </div>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Review and manage your actions, logins, and interactions across Ally-jis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(activeBucket)}
              disabled={loading}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close activity log"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Bucket Filter Tabs */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-black/20 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {BUCKET_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeBucket === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveBucket(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-jakarta text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1A6B3C] text-white shadow-xs dark:bg-emerald-600'
                      : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/5'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {totalCount > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-jakarta font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shrink-0"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>

        {/* Clear Confirmation Banner */}
        {showClearConfirm && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-950/40 border-b border-red-200/80 dark:border-red-900/30 flex items-center justify-between gap-4 animate-in fade-in shrink-0">
            <div className="flex items-center gap-2 text-xs font-jakarta text-red-800 dark:text-red-300">
              <AlertCircle size={15} className="shrink-0" />
              <span>
                Clear all activities in{' '}
                <strong>{activeBucket === 'all' ? 'All Activity' : activeBucket}</strong>? This cannot be undone.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="px-2.5 py-1 text-xs font-jakarta rounded-lg text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearActivities}
                disabled={clearing}
                className="px-3 py-1 text-xs font-jakarta font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                {clearing ? 'Clearing...' : 'Confirm Clear'}
              </button>
            </div>
          </div>
        )}

        {/* Main List Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  <div className="sticky top-0 z-10 py-1 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xs flex items-center gap-2">
                    <span className="font-fraunces text-xs font-bold text-gray-800 dark:text-gray-200">
                      {group.dateLabel}
                    </span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item: ActivityLogRow) => {
                      const { icon: ActionIcon, color } = getActionIcon(item.action, item.bucket);
                      const isMobile = item.device_info?.toLowerCase().includes('mobile');

                      return (
                        <div
                          key={item.id}
                          className="group p-3.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-start justify-between gap-3"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
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
                                <p className="font-jakarta text-xs text-gray-600 dark:text-gray-300 mt-0.5 break-words line-clamp-2">
                                  {item.summary}
                                </p>
                              )}

                              {/* Audit metadata pill: device / IP */}
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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
                        Loading more...
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

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
          <p className="font-jakarta text-[11px] text-gray-400 dark:text-gray-500">
            Activity logs are private and visible only to you.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-jakarta font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
export default ActivityLogModal;
