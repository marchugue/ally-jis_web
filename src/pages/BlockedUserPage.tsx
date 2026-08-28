// src/pages/BlockedUsersPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ShieldOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient, BlockedUserRow } from '@/api/client';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';

export default function BlockedUsersPage() {
  const navigate = useNavigate();
  const [blocked, setBlocked] = useState<BlockedUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.listBlockedUsers();
      setBlocked(data);
    } catch (err) {
      console.error('Failed to load blocked users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUnblock = async (userId: string) => {
    setUnblockingId(userId);
    try {
      await apiClient.unblockUser(userId);
      setBlocked((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Failed to unblock user:', err);
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-[#1A6B3C]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-fraunces text-xl font-bold text-[#1A6B3C]">Blocked Accounts</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-gray-400 font-jakarta">Loading…</div>
        ) : blocked.length === 0 ? (
          <div className="p-8 text-center">
            <ShieldOff size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="font-jakarta text-sm text-gray-400">You haven't blocked anyone.</p>
          </div>
        ) : (
          blocked.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
              <AvatarDisplay
                src={u.avatarUrl}
                name={u.username ?? u.fullName}
                className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-jakarta font-semibold text-sm text-gray-900 truncate">
                  {u.username ?? u.fullName ?? 'Student'}
                </p>
                <p className="font-jakarta text-xs text-gray-400">
                  Blocked {new Date(u.blockedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleUnblock(u.id)}
                disabled={unblockingId === u.id}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-gray-200 font-jakarta text-xs text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {unblockingId === u.id ? 'Unblocking…' : 'Unblock'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}