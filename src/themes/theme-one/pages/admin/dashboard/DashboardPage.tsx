'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  Users,
  IndianRupee,
  Sparkles,
  ExternalLink,
  Check,
  X,
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { toast } from '@/components/ui/use-toast';
import { RejectToolDialog } from '@/components/admin/moderation/RejectToolDialog';

/* ------------------------------- types -------------------------------- */

interface DashboardStats {
  totalTools: number;
  pendingSubmissions: number;
  recentSubmissions: Array<{
    _id: string;
    name: string;
    category: string;
    createdAt: string;
    slug?: string;
    ownerUserId?: string;
  }>;
}

interface RevenueSummary {
  thisMonth: {
    boostRevenuePaise: number;
    subscriptionRevenuePaise: number; // post-migration: USD cents — same minor-unit shape, see lib/cashfree.ts PRICING
    subscriptionCount: number;
  };
  allTime: { activeSubscriptions: number };
  stuckPending: number;
}

interface RevenueSeries {
  series: { date: string; paise: number; count: number }[];
}

interface PendingItem {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string;
  category: string;
  logo?: string;
  ownerEmail?: string;
  ownerName?: string;
  createdAt: string;
}

/* ------------------------------ helpers ------------------------------- */

// Subscriptions migrated to USD ($10/mo, plan monthly-listing-10). Boosts
// remain INR (paise). The "MRR" tile shows recurring USD revenue only —
// boosts are one-off, not recurring, so summing them into MRR would be
// a category error even if the currencies matched. Use boostInr() for
// boost-side totals elsewhere.
const usd = (cents: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));

const boostInr = (paise: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(paise / 100));

const compact = (n: number) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(n);

/* ---------------------------- KPI component --------------------------- */

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Wrench;
  trend?: 'up' | 'flat' | 'down';
}) {
  return (
    <Card
      surface="clean"
      className="p-5 transition-transform duration-200 ease-out hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-[34px] md:text-[36px] font-semibold tracking-tight text-slate-900 leading-none">
            {value}
          </div>
          {hint && (
            <div className="mt-2 text-[12px] text-slate-500 flex items-center gap-1">
              {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />}
              {hint}
            </div>
          )}
        </div>
        <div className="shrink-0 h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-red-600" />
        </div>
      </div>
    </Card>
  );
}

/* ----------------------------- main page ----------------------------- */

