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
            {results.users.map((u) => (
              <CommandItem key={u.id} onSelect={() => go('/admin/users')}>
                <User size={14} className="mr-2 text-gray-400" />
                {u.username ? `@${u.username}` : u.full_name ?? 'Unnamed'}
                <span className="ml-2 text-xs text-gray-400">{u.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results && results.reports.length > 0 && (
          <CommandGroup heading="Reports">
            {results.reports.map((r) => (
              <CommandItem key={r.id} onSelect={() => go('/admin/reports')}>
                <Flag size={14} className="mr-2 text-gray-400" />
                {r.reported_username ? `@${r.reported_username}` : 'Unknown'} — {r.violation_label}
                <span className="ml-2 text-xs text-gray-400">{r.status}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results && results.admins.length > 0 && (
          <CommandGroup heading="Admins">
            {results.admins.map((a) => (
              <CommandItem key={a.id} onSelect={() => go('/admin/admins')}>
                <ShieldCheck size={14} className="mr-2 text-gray-400" />
                {a.username ? `@${a.username}` : a.full_name ?? 'Unnamed'}
                <span className="ml-2 text-xs text-gray-400 capitalize">{a.role.replace('_', ' ')}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
