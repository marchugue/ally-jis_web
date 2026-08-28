// src/pages/admin/AdminDashboardPage.tsx

import { useEffect, useState } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, UserCheck, Ban, Flag, Sunrise, Wifi, Clock } from 'lucide-react';
import { apiClient } from '@/api/client';
import type { DashboardCharts, DashboardKpis } from '@/api/client';

interface KpiCardProps {
  label: string;
  value: number | null;
  icon: React.ElementType;
  accent: string;
}

function KpiCard({ label, value, icon: Icon, accent }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-100 dark:border-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white font-fraunces">
        {value === null ? <span className="inline-block w-10 h-6 bg-gray-100 dark:bg-white/10 rounded animate-pulse" /> : value.toLocaleString()}
      </p>
      <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{label}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-100 dark:border-white/5 p-5">
      <p className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-4">{title}</p>
      <div style={{ width: '100%', height: 220 }}>{children}</div>
    </div>
  );
}

const formatDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiClient.getDashboardKpis(), apiClient.getDashboardCharts()])
      .then(([k, c]) => {
        if (cancelled) return;
        setKpis(k);
        setCharts(c);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message ?? 'Failed to load dashboard');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 dark:text-white/40 mt-0.5">
          {kpis ? `${kpis.newUsersToday} new today · ${kpis.onlineUsers} online now` : 'Loading overview…'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Users" value={kpis?.totalUsers ?? null} icon={Users} accent="bg-[#1A6B3C]/10 text-[#1A6B3C] dark:bg-emerald-500/10 dark:text-emerald-400" />
        <KpiCard label="Active Users (7d)" value={kpis?.activeUsers ?? null} icon={UserCheck} accent="bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" />
        <KpiCard label="Banned Users" value={kpis?.bannedUsers ?? null} icon={Ban} accent="bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" />
        <KpiCard label="Reported Users" value={kpis?.reportedUsers ?? null} icon={Flag} accent="bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" />
        <KpiCard label="New Users Today" value={kpis?.newUsersToday ?? null} icon={Sunrise} accent="bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400" />
        <KpiCard label="Online Now" value={kpis?.onlineUsers ?? null} icon={Wifi} accent="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400" />
        <KpiCard label="Pending Reports" value={kpis?.pendingReports ?? null} icon={Clock} accent="bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400" />
        <KpiCard label="New This Week" value={kpis?.newUsersThisWeek ?? null} icon={Sunrise} accent="bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="User Registrations (30 days)">
          <ResponsiveContainer>
            <AreaChart data={charts?.registrations ?? []}>
              <defs>
                <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A6B3C" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1A6B3C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tickFormatter={formatDay} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} fontSize={10} tickLine={false} axisLine={false} width={28} />
              <Tooltip labelFormatter={formatDay} />
              <Area type="monotone" dataKey="count" stroke="#1A6B3C" fill="url(#regGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Active Users (30 days)">
          <ResponsiveContainer>
            <AreaChart data={charts?.activeUsers ?? []}>
              <defs>
                <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B8C7E" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B8C7E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tickFormatter={formatDay} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} fontSize={10} tickLine={false} axisLine={false} width={28} />
              <Tooltip labelFormatter={formatDay} />
              <Area type="monotone" dataKey="count" stroke="#3B8C7E" fill="url(#activeGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Reports Trend (30 days)">
          <ResponsiveContainer>
            <LineChart data={charts?.reportsTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tickFormatter={formatDay} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} fontSize={10} tickLine={false} axisLine={false} width={28} />
              <Tooltip labelFormatter={formatDay} />
              <Line type="monotone" dataKey="count" stroke="#dc4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