export default function DashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const stats = useQuery<DashboardStats, Error>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const r = await fetch('/api/tools/stats');
      if (!r.ok) throw new Error('Failed to load stats');
      return r.json();
    },
  });

  const revenue = useQuery<RevenueSummary, Error>({
    queryKey: ['admin-revenue'],
    queryFn: async () => {
      const r = await fetch('/api/admin/revenue', { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to load revenue');
      return r.json();
    },
  });

  const series = useQuery<RevenueSeries, Error>({
    queryKey: ['admin-revenue-series', 30],
    queryFn: async () => {
      const r = await fetch('/api/admin/revenue/series?days=30', { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to load series');
      return r.json();
    },
  });

  const pending = useQuery<{ items: PendingItem[]; total: number }, Error>({
    queryKey: ['admin-pending-tools'],
    queryFn: async () => {
      const r = await fetch('/api/admin/tools/pending?limit=8', { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to load pending queue');
      return r.json();
    },
  });

  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);

  const approve = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      setActingId(id);
      const r = await fetch(`/api/admin/tools/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!r.ok) throw new Error('Failed to approve');
      return r.json();
    },
    onSuccess: () => {
      toast({ title: 'Approved' });
      qc.invalidateQueries({ queryKey: ['admin-pending-tools'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    },
    onSettled: () => setActingId(null),
  });

  const reject = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string | null }) => {
      setActingId(id);
      const r = await fetch(`/api/admin/tools/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(reason ? { reason } : {}),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to reject');
      }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: 'Tool rejected' });
      qc.invalidateQueries({ queryKey: ['admin-pending-tools'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: Error) => {
      // Re-throw so the dialog can surface the error inline and stay open.
      toast({ title: 'Reject failed', description: err.message, variant: 'destructive' });
      throw err;
    },
    onSettled: () => setActingId(null),
  });

  // Submissions in last 7 days from recentSubmissions list.
  const newThisWeek = useMemo(() => {
    if (!stats.data) return 0;
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return stats.data.recentSubmissions.filter(
      (s) => new Date(s.createdAt).getTime() >= cutoff,
    ).length;
  }, [stats.data]);

  const chartData = useMemo(() => {
    if (!series.data) return [];
    return series.data.series.map((d) => ({
      date: d.date.slice(5), // MM-DD
      revenue: Math.round(d.paise / 100),
    }));
  }, [series.data]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Activity, revenue, and the moderation queue at a glance.
          </p>
        </div>
        <Button variant="keedaOutline" size="keedaSm" onClick={() => {
          stats.refetch(); revenue.refetch(); series.refetch(); pending.refetch();
        }}>
          Refresh
        </Button>
      </div>

      {/* Stuck-pending advisory */}
      {revenue.data && revenue.data.stuckPending > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-[#FFFBEB] px-3.5 py-2.5 text-[13px] text-[#92400E]">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">{revenue.data.stuckPending}</span> payment
            {revenue.data.stuckPending === 1 ? '' : 's'} have been pending for &gt;10 minutes.
            <button
              type="button"
              onClick={() => router.push('/admin/payments?status=pending')}
              className="ml-2 underline underline-offset-2 hover:text-amber-900"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Kpi
          label="Tools"
          value={stats.isLoading ? '—' : compact(stats.data?.totalTools ?? 0)}
          hint={stats.data ? `${stats.data.pendingSubmissions} pending review` : undefined}
          icon={Wrench}
        />
        <Kpi
          label="Active subs"
          value={revenue.isLoading ? '—' : compact(revenue.data?.allTime.activeSubscriptions ?? 0)}
          hint={
            revenue.data
              ? `${revenue.data.thisMonth.subscriptionCount} renewed this month`
              : undefined
          }
          icon={Users}
        />
        <Kpi
          label="MRR (this month)"
          value={revenue.isLoading ? '—' : usd(revenue.data?.thisMonth.subscriptionRevenuePaise ?? 0)}
          hint={
            revenue.data
              ? `${boostInr(revenue.data.thisMonth.boostRevenuePaise)} boost · this month`
              : undefined
          }
          icon={IndianRupee}
          trend="up"
        />
        <Kpi
          label="New submissions · 7d"
          value={stats.isLoading ? '—' : compact(newThisWeek)}
          hint={stats.data ? `from recent activity` : undefined}
          icon={Sparkles}
        />
      </div>

      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Recent submissions */}
        <Card surface="clean" className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent submissions</h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Latest tool submissions from creators.
              </p>
            </div>
            <Button
              variant="keedaGhost"
              size="keedaSm"
              onClick={() => router.push('/admin/submissions')}
            >
              View all <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.isLoading && (
              <div className="p-5 flex items-center justify-center text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
            {stats.data && stats.data.recentSubmissions.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No submissions yet.
              </div>
            )}
            {stats.data?.recentSubmissions.slice(0, 6).map((s) => (
              <button
                type="button"
                key={s._id}
                onClick={() => router.push(`/admin/submissions`)}
                className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-slate-50 transition-colors duration-150"
              >
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-slate-900 truncate">
                    {s.name}
                  </div>
                  <div className="text-[12px] text-slate-500 truncate">{s.category}</div>
                </div>
                <div className="text-[11.5px] text-slate-400 shrink-0">
                  {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* 30-day revenue chart */}
        <Card surface="clean" className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Revenue · last 30 days</h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Successful payments per day, ₹ value.
              </p>
            </div>
            <Badge variant="keedaSoft">{chartData.length}d</Badge>
          </div>
          <div className="h-[200px] mt-4 -ml-2">
            {series.isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#DC2626" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#F1F5F9" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 8px 24px -8px rgba(15,23,42,0.12)',
                      padding: '8px 10px',
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#DC2626"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Pending review queue */}
      <Card surface="clean" className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Pending review queue
              {pending.data && pending.data.total > 0 && (
                <Badge variant="keedaSoft" className="ml-2 align-middle">
                  {pending.data.total}
                </Badge>
              )}
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              User submissions awaiting moderation. Approve or reject inline.
            </p>
          </div>
          <Button
            variant="keedaGhost"
            size="keedaSm"
            onClick={() => router.push('/admin/moderation')}
          >
            Full queue <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          {pending.isLoading && (
            <div className="p-6 flex items-center justify-center text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          {pending.data && pending.data.items.length === 0 && (
            <div className="p-10 text-center">
              <div className="inline-flex w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mb-2">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-sm font-medium text-slate-900">All caught up</div>
              <div className="text-[12px] text-slate-500 mt-0.5">
                No tool submissions are waiting on you.
              </div>
            </div>
          )}
          {pending.data?.items.map((t) => {
            const busy = actingId === t.id && (approve.isPending || reject.isPending);
            return (
              <div
                key={t.id}
                className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-3.5"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {t.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.logo}
                      alt=""
                      className="h-9 w-9 rounded-lg border border-slate-200 object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-slate-500">
                        {t.name.slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[14px] font-medium text-slate-900 truncate">
                        {t.name}
                      </span>
                      <Badge variant="neutral" className="shrink-0">
                        {t.category}
                      </Badge>
                    </div>
                    <div className="text-[12px] text-slate-500 truncate">
                      {t.ownerName || t.ownerEmail || 'unknown submitter'} ·{' '}
                      {format(new Date(t.createdAt), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:ml-2">
                  <Button
                    asChild
                    variant="keedaGhost"
                    size="keedaSm"
                    title="Open submitted website"
                  >
                    <a href={t.websiteUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                  <Button
                    variant="keedaOutline"
                    size="keedaSm"
                    onClick={() => setRejectTarget({ id: t.id, name: t.name })}
                    disabled={busy}
                    className="text-red-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    <span className="ml-1">Reject</span>
                  </Button>
                  <Button
                    variant="keeda"
                    size="keedaSm"
                    onClick={() => approve.mutate({ id: t.id })}
                    disabled={busy}
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span className="ml-1">Approve</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <RejectToolDialog
        tool={rejectTarget}
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        onConfirm={async (reason) => {
          if (!rejectTarget) return;
          await reject.mutateAsync({ id: rejectTarget.id, reason });
        }}
      />
    </div>
  );
}
