// src/components/admin/AdminGlobalSearch.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Flag, ShieldCheck, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/client';
import type { GlobalSearchResult } from '@/api/client';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';

interface AdminGlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminGlobalSearch({ open, onOpenChange }: AdminGlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      apiClient
        .adminSearch(query)
        .then(setResults)
        .finally(() => setLoading(false));
    }, 250); // debounce — avoids a request per keystroke
    return () => clearTimeout(handle);
  }, [query]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const hasResults = results && (results.users.length > 0 || results.reports.length > 0 || results.admins.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search users, reports, admins…" value={query} onValueChange={setQuery} />
      <CommandList>
        {loading && (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-[#1A6B3C]" size={18} /></div>
        )}
        {!loading && query.trim() && !hasResults && <CommandEmpty>No results.</CommandEmpty>}

        {results && results.users.length > 0 && (
          <CommandGroup heading="Users">
            {results.users.map((u) => {
              const displayName = u.full_name || (u.username ? `@${u.username}` : 'Student');
              return (
                <CommandItem key={u.id} onSelect={() => go(`/admin/users?search=${encodeURIComponent(u.email || u.username || u.id)}`)}>
                  <User size={14} className="mr-2 text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</span>
                  {u.username && u.full_name && (
                    <span className="ml-1 text-xs text-gray-400 truncate">(@{u.username})</span>
                  )}
                  <span className="ml-2 text-xs text-gray-400 truncate">{u.email}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {results && results.reports.length > 0 && (
          <CommandGroup heading="Reports">
            {results.reports.map((r) => {
              const targetName = r.reported_name || (r.reported_username ? `@${r.reported_username}` : 'Reported User');
              return (
                <CommandItem key={r.id} onSelect={() => go('/admin/reports')}>
                  <Flag size={14} className="mr-2 text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-white truncate">{targetName}</span>
                  {r.reported_username && r.reported_name && (
                    <span className="ml-1 text-xs text-gray-400 truncate">(@{r.reported_username})</span>
                  )}
                  <span className="mx-1.5 text-gray-400">—</span>
                  <span className="text-gray-600 dark:text-white/70 truncate">{r.violation_label}</span>
                  <span className="ml-auto text-xs text-gray-400 capitalize">{r.status}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {results && results.admins.length > 0 && (
          <CommandGroup heading="Admins">
            {results.admins.map((a) => {
              const adminName = a.full_name || (a.username ? `@${a.username}` : 'Admin');
              return (
                <CommandItem key={a.id} onSelect={() => go('/admin/admins')}>
                  <ShieldCheck size={14} className="mr-2 text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-white truncate">{adminName}</span>
                  {a.username && a.full_name && (
                    <span className="ml-1 text-xs text-gray-400 truncate">(@{a.username})</span>
                  )}
                  <span className="ml-auto text-xs text-gray-400 capitalize">{a.role.replace('_', ' ')}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
