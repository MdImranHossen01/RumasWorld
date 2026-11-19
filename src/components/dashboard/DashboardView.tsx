'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DollarSign,
  Users,
  ShoppingBag,
  AlertTriangle,
  Clock,
  Wallet,
  Loader2,
  TrendingUp,
  Filter,
  Package,
  RefreshCw,
  Landmark,
  AlertCircle,
  BarChart3,
  Coins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { format, subDays, parseISO, isAfter, startOfToday } from 'date-fns';
import { AdminDashboardSkeleton } from '@/components/admin/AdminSkeletons';

const chartConfig = {
  revenue: {
    label: 'Total Revenue',
    color: 'var(--primary)',
  },
  profit: {
    label: 'Gross Profit',
    color: '#10b981',
  },
  orders: {
    label: 'Orders Count',
    color: '#f59e0b',
  },
  expense: {
    label: 'Total Expenses',
    color: '#ef4444',
  },
} satisfies ChartConfig;

const expenseChartConfig = {
  cogs: {
    label: 'Product COGS',
    color: 'var(--chart-1)',
  },
  logistics: {
    label: 'Logistics',
    color: 'var(--chart-4)',
  },
  other: {
    label: 'Other Expenses',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

const orderStatusChartConfig = {
  pending: {
    label: 'Pending',
    color: 'var(--chart-4)',
  },
  processing: {
    label: 'Processing',
    color: 'var(--chart-1)',
  },
  delivered: {
    label: 'Delivered',
    color: 'var(--chart-2)',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

const customersChartConfig = {
  customers: {
    label: 'Customers',
    color: 'var(--chart-1)',
  },
  newBuyers: {
    label: 'New Buyers',
    color: 'var(--chart-2)',
  },
  returning: {
    label: 'Returning',
    color: 'var(--chart-3)',
  },
  subscribers: {
    label: 'Subscribers',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

const liquidAccountsChartConfig = {
  cash: {
    label: 'Cash in Hand',
    color: 'var(--chart-2)',
  },
  bank: {
    label: 'Bank Accounts',
    color: 'var(--chart-1)',
  },
  mfs: {
    label: 'Mobile Wallets',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

const assetsChartConfig = {
  inventory: {
    label: 'Inventory Value',
    color: 'var(--chart-2)',
  },
  receivables: {
    label: 'Receivables',
    color: 'var(--chart-1)',
  },
  liquid: {
    label: 'Liquid Funds',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

const payablesChartConfig = {
  suppliers: {
    label: 'Supplier Bills',
    color: 'var(--chart-1)',
  },
  matured: {
    label: 'Matured Due',
    color: 'var(--chart-4)',
  },
  loans: {
    label: 'Business Loans',
    color: 'var(--chart-5)',
  },
  pendingExp: {
    label: 'Pending Exp.',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const dateStr = label ? format(parseISO(label), 'dd MMMM yyyy') : '';

  return (
    <div className="bg-background/95 backdrop-blur-md border rounded-xl shadow-xl p-3.5 text-xs space-y-2 min-w-[200px]">
      <p className="font-bold text-foreground border-b pb-1.5">{dateStr}</p>
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Revenue:</span>
          <span className="font-bold text-primary">৳{Math.round(data.revenue || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Gross Profit:</span>
          <span className="font-bold text-emerald-600">৳{Math.round(data.profit || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Expense:</span>
          <span className="font-bold text-rose-600">৳{Math.round(data.expense || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Orders:</span>
          <span className="font-bold text-amber-600">{data.orders || 0}</span>
        </div>
        <div className="flex justify-between items-center border-t pt-1">
          <span className="font-semibold text-foreground">Net Income:</span>
          <span className={`font-bold ${(data.netIncome || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ৳{Math.round(data.netIncome || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000;

export function DashboardView({ activeTab: _activeTab }: { activeTab?: 'cards' | 'report' | 'insight' }) {
  const { data: session } = useSession();
  const userName = session?.user?.name ? session.user.name.split(' ')[0] : 'Admin';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>('revenue');

  // Date filter state
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  const [debouncedDateRange, setDebouncedDateRange] = useState(dateRange);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Add Balance Modal State
  const [isAddBalanceOpen, setIsAddBalanceOpen] = useState(false);
  const [addBalanceTargetType, setAddBalanceTargetType] = useState<'Cash' | 'Bank' | 'MFS'>('Cash');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [fundSourceType, setFundSourceType] = useState('Income');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [lenderId, setLenderId] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [loanAmount, setLoanAmount] = useState<number | ''>('');
  const [repaymentType, setRepaymentType] = useState<'One-time' | 'Installment'>('One-time');
  const [expectedRepaymentDate, setExpectedRepaymentDate] = useState('');
  const [totalRepaymentAmount, setTotalRepaymentAmount] = useState<number | ''>('');
  const [installmentCount, setInstallmentCount] = useState<number | ''>('');
  const [installmentAmount, setInstallmentAmount] = useState<number | ''>('');
  const [installmentDayOfMonth, setInstallmentDayOfMonth] = useState<number | ''>('');
  const [submittingBalance, setSubmittingBalance] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDateRange(dateRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [dateRange]);

  const handleDateChange = (key: 'from' | 'to', value: string) => {
    const newDate = parseISO(value);
    const today = startOfToday();

    if (isAfter(newDate, today)) {
      setDateRange(prev => ({ ...prev, [key]: format(today, 'yyyy-MM-dd') }));
      return;
    }

    setDateRange(prev => {
      const nextRange = { ...prev, [key]: value };
      const fromDate = parseISO(nextRange.from);
      const toDate = parseISO(nextRange.to);

      if (isAfter(fromDate, toDate)) {
        if (key === 'from') {
          return { ...nextRange, to: value };
        } else {
          return { ...nextRange, from: value };
        }
      }
      return nextRange;
    });
  };

  const setPresetRange = (days: number) => {
    setDateRange({
      from: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const fetchStats = async (force = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const query = new URLSearchParams({
      from: debouncedDateRange.from,
      to: debouncedDateRange.to,
    }).toString();

    const cached = statsCache.get(query);
    if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/dashboard/stats?${query}`, {
        signal: controller.signal,
      });
      if (response.ok) {
        const statsData = await response.json();
        setData(statsData);
        statsCache.set(query, { data: statsData, timestamp: Date.now() });
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || `Failed to fetch: ${response.status}`);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Failed to fetch stats:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStats();
  }, [debouncedDateRange]);

  useEffect(() => {
    const handleRefresh = () => fetchStats(true);
    window.addEventListener('refresh-dashboard', handleRefresh);
    return () => window.removeEventListener('refresh-dashboard', handleRefresh);
  }, [debouncedDateRange]);

  const openAddBalance = (e: React.MouseEvent, type: 'Cash' | 'Bank' | 'MFS') => {
    e.preventDefault();
    e.stopPropagation();
    setAddBalanceTargetType(type);

    if (type === 'Cash') {
      const cashAcc = data?.stats?.ledgerAccounts?.find((a: any) => a.code === 'CASH' || a.accountCategory === 'Cash');
      setTargetAccountId(cashAcc ? cashAcc._id : '');
    } else {
      setTargetAccountId('');
    }

    setFundSourceType('Income');
    setSourceAccountId('');
    setLenderId('');
    setLenderName('');
    setLoanAmount('');
    setRepaymentType('One-time');
    setExpectedRepaymentDate('');
    setTotalRepaymentAmount('');
    setInstallmentCount('');
    setInstallmentAmount('');
    setInstallmentDayOfMonth('');
    setIsAddBalanceOpen(true);
  };

  const handleAddBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccountId) {
      toast.error('Please select a target account');
      return;
    }

    setSubmittingBalance(true);
    try {
      const res = await fetch('/api/admin/dashboard/add-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAccountId,
          sourceType: fundSourceType,
          sourceAccountId,
          lenderId,
          lenderName,
          amount: loanAmount || 0,
          repaymentType,
          expectedRepaymentDate,
          totalRepaymentAmount: totalRepaymentAmount || 0,
          installmentCount: installmentCount || 0,
          installmentAmount: installmentAmount || 0,
          installmentDayOfMonth: installmentDayOfMonth || 1,
        }),
      });

      if (res.ok) {
        toast.success('Balance added successfully');
        setIsAddBalanceOpen(false);
        fetchStats(true);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to add balance');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setSubmittingBalance(false);
    }
  };

  const total = useMemo(() => {
    if (!data?.chartData) return { revenue: 0, profit: 0, orders: 0, expense: 0 };
    return {
      revenue: data.chartData.reduce((acc: number, curr: any) => acc + (curr.revenue || 0), 0),
      profit: data.chartData.reduce((acc: number, curr: any) => acc + (curr.profit || 0), 0),
      orders: data.chartData.reduce((acc: number, curr: any) => acc + (curr.orders || 0), 0),
      expense: data.chartData.reduce((acc: number, curr: any) => acc + (curr.expense || 0), 0),
    };
  }, [data]);

  const processedChartData = useMemo(() => {
    if (!data?.chartData) return [];

    const start = parseISO(dateRange.from);
    const end = parseISO(dateRange.to);
    const result = [];

    const dataMap = new Map(data.chartData.map((item: any) => [item.date, item]));

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      const existing = dataMap.get(dateStr);
      if (existing) {
        result.push(existing);
      } else {
        result.push({
          date: dateStr,
          revenue: 0,
          profit: 0,
          orders: 0,
          expense: 0,
          netIncome: 0,
        });
      }
    }
    return result;
  }, [data, dateRange]);

  const expenseData = useMemo(() => {
    const cogs = data?.stats?.totalCOGS || 0;
    const delivery = data?.stats?.totalDeliveryCharge || 0;
    const totalExp = data?.stats?.totalExpenses || 0;
    const other = Math.max(0, totalExp - cogs - delivery);

    return [
      { type: 'cogs', label: 'Product COGS', amount: cogs, fill: 'var(--color-cogs)' },
      { type: 'logistics', label: 'Logistics', amount: delivery, fill: 'var(--color-logistics)' },
      { type: 'other', label: 'Other Expenses', amount: other, fill: 'var(--color-other)' },
    ].filter(d => d.amount > 0);
  }, [data?.stats]);

  const orderStatusData = useMemo(() => {
    const pending = data?.stats?.pendingOrdersCount || 0;
    const processing = data?.stats?.processingOrdersCount || 0;
    const delivered = data?.stats?.deliveredOrdersCount || 0;
    const cancelled = data?.stats?.cancelledOrdersCount || 0;

    return [
      { status: 'pending', count: pending, fill: 'var(--color-pending)' },
      { status: 'processing', count: processing, fill: 'var(--color-processing)' },
      { status: 'delivered', count: delivered, fill: 'var(--color-delivered)' },
      { status: 'cancelled', count: cancelled, fill: 'var(--color-cancelled)' },
    ].filter(d => d.count > 0);
  }, [data?.stats]);

  const customersChartData = useMemo(() => {
    return [
      { category: 'Customers', count: data?.stats?.totalCustomers || 0, fill: 'var(--color-customers)' },
      { category: 'New Buyers', count: data?.stats?.newUsersCount || 0, fill: 'var(--color-newBuyers)' },
      { category: 'Returning', count: data?.stats?.returningUsersCount || 0, fill: 'var(--color-returning)' },
      { category: 'Subscribers', count: data?.stats?.subscribersCount || 0, fill: 'var(--color-subscribers)' },
    ];
  }, [data?.stats]);

  const liquidAccountsData = useMemo(() => {
    const cash = Math.max(0, data?.stats?.cashBalance || 0);
    const bank = Math.max(0, data?.stats?.bankBalance || 0);
    const mfs = Math.max(0, data?.stats?.mfsBalanceTotal || 0);
    return [
      { account: 'Cash', balance: cash, fill: 'var(--chart-2)' },
      { account: 'Bank', balance: bank, fill: 'var(--chart-1)' },
      { account: 'Mobile Wallets', balance: mfs, fill: 'var(--chart-3)' },
    ];
  }, [data?.stats]);

  const assetsDistributionData = useMemo(() => {
    const inv = data?.stats?.totalStockValue || 0;
    const rec = data?.stats?.totalReceivable || 0;
    const liquid = Math.max(0, (data?.stats?.cashBalance || 0) + (data?.stats?.bankBalance || 0) + (data?.stats?.mfsBalanceTotal || 0));

    return [
      { name: 'Inventory', value: inv, fill: 'var(--color-inventory)' },
      { name: 'Receivables', value: rec, fill: 'var(--color-receivables)' },
      { name: 'Liquid Funds', value: liquid, fill: 'var(--color-liquid)' },
    ].filter(d => d.value > 0);
  }, [data?.stats]);

  const payablesDistributionData = useMemo(() => {
    const suppliers = data?.stats?.supplierBillsDueTotal || 0;
    const matured = data?.stats?.maturedPayable || 0;
    const loans = data?.stats?.totalActiveLoansDue || 0;
    const pendingExp = data?.stats?.pendingExpenseTotal || 0;

    return [
      { type: 'Suppliers', amount: suppliers, fill: 'var(--color-suppliers)' },
      { type: 'Matured', amount: matured, fill: 'var(--color-matured)' },
      { type: 'Loans', amount: loans, fill: 'var(--color-loans)' },
      { type: 'Pending Exp.', amount: pendingExp, fill: 'var(--color-pendingExp)' },
    ].filter(d => d.amount > 0);
  }, [data?.stats]);

  if (loading && !data) {
    return <AdminDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-8 w-8" />
          <h3 className="text-xl font-bold">Dashboard Error</h3>
        </div>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => fetchStats(true)}>Retry</Button>
      </div>
    );
  }

  const { stats, lowStockProducts, last7DaysStats, topSellingProducts, topCustomers } = data || {};

  return (
    <div className="flex-1 space-y-6 p-2 md:p-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome Back{userName ? `, ${userName}` : ''}! 👋
          </h2>
          {lastUpdated && (
            <p className="text-muted-foreground text-xs opacity-70 mt-1">
              Updated at {lastUpdated}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="hidden sm:flex items-center bg-muted/40 rounded-lg p-0.5 border h-8">
            <button
              onClick={() => setPresetRange(7)}
              className="text-[11px] px-2 py-0.5 rounded hover:bg-background font-semibold transition-colors"
            >
              7D
            </button>
            <button
              onClick={() => setPresetRange(30)}
              className="text-[11px] px-2 py-0.5 rounded hover:bg-background font-semibold transition-colors"
            >
              30D
            </button>
            <button
              onClick={() => setPresetRange(90)}
              className="text-[11px] px-2 py-0.5 rounded hover:bg-background font-semibold transition-colors"
            >
              90D
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-lg border h-8 w-full sm:w-auto">
            <div className="flex items-center gap-1 shrink-0">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Range</span>
            </div>
            <div className="flex items-center gap-1 flex-1 sm:flex-initial">
              <Input
                type="date"
                className="h-6 w-full sm:w-28 border-none bg-transparent focus-visible:ring-0 cursor-pointer text-[11px] p-0"
                value={dateRange.from}
                onChange={(e) => handleDateChange('from', e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
              <span className="text-muted-foreground text-[9px] shrink-0 font-medium">to</span>
              <Input
                type="date"
                className="h-6 w-full sm:w-28 border-none bg-transparent focus-visible:ring-0 cursor-pointer text-[11px] p-0"
                value={dateRange.to}
                onChange={(e) => handleDateChange('to', e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>

          <Button variant="outline" size="icon" onClick={() => fetchStats(true)} className="h-8 w-8 rounded-lg shrink-0" title="Refresh">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* 2. Top 8 KPI Cards (2 rows of 4 cards — Single-Tenant E-Commerce) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Sales Card */}
        <Link
          href="/admin/orders"
          className="relative overflow-hidden bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-card border border-blue-500/30 dark:border-blue-500/20 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-500/50 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Total Sales</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                ৳{Math.round(stats?.totalRevenue || 0).toLocaleString()}
              </h3>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-blue-500/20 mt-4">
            {(() => {
              const g = stats?.growth?.revenue ?? 0;
              return (
                <span className={`text-xs font-bold flex items-center gap-1 ${g >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {g >= 0 ? `↑ +${g}%` : `↓ ${g}%`}{' '}
                  <span className="text-muted-foreground font-normal">vs. previous period</span>
                </span>
              );
            })()}
            <BarChart3 className="h-4 w-4 text-blue-500 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* 2. Gross Profit Card */}
        <Link
          href="/admin/orders"
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-card border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Coins className="h-6 w-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Gross Profit</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                ৳{Math.round(stats?.grossProfit || 0).toLocaleString()}
              </h3>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-emerald-500/20 mt-4">
            {(() => {
              const g = stats?.growth?.profit ?? 0;
              return (
                <span className={`text-xs font-bold flex items-center gap-1 ${g >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {g >= 0 ? `↑ +${g}%` : `↓ ${g}%`}{' '}
                  <span className="text-muted-foreground font-normal">vs. previous period</span>
                </span>
              );
            })()}
            <TrendingUp className="h-4 w-4 text-emerald-500 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* 3. Total Expenses Card */}
        <Link
          href="/admin/expenses-incomes"
          className="relative overflow-hidden bg-gradient-to-br from-sky-500/15 via-blue-500/10 to-card border border-sky-500/30 dark:border-sky-500/20 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-sky-500/50 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="p-3.5 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">Total Expenses</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                ৳{Math.round(stats?.totalExpenses || 0).toLocaleString()}
              </h3>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-sky-500/20 mt-4">
            {(() => {
              const g = stats?.growth?.expense ?? 0;
              return (
                <span className={`text-xs font-bold flex items-center gap-1 ${g <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {g <= 0 ? `↓ ${g}%` : `↑ +${g}%`}{' '}
                  <span className="text-muted-foreground font-normal">vs. previous period</span>
                </span>
              );
            })()}
            <BarChart3 className="h-4 w-4 text-sky-500 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* 4. Pending Orders Card */}
        <Link
          href="/admin/orders"
          className="relative overflow-hidden bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-card border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-amber-500/50 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending Orders</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {stats?.pendingOrdersCount || 0}
              </h3>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-amber-500/20 mt-4">
            {(() => {
              const g = stats?.growth?.orders ?? 0;
              return (
                <span className={`text-xs font-bold flex items-center gap-1 ${g >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {g >= 0 ? `↗ +${g}%` : `↘ ${g}%`}{' '}
                  <span className="text-muted-foreground font-normal">vs. previous period</span>
                </span>
              );
            })()}
            <Clock className="h-4 w-4 text-amber-500 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* 5. Total Customers Card */}
        <Link
          href="/admin/users"
          className="relative overflow-hidden bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-card border border-purple-500/30 dark:border-purple-500/20 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-purple-500/50 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="p-3.5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Total Customers</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {stats?.totalCustomers || 0}
              </h3>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-purple-500/20 mt-4">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <span className="text-purple-600 dark:text-purple-400 font-bold">New: {stats?.newUsersCount || 0}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Repeat: {stats?.returningUsersCount || 0}</span>
            </span>
            <Users className="h-4 w-4 text-purple-500 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* 6. Total Products Card */}
        <Link
          href="/admin/products"
          className="relative overflow-hidden bg-gradient-to-br from-teal-500/15 via-emerald-500/10 to-card border border-teal-500/30 dark:border-teal-500/20 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-teal-500/50 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="p-3.5 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-xl shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Package className="h-6 w-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">Total Products</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {stats?.totalProductsCount || 0}
              </h3>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-teal-500/20 mt-4">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <span className="text-teal-600 dark:text-teal-400 font-bold">Published: {stats?.publishedProductsCount || 0}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">Expiring: {stats?.expiringProductsCount || 0}</span>
            </span>
            <Package className="h-4 w-4 text-teal-500 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* 7. Accounts Receivable Card */}
        <Link
          href="/admin/ledger/receivable"
          className="relative overflow-hidden bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-card border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-amber-500/50 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="p-3.5 bg-gradient-to-br from-amber-500 to-yellow-600 text-white rounded-xl shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="h-6 w-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Accounts Receivable</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                ৳{Math.round(stats?.totalReceivable || 0).toLocaleString()}
              </h3>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-amber-500/20 mt-4">
            <span className="text-xs font-bold flex items-center gap-1 text-amber-600 dark:text-amber-400">
              Matured: ৳{Math.round(stats?.maturedReceivable || 0).toLocaleString()}{' '}
              <span className="text-muted-foreground font-normal">overdue bills</span>
            </span>
            <Clock className="h-4 w-4 text-amber-500 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* 8. Accounts Payable Card */}
        <Link
          href="/admin/ledger/payable"
          className="relative overflow-hidden bg-gradient-to-br from-rose-500/15 via-red-500/10 to-card border border-rose-500/30 dark:border-rose-500/20 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-rose-500/50 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="p-3.5 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-xl shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Accounts Payable</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                ৳{Math.round((stats?.supplierBillsDueTotal || 0) + (stats?.totalActiveLoansDue || 0)).toLocaleString()}
              </h3>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-rose-500/20 mt-4">
            <span className="text-xs font-bold flex items-center gap-1 text-rose-600 dark:text-rose-400">
              Matured: ৳{Math.round(stats?.maturedPayable || 0).toLocaleString()}{' '}
              <span className="text-muted-foreground font-normal">due now</span>
            </span>
            <AlertCircle className="h-4 w-4 text-rose-500 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 3. Expense Breakdown & Orders Status Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expense Breakdown Donut Chart */}
        <Card className="shadow-xs rounded-2xl border">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Expense Breakdown
            </CardTitle>
            <CardDescription className="text-xs">Distribution of business expenses</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/2 h-[160px] relative flex items-center justify-center">
              <ChartContainer config={expenseChartConfig} className="mx-auto aspect-square h-[155px] w-[155px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={expenseData.length > 0 ? expenseData : [{ type: 'cogs', amount: 1, fill: 'var(--muted)' }]}
                    dataKey="amount"
                    nameKey="type"
                    innerRadius={42}
                    outerRadius={62}
                    strokeWidth={3}
                    stroke="var(--background)"
                  />
                </PieChart>
              </ChartContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xs font-black text-foreground">
                  ৳{Math.round(stats?.totalExpenses || 0).toLocaleString()}
                </span>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase">Expenses</span>
              </div>
            </div>

            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-1)]" /> Product COGS
                </span>
                <span className="font-bold text-foreground">
                  ৳{Math.round(stats?.totalCOGS || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-4)]" /> Logistics
                </span>
                <span className="font-bold text-foreground">
                  ৳{Math.round(stats?.totalDeliveryCharge || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-5)]" /> Other Expenses
                </span>
                <span className="font-bold text-foreground">
                  ৳{Math.round(Math.max(0, (stats?.totalExpenses || 0) - (stats?.totalCOGS || 0) - (stats?.totalDeliveryCharge || 0))).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Status Donut Chart */}
        <Card className="shadow-xs rounded-2xl border">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Orders Status
            </CardTitle>
            <CardDescription className="text-xs">Live order workflow tracking</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/2 h-[160px] relative flex items-center justify-center">
              <ChartContainer config={orderStatusChartConfig} className="mx-auto aspect-square h-[155px] w-[155px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={orderStatusData.length > 0 ? orderStatusData : [{ status: 'pending', count: 1, fill: 'var(--muted)' }]}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={42}
                    outerRadius={62}
                    strokeWidth={3}
                    stroke="var(--background)"
                  />
                </PieChart>
              </ChartContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-foreground">
                  {stats?.pendingOrdersCount || 0}
                </span>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase">Pending</span>
              </div>
            </div>

            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-4)]" /> Pending
                </span>
                <span className="font-bold text-foreground">{stats?.pendingOrdersCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-1)]" /> Processing
                </span>
                <span className="font-bold text-foreground">{stats?.processingOrdersCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-2)]" /> Delivered
                </span>
                <span className="font-bold text-foreground">{stats?.deliveredOrdersCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-5)]" /> Cancelled
                </span>
                <span className="font-bold text-foreground">{stats?.cancelledOrdersCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Row: Customers & Buyers, Liquid Accounts, Inventory & Stock with Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customers & Buyers Horizontal Bar Chart */}
        <div className="bg-card rounded-2xl border p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-foreground">Customers & Buyers</span>
              </div>
              <Link href="/admin/users" className="text-xs font-semibold text-primary hover:underline">
                View Details &rarr;
              </Link>
            </div>

            <div className="py-3">
              <ChartContainer config={customersChartConfig} className="aspect-auto h-[105px] w-full">
                <BarChart
                  accessibilityLayer
                  data={customersChartData}
                  layout="vertical"
                  margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tickLine={false}
                    tickMargin={6}
                    axisLine={false}
                    fontSize={11}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="count" radius={4}>
                    {customersChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-muted/50 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Newsletter Subscribers:</span>
              <span className="font-semibold text-foreground">{stats?.subscribersCount || 0}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Registered Suppliers:</span>
              <span className="font-bold text-foreground">{stats?.totalSuppliersCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Liquid Accounts with Visual Donut Chart + Add Balance Buttons */}
        <div className="bg-card rounded-2xl border p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Landmark className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-foreground">Liquid Accounts</span>
              </div>
              <Link href="/admin/accounts" className="text-xs font-semibold text-primary hover:underline">
                View Details &rarr;
              </Link>
            </div>

            <div className="py-2 flex items-center justify-center gap-4">
              <div className="w-[100px] h-[100px] relative flex items-center justify-center shrink-0">
                <ChartContainer config={liquidAccountsChartConfig} className="mx-auto aspect-square h-[95px] w-[95px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={liquidAccountsData.some(d => d.balance > 0) ? liquidAccountsData : [{ account: 'Cash', balance: 1, fill: 'var(--muted)' }]}
                      dataKey="balance"
                      nameKey="account"
                      innerRadius={28}
                      outerRadius={44}
                      strokeWidth={2}
                      stroke="var(--background)"
                    />
                  </PieChart>
                </ChartContainer>
                <Coins className="h-4 w-4 text-indigo-500 absolute opacity-70" />
              </div>

              <div className="flex-1 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-[var(--chart-2)]" /> Cash
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">৳{Math.round(stats?.cashBalance || 0).toLocaleString()}</span>
                    <button
                      onClick={(e) => openAddBalance(e, 'Cash')}
                      className="p-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      title="Add Cash Balance"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-[var(--chart-1)]" /> Bank
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">৳{Math.round(stats?.bankBalance || 0).toLocaleString()}</span>
                    <button
                      onClick={(e) => openAddBalance(e, 'Bank')}
                      className="p-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      title="Add Bank Balance"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-[var(--chart-3)]" /> Mobile Wallets
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">৳{Math.round(stats?.mfsBalanceTotal || 0).toLocaleString()}</span>
                    <button
                      onClick={(e) => openAddBalance(e, 'MFS')}
                      className="p-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      title="Add MFS Balance"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-muted/50">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300">
              <span>Total Liquid Funds:</span>
              <span>৳{Math.round((stats?.cashBalance || 0) + (stats?.bankBalance || 0) + (stats?.mfsBalanceTotal || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Inventory & Stock with Visual Progress Bars */}
        <div className="bg-card rounded-2xl border p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Package className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-foreground">Inventory & Stock</span>
              </div>
              <Link href="/admin/products" className="text-xs font-semibold text-primary hover:underline">
                View Details &rarr;
              </Link>
            </div>

            {(() => {
              const totalStockQuantity = stats?.totalStockQuantity || 0;
              const totalStockValue = stats?.totalStockValue || 0;
              const totalAssetValue = stats?.totalAssetValue || 0;
              const totalProductsCount = stats?.totalProductsCount || 0;
              const lowStockCount = lowStockProducts?.length || 0;

              const stockQuantityPercentage = totalStockQuantity <= 0
                ? 0
                : totalProductsCount > 0
                  ? Math.min(100, Math.max(8, Math.round(((totalProductsCount - lowStockCount) / totalProductsCount) * 100)))
                  : 100;

              const stockValuePercentage = totalStockValue <= 0
                ? 0
                : totalAssetValue > 0
                  ? Math.min(100, Math.max(5, Math.round((totalStockValue / totalAssetValue) * 100)))
                  : 100;

              return (
                <div className="py-3 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-muted-foreground">Total Stock Units</span>
                      <span className="font-bold text-foreground">{totalStockQuantity.toLocaleString()} pcs</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${stockQuantityPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-muted-foreground">Stock Value (at cost)</span>
                      <span className="font-bold text-foreground">৳{Math.round(totalStockValue).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${stockValuePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="pt-2 border-t border-muted/50 flex justify-between items-center text-xs">
            <Link href="/admin/low-stock" className="text-rose-600 font-semibold flex items-center gap-1 hover:underline">
              <AlertCircle className="h-3.5 w-3.5" /> Low Stock Alerts:
            </Link>
            <Badge variant="destructive" className="h-5 px-2 text-[10px] font-bold">
              {lowStockProducts?.length || 0} items
            </Badge>
          </div>
        </div>
      </div>

      {/* 5. Row: Business Assets Summary & Payables / Liabilities with Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Business Assets Summary */}
        <div className="bg-card rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 py-3 px-4 flex items-center justify-between">
              <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                <Landmark className="h-4 w-4" /> Business Assets Summary
              </span>
              <Link
                href="/admin/ledger/receivable"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 uppercase tracking-wider hover:underline"
              >
                View &rarr;
              </Link>
            </div>

            <div className="p-4 flex items-center gap-4">
              <div className="w-[100px] h-[100px] relative flex items-center justify-center shrink-0">
                <ChartContainer config={assetsChartConfig} className="mx-auto aspect-square h-[95px] w-[95px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={assetsDistributionData.length > 0 ? assetsDistributionData : [{ name: 'Inventory', value: 1, fill: 'var(--muted)' }]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={28}
                      outerRadius={45}
                      strokeWidth={2}
                      stroke="var(--background)"
                    />
                  </PieChart>
                </ChartContainer>
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-2)] shrink-0" /> Inventory Stock:
                  </span>
                  <span className="font-semibold text-foreground">৳{Math.round(stats?.totalStockValue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-1)] shrink-0" /> Accounts Receivable:
                  </span>
                  <span className="font-bold text-primary">৳{Math.round(stats?.totalReceivable || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-3)] shrink-0" /> Cash, Bank & MFS:
                  </span>
                  <span className="font-semibold text-foreground">
                    ৳{Math.round((stats?.cashBalance || 0) + (stats?.bankBalance || 0) + (stats?.mfsBalanceTotal || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-500/5 border-t border-emerald-500/10 flex justify-between items-center font-bold text-sm text-emerald-600 dark:text-emerald-400">
            <span>Total Assets:</span>
            <span className="text-base">৳{Math.round(stats?.totalAssetValue || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Payables & Business Liabilities with Visual Horizontal Bars */}
        <div className="bg-card rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-sky-500/10 border-b border-sky-500/20 py-3 px-4 flex items-center justify-between">
              <span className="font-bold text-sky-700 dark:text-sky-300 text-sm flex items-center gap-1.5">
                <Wallet className="h-4 w-4" /> Payables & Business Liabilities
              </span>
              <Link
                href="/admin/ledger/payable"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:hover:text-sky-400 uppercase tracking-wider hover:underline"
              >
                View &rarr;
              </Link>
            </div>

            <div className="p-4 space-y-3">
              <ChartContainer config={payablesChartConfig} className="aspect-auto h-[80px] w-full">
                <BarChart
                  accessibilityLayer
                  data={payablesDistributionData.length > 0 ? payablesDistributionData : [{ type: 'Suppliers', amount: 0, fill: 'var(--muted)' }]}
                  layout="vertical"
                  margin={{ left: 10, right: 20, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="type"
                    type="category"
                    tickLine={false}
                    tickMargin={6}
                    axisLine={false}
                    fontSize={11}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="amount" radius={4}>
                    {payablesDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>

              <div className="space-y-1.5 text-xs border-t pt-2">
                <div className="flex justify-between items-center text-muted-foreground">
                  <Link href="/admin/supplier-bills?status=due" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-1)] shrink-0" />
                    <span>Supplier Bills (Accounts Payable):</span>
                  </Link>
                  <span className="font-semibold text-foreground">৳{Math.round(stats?.supplierBillsDueTotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-4)] shrink-0" /> Matured Supplier & Loan Dues:
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">৳{Math.round(stats?.maturedPayable || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <Link href="/admin/loans" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-5)] shrink-0" />
                    <span>Business Loans (Active):</span>
                  </Link>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">৳{Math.round(stats?.totalActiveLoansDue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-2)] shrink-0" /> Pending Expense Approvals ({stats?.pendingExpenseCount || 0}):
                  </span>
                  <span className="font-semibold text-foreground">৳{Math.round(stats?.pendingExpenseTotal || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-sky-500/5 border-t border-sky-500/10 flex justify-between items-center font-bold text-sm text-sky-600 dark:text-sky-400">
            <span>Total Payable Obligations:</span>
            <span className="text-base">
              ৳{Math.round((stats?.supplierBillsDueTotal || 0) + (stats?.totalActiveLoansDue || 0) + (stats?.pendingExpenseTotal || 0)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Full-Width Interactive Performance Trends Chart */}
      <Card className="shadow-xs rounded-2xl border overflow-hidden">
        <CardHeader className="flex flex-col items-stretch border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-4 md:px-6 md:py-6">
            <CardTitle className="text-lg md:text-xl">Performance Trends</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Daily business metrics, dynamic average lines, and net ledger balances.
            </CardDescription>
          </div>
          <div className="flex overflow-x-auto border-t sm:border-t-0 no-scrollbar">
            {[
              { key: 'revenue', label: 'Revenue', val: `৳${Math.round(total.revenue).toLocaleString()}` },
              { key: 'profit', label: 'Gross Profit', val: `৳${Math.round(total.profit).toLocaleString()}` },
              { key: 'orders', label: 'Sales Orders', val: total.orders.toLocaleString() },
              { key: 'expense', label: 'Expenses', val: `৳${Math.round(total.expense).toLocaleString()}` },
            ].map((item) => {
              const chart = item.key as keyof typeof chartConfig;
              return (
                <button
                  key={chart}
                  data-active={activeChart === chart}
                  className="flex flex-1 flex-col justify-center gap-1 border-r px-4 py-3 text-left data-[active=true]:bg-muted/50 sm:px-6 sm:py-4 transition-colors shrink-0"
                  onClick={() => setActiveChart(chart)}
                >
                  <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
                  <span className="text-sm sm:text-base font-bold leading-none text-foreground">{item.val}</span>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[280px] md:h-[340px] w-full">
            <AreaChart data={processedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={28}
                tickFormatter={(value) => format(parseISO(value), 'dd MMM')}
              />
              <Tooltip content={<CustomChartTooltip activeChart={activeChart} />} />
              <ReferenceLine
                y={(total[activeChart] || 0) / (processedChartData?.length || 1)}
                label={{ value: 'Avg', position: 'insideRight', fill: 'var(--muted-foreground)', fontSize: 10 }}
                stroke="var(--muted-foreground)"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <Area
                dataKey="revenue"
                type="monotone"
                fill="url(#fillRevenue)"
                stroke="var(--primary)"
                strokeWidth={2}
                hide={activeChart !== 'revenue'}
              />
              <Area
                dataKey="profit"
                type="monotone"
                fill="url(#fillProfit)"
                stroke="#10b981"
                strokeWidth={2}
                hide={activeChart !== 'profit'}
              />
              <Area
                dataKey="orders"
                type="monotone"
                fill="url(#fillOrders)"
                stroke="#f59e0b"
                strokeWidth={2}
                hide={activeChart !== 'orders'}
              />
              <Area
                dataKey="expense"
                type="monotone"
                fill="url(#fillExpense)"
                stroke="#ef4444"
                strokeWidth={2}
                hide={activeChart !== 'expense'}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* 7. Last 7 Days Daily Performance Matrix Table */}
      <div className="bg-card rounded-2xl border shadow-xs overflow-hidden">
        <div className="bg-muted/40 py-3 px-4 flex items-center justify-between border-b">
          <span className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary shrink-0" /> Last 7 Days Breakdown
          </span>
          <Badge variant="outline" className="text-[10px]">Live Matrix</Badge>
        </div>

        <div className="hidden sm:block overflow-x-auto p-3">
          <table className="w-full min-w-[600px] border-collapse text-xs md:text-sm text-center">
            <thead>
              <tr className="border-b bg-muted/20 text-muted-foreground font-semibold">
                <th className="p-2.5 text-left font-bold text-foreground">Date</th>
                <th className="p-2.5 font-bold text-emerald-600">Sales Revenue</th>
                <th className="p-2.5 font-bold text-blue-600">Collected</th>
                <th className="p-2.5 font-bold text-amber-600">Orders</th>
                <th className="p-2.5 font-bold text-rose-600">Expenses</th>
                <th className="p-2.5 font-bold text-primary text-right">Net Daily</th>
              </tr>
            </thead>
            <tbody>
              {last7DaysStats && last7DaysStats.length > 0 ? (
                last7DaysStats.map((day: any) => (
                  <tr key={day.date} className="border-b border-muted/30 hover:bg-muted/30 transition-colors">
                    <td className="p-2.5 text-left font-medium text-foreground">{day.displayDate}</td>
                    <td className="p-2.5 font-semibold text-emerald-600">৳{Math.round(day.sales || 0).toLocaleString()}</td>
                    <td className="p-2.5 font-medium text-foreground">৳{Math.round(day.collected || 0).toLocaleString()}</td>
                    <td className="p-2.5 font-bold text-foreground">{day.orders || 0}</td>
                    <td className="p-2.5 font-medium text-rose-600">৳{Math.round(day.expense || 0).toLocaleString()}</td>
                    <td className={`p-2.5 font-bold text-right ${(day.net || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ৳{Math.round(day.net || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground italic">No data recorded for the last 7 days.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden p-2.5 space-y-2">
          {last7DaysStats && last7DaysStats.length > 0 ? (
            last7DaysStats.map((day: any) => (
              <div key={day.date} className="bg-background border border-border/80 rounded-xl p-3 text-xs space-y-2 shadow-2xs">
                <div className="flex items-center justify-between font-bold border-b pb-1.5">
                  <span className="text-foreground">{day.displayDate}</span>
                  <span className={(day.net || 0) >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    Net: ৳{Math.round(day.net || 0).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue:</span>
                    <span className="font-semibold text-emerald-600">৳{Math.round(day.sales || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collected:</span>
                    <span className="font-semibold text-foreground">৳{Math.round(day.collected || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orders:</span>
                    <span className="font-semibold text-amber-600">{day.orders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expense:</span>
                    <span className="font-semibold text-rose-600">৳{Math.round(day.expense || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground italic text-xs">No data recorded.</div>
          )}
        </div>
      </div>

      {/* 8. Bottom Grid: Top 5 Best-Selling Products & Top 5 Customers (Single-Tenant Relevant) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Best-Selling Products */}
        <div className="bg-card rounded-2xl border shadow-xs overflow-hidden">
          <div className="bg-muted/40 py-3.5 px-4 flex items-center justify-between gap-2 border-b">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                <Star className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Top 5 Best-Selling Products</h3>
                <p className="text-[11px] text-muted-foreground">Highest revenue generating products in this period.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold" asChild>
              <Link href="/admin/products">View Products &rarr;</Link>
            </Button>
          </div>

          <div className="overflow-x-auto p-3">
            <table className="w-full border-collapse text-xs md:text-sm text-center">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground font-semibold">
                  <th className="p-2.5 text-center w-12 font-bold text-foreground">#</th>
                  <th className="p-2.5 text-left font-bold text-foreground">Product Name</th>
                  <th className="p-2.5 font-bold text-emerald-600">Units Sold</th>
                  <th className="p-2.5 font-bold text-primary text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topSellingProducts && topSellingProducts.length > 0 ? (
                  topSellingProducts.map((product: any, idx: number) => (
                    <tr key={idx} className="border-b border-muted/30 hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 text-center font-semibold text-muted-foreground">#{idx + 1}</td>
                      <td className="p-2.5 text-left font-bold text-foreground truncate max-w-[200px]">{product._id}</td>
                      <td className="p-2.5 font-semibold text-emerald-600">{product.quantity || 0} pcs</td>
                      <td className="p-2.5 font-bold text-right text-primary">৳{Math.round(product.revenue || 0).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground italic">
                      No product sales data available for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Customers */}
        <div className="bg-card rounded-2xl border shadow-xs overflow-hidden">
          <div className="bg-muted/40 py-3.5 px-4 flex items-center justify-between gap-2 border-b">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Top 5 Customers</h3>
                <p className="text-[11px] text-muted-foreground">Highest spending customers based on confirmed orders.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold" asChild>
              <Link href="/admin/users">View Customers &rarr;</Link>
            </Button>
          </div>

          <div className="overflow-x-auto p-3">
            <table className="w-full border-collapse text-xs md:text-sm text-center">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground font-semibold">
                  <th className="p-2.5 text-center w-12 font-bold text-foreground">#</th>
                  <th className="p-2.5 text-left font-bold text-foreground">Customer</th>
                  <th className="p-2.5 font-bold text-amber-600">Orders</th>
                  <th className="p-2.5 font-bold text-primary text-right">Total Spend</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers && topCustomers.length > 0 ? (
                  topCustomers.map((customer: any, idx: number) => (
                    <tr key={idx} className="border-b border-muted/30 hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 text-center font-semibold text-muted-foreground">#{idx + 1}</td>
                      <td className="p-2.5 text-left">
                        <div className="font-bold text-foreground">{customer.name || 'Customer'}</div>
                        <div className="text-[11px] text-muted-foreground">{customer.phone || customer.email || '—'}</div>
                      </td>
                      <td className="p-2.5 font-bold text-foreground">{customer.orderCount || 0}</td>
                      <td className="p-2.5 font-bold text-right text-primary">৳{Math.round(customer.totalSpend || 0).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground italic">
                      No customer spending data available for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Balance Modal */}
      <Dialog open={isAddBalanceOpen} onOpenChange={setIsAddBalanceOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Balance ({addBalanceTargetType})</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBalanceSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Target Account</Label>
              {addBalanceTargetType === 'Cash' ? (
                <div className="p-2 bg-muted/50 border rounded text-sm text-foreground">Cash Account</div>
              ) : (
                <select
                  value={targetAccountId}
                  onChange={e => setTargetAccountId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">-- Select {addBalanceTargetType} Account --</option>
                  {stats?.ledgerAccounts
                    ?.filter((a: any) => a.accountCategory === addBalanceTargetType)
                    .map((a: any) => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Source of Fund</Label>
              <select
                value={fundSourceType}
                onChange={e => setFundSourceType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="Income">Direct Income / Owner Equity</option>
                <option value="Bank">Transfer from Bank</option>
                <option value="MFS">Transfer from MFS</option>
                {addBalanceTargetType !== 'Cash' && <option value="Cash">Transfer from Cash</option>}
                <option value="Loan">Business Loan</option>
              </select>
            </div>

            {(fundSourceType === 'Bank' || fundSourceType === 'MFS' || fundSourceType === 'Cash') && (
              <div className="space-y-1.5">
                <Label>Source {fundSourceType} Account</Label>
                <select
                  value={sourceAccountId}
                  onChange={e => setSourceAccountId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">-- Select Source Account --</option>
                  {stats?.ledgerAccounts
                    ?.filter((a: any) =>
                      String(a._id) !== String(targetAccountId) &&
                      (a.accountCategory === fundSourceType || (fundSourceType === 'Cash' && a.code === 'CASH'))
                    )
                    .map((a: any) => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                </select>
              </div>
            )}

            {fundSourceType !== 'Loan' && (
              <div className="space-y-1.5">
                <Label>Amount (৳)</Label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={loanAmount || ''}
                  onChange={e => setLoanAmount(Number(e.target.value))}
                />
              </div>
            )}

            {fundSourceType === 'Loan' && (
              <div className="space-y-3 border-t pt-3">
                <div className="space-y-1.5">
                  <Label>Loan Provider</Label>
                  <select
                    value={lenderId}
                    onChange={e => {
                      const val = e.target.value;
                      setLenderId(val);
                      const found = stats?.loanProviders?.find((p: any) => p._id === val);
                      if (found) setLenderName(found.name);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">-- Select Loan Provider --</option>
                    {stats?.loanProviders?.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Principal Loan Amount (৳)</Label>
                  <Input
                    type="number"
                    required
                    min="1"
                    value={loanAmount || ''}
                    onChange={e => setLoanAmount(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Total Repayment Amount (৳)</Label>
                  <Input
                    type="number"
                    required
                    min="1"
                    value={totalRepaymentAmount || ''}
                    onChange={e => setTotalRepaymentAmount(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddBalanceOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingBalance}>
                {submittingBalance ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Save Balance
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
