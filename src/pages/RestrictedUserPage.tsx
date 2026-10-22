// src/pages/RestrictedUserPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient, RestrictedUserRow } from '@/api/client';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';

export default function RestrictedUserPage() {
  const navigate = useNavigate();
  const [restricted, setRestricted] = useState<RestrictedUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unrestrictingId, setUnrestrictingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.listRestrictedUsers();
      setRestricted(data);
    } catch (err) {
      console.error('Failed to load restricted users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUnrestrict = async (userId: string) => {
    setUnrestrictingId(userId);
    try {
      await apiClient.unrestrictUser(userId);
      setRestricted((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Failed to unrestrict user:', err);
    } finally {
      setUnrestrictingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-white dark:bg-[#090D16]">
      <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-[#1A6B3C] dark:hover:text-emerald-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-fraunces text-xl font-bold text-[#1A6B3C] dark:text-emerald-400">Restricted Accounts</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-gray-400 font-jakarta">Loading…</div>
        ) : restricted.length === 0 ? (
          <div className="p-8 text-center">
            <ShieldAlert size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="font-jakarta text-sm text-gray-400 dark:text-gray-400">You haven't restricted anyone.</p>
          </div>
        ) : (
          restricted.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-white/5">
              <AvatarDisplay
                src={u.avatarUrl}
                name={u.username ?? u.fullName}
                className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-jakarta font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {u.username ?? u.fullName ?? 'Student'}
                </p>
                <p className="font-jakarta text-xs text-gray-400">
                  Restricted {new Date(u.restrictedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleUnrestrict(u.id)}
                disabled={unrestrictingId === u.id}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 font-jakarta text-xs text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {unrestrictingId === u.id ? 'Unrestricting…' : 'Unrestrict'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
