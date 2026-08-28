// src/pages/admin/AdminSettingsPage.tsx

import { useEffect, useState } from 'react';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/api/client';
import type { SystemSettings } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';

function SectionCard({ title, wired, children }: { title: string; wired: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-100 dark:border-white/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-fraunces text-base font-bold text-gray-900 dark:text-white">{title}</h2>
        {!wired && (
          <span className="text-[9px] font-semibold uppercase tracking-wide bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/40 px-1.5 py-0.5 rounded">
            Not yet enforced
          </span>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{label}</p>
        {description && <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Partial<SystemSettings>>({});

  useEffect(() => {
    apiClient.adminGetSettings().then(setSettings).catch((err: any) => notify.error('Failed to load settings', err.message));
  }, []);

  const value = <K extends keyof SystemSettings>(key: K): SystemSettings[K] => (dirty[key] !== undefined ? dirty[key] : settings?.[key]) as SystemSettings[K];
  const set = (key: keyof SystemSettings, v: unknown) => setDirty((d) => ({ ...d, [key]: v }));

  const save = async () => {
    if (Object.keys(dirty).length === 0) return;
    setSaving(true);
    try {
      await apiClient.adminUpdateSettings(dirty);
      setSettings((s) => (s ? { ...s, ...dirty } : s));
      setDirty({});
      notify.success('Settings saved');
    } catch (err: any) {
      notify.error('Could not save settings', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#1A6B3C]" size={22} /></div>;
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-0.5">System-wide configuration.</p>
        </div>
        <button
          onClick={save}
          disabled={saving || Object.keys(dirty).length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A6B3C] dark:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40 shrink-0"
        >
          <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <SectionCard title="Maintenance Mode" wired>
        <ToggleRow
          label="Enable maintenance mode"
          description="Blocks all non-admin API access with the message below. Takes effect within ~10 seconds."
          checked={Boolean(value('maintenance_mode'))}
          onChange={(v) => set('maintenance_mode', v)}
        />
        {value('maintenance_mode') && (
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs rounded-xl p-3">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            Every student is locked out while this is on — including from logging back in. Only admin routes stay reachable.
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Message shown to users</label>
          <textarea
            value={(value('maintenance_message') as string) ?? ''}
            onChange={(e) => set('maintenance_message', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white bg-gray-50 text-sm outline-none focus:border-[#1A6B3C]"
          />
        </div>
      </SectionCard>

      <SectionCard title="User Registration" wired>
        <ToggleRow
          label="Allow new registrations"
          description="When off, sign-up requests are rejected with a friendly message."
          checked={Boolean(value('registrations_enabled'))}
          onChange={(v) => set('registrations_enabled', v)}
        />
      </SectionCard>

      <SectionCard title="General" wired={false}>
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Platform Name</label>
          <input
            value={(value('platform_name') as string) ?? ''}
            onChange={(e) => set('platform_name', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white bg-gray-50 text-sm outline-none focus:border-[#1A6B3C]"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Support Email</label>
          <input
            value={(value('support_email') as string) ?? ''}
            onChange={(e) => set('support_email', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white bg-gray-50 text-sm outline-none focus:border-[#1A6B3C]"
          />
        </div>
      </SectionCard>

      <SectionCard title="Security" wired={false}>
        <ToggleRow
          label="Require verified @chmsu.edu.ph email"
          description="Stored for a future pass — login/registration doesn't check this yet."
          checked={Boolean(value('require_email_verification'))}
          onChange={(v) => set('require_email_verification', v)}
        />
      </SectionCard>
    </div>
  );
}
