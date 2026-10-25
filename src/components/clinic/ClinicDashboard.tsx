import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CirclePlus,
  Clock3,
  Package,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
  ChartNoAxesCombined,
  Activity,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { useClinicDashboardData } from '../../hooks/useClinicDashboardData';
import { useAuth } from '../../lib/auth';
import { LiquidSurface } from '../glass/LiquidGlass';

export interface DashboardData {
  today_revenue?: number | string;
  today_bills?: number;
  week_revenue?: number | string;
  outstanding_receivable?: number | string;
  outstanding_payable?: number | string;
  low_stock_count?: number;
  expiry_count_30d?: number;
  shortbook_count?: number;
  alerts?: { low_stock?: number; expiring?: number; shortbook?: number };
  daily_chart?: { date: string; revenue: number; bills?: number }[];
  weekly_chart?: { day: string; revenue: number }[];
  recent_sales?: {
    id: string;
    invoice_number?: string;
    net_amount?: number | string;
    created_at?: string;
    payment_mode?: string;
    customers?: { name?: string | null } | null;
  }[];
}
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const currency = (value: unknown) => currencyFormatter.format(Number(value) || 0);

export function ClinicDashboardView({
  data,
  name = 'there',
  loading = false,
  error = false,
  refreshing = false,
  onRefresh,
}: {
  data?: DashboardData;
  name?: string;
  loading?: boolean;
  error?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const [chartStyle, setChartStyle] = useState<'area' | 'line'>('area');
  const unavailable = error && !data;
  const bills = Number(data?.today_bills || 0);
  const chart =
    data?.daily_chart?.map((point) => ({
      day: point.date
        ? format(new Date(`${point.date.slice(0, 10)}T12:00:00`), 'EEE')
        : '',
      date: point.date?.slice(0, 10) ?? '',
      revenue: Number(point.revenue) || 0,
      bills: Number(point.bills) || 0,
    })) ||
    data?.weekly_chart?.map((point) => ({
      day: point.day,
      date: '',
      revenue: Number(point.revenue) || 0,
      bills: 0,
    })) ||
    [];
  const attention = [
    {
      label: 'Low stock',
      hint: 'Medicines to replenish',
      count: data?.alerts?.low_stock ?? data?.low_stock_count ?? 0,
      icon: Package,
      tone: 'amber',
      path: '/inventory?focus=low_stock',
    },
    {
      label: 'Expiring soon',
      hint: 'Batches within 30 days',
      count: data?.alerts?.expiring ?? data?.expiry_count_30d ?? 0,
      icon: Clock3,
      tone: 'rose',
      path: '/inventory?focus=expiring',
    },
    {
      label: 'Reorder queue',
      hint: 'Items in your shortbook',
      count: data?.alerts?.shortbook ?? data?.shortbook_count ?? 0,
      icon: ReceiptText,
      tone: 'violet',
      path: '/shortbook',
    },
  ];
  const alertTotal = attention.reduce(
    (sum, item) => sum + (Number(item.count) || 0),
    0,
  );
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const value = (amount: unknown) =>
    loading ? (
      <span className="liquid-skeleton" />
    ) : error && !data ? (
      '—'
    ) : (
      currency(amount)
    );
  return (
    <div className="liquid-dashboard" aria-busy={loading}>
      <div className="dashboard-heading">
        <div>
          <div className="dashboard-eyebrow">
            <Activity size={13} className="brand-star" aria-hidden /> PHARMACY OVERVIEW
          </div>
          <h1>
            {greeting}, <span>{name}.</span>
          </h1>
          <p>Here is how your pharmacy is doing today.</p>
          {refreshing && !loading && (
            <p className="dashboard-heading-status" aria-live="polite">
              Updating your latest figures…
            </p>
          )}
        </div>
        <div className="dashboard-heading-actions">
          <span className="dashboard-date">
            <CalendarDays size={15} />
            {format(new Date(), 'EEE, dd MMM')}
          </span>
          <button
            className="liquid-icon-button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
          >
            <RefreshCw
              size={17}
              className={refreshing ? 'dashboard-spinning' : ''}
            />
          </button>
        </div>
      </div>
      {!loading && !unavailable && alertTotal > 0 && (
        <div className="dashboard-attention-banner" role="status">
          <span className="status-dot" aria-hidden />
          <span>
            <strong>{alertTotal.toLocaleString('en-IN')}</strong> inventory
            {alertTotal === 1 ? ' item needs' : ' items need'} your attention.
          </span>
          <Link to="/inventory?focus=low_stock">Review stock</Link>
        </div>
      )}
      {error && (
        <div className="dashboard-error" role="alert">
          We couldn’t refresh your dashboard.{' '}
          {data
            ? 'Your last available figures are shown.'
            : 'Please try again.'}
          <button onClick={onRefresh}>
            Retry <RefreshCw size={13} />
          </button>
        </div>
      )}
      <div className="dashboard-overview">
        <LiquidSurface className="dashboard-revenue liquid-refractive">
          <div className="dashboard-card-heading">
            <span>
              <span className="status-dot" /> TODAY AT A GLANCE
            </span>
            <ReceiptText size={19} />
          </div>
          <div className="revenue-label">Today’s revenue</div>
          <div className="revenue-value">{value(data?.today_revenue)}</div>
          <p className="revenue-caption">
            Sales recorded across today’s invoices.
          </p>
          <div className="revenue-footer">
            <div>
              <span>Invoices created</span>
              <strong>
                {loading || unavailable ? '—' : bills.toLocaleString('en-IN')}{' '}
                <span>bills</span>
              </strong>
            </div>
            <div>
              <span>Average bill</span>
              <strong>
                {value(bills ? Number(data?.today_revenue || 0) / bills : 0)}
              </strong>
            </div>
            <Link to="/billing/new" className="liquid-primary-button">
              <CirclePlus size={18} /> New sale <ArrowUpRight size={16} />
            </Link>
          </div>
        </LiquidSurface>
        <LiquidSurface className="dashboard-trend">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">YOUR LAST SEVEN DAYS</p>
              <h2>Revenue flow</h2>
            </div>
            <div
              className="liquid-segment"
              role="group"
              aria-label="Chart display"
            >
              <button
                aria-label="Area chart"
                aria-pressed={chartStyle === 'area'}
                onClick={() => setChartStyle('area')}
              >
                Area
              </button>
              <button
                aria-label="Line chart"
                aria-pressed={chartStyle === 'line'}
                onClick={() => setChartStyle('line')}
              >
                Line
              </button>
            </div>
          </div>
          <div className="trend-number">
            {value(data?.week_revenue)} <span>this week</span>
          </div>
          <div
            className="dashboard-chart"
            role="img"
            aria-label={
              unavailable
                ? 'Revenue is unavailable'
                : loading
                  ? 'Revenue chart is loading'
                  : `Revenue for the past week: ${currency(data?.week_revenue)}`
            }
          >
            {loading ? (
              <div className="liquid-skeleton chart-skeleton" />
            ) : chart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chart}
                  margin={{ top: 12, right: 5, bottom: 0, left: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="revenue-fill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--liquid-accent)"
                        stopOpacity={chartStyle === 'area' ? 0.3 : 0}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--liquid-accent)"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--liquid-grid)"
                    strokeDasharray="3 6"
                  />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--liquid-muted)', fontSize: 10 }}
                    dy={5}
                    minTickGap={15}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as {
                        day: string;
                        date?: string;
                        revenue: number;
                        bills?: number;
                      };
                      const label = row.date
                        ? format(
                            new Date(`${row.date}T12:00:00`),
                            'EEE, dd MMM',
                          )
                        : row.day;
                      return (
                        <div className="dashboard-chart-tooltip">
                          <span className="dashboard-chart-tooltip-label">
                            {label}
                          </span>
                          <strong>{currency(row.revenue)}</strong>
                          {typeof row.bills === 'number' && row.bills > 0 && (
                            <span>
                              {row.bills} bill{row.bills === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--liquid-accent)"
                    strokeWidth={chartStyle === 'line' ? 3 : 2.5}
                    fill={
                      chartStyle === 'area' ? 'url(#revenue-fill)' : 'none'
                    }
                    dot={
                      chartStyle === 'line'
                        ? { r: 3, strokeWidth: 2, fill: 'var(--liquid-tooltip)' }
                        : false
                    }
                    activeDot={{
                      r: 5,
                      stroke: 'var(--liquid-tooltip)',
                      strokeWidth: 3,
                    }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="dashboard-chart-empty">
                <ChartNoAxesCombined size={25} />
                <p>
                  {unavailable
                    ? 'Revenue is unavailable. Refresh to try again.'
                    : 'Your revenue story starts with your first sale.'}
                </p>
              </div>
            )}
          </div>
        </LiquidSurface>
      </div>
      <div className="dashboard-financials">
        {[
          {
            label: 'Week’s revenue',
            amount: data?.week_revenue,
            hint: 'Your last seven days',
            icon: ChartNoAxesCombined,
            tone: 'violet',
            path: '/analytics',
          },
          {
            label: 'To collect',
            amount: data?.outstanding_receivable,
            hint: 'Outstanding from customers',
            icon: ArrowDownLeft,
            tone: 'blue',
            path: '/customers',
          },
          {
            label: 'To pay',
            amount: data?.outstanding_payable,
            hint: 'Outstanding to suppliers',
            icon: ArrowUpRight,
            tone: 'amber',
            path: '/suppliers',
          },
        ].map((metric) => (
          <Link
            key={metric.label}
            to={metric.path}
            className="dashboard-metric-link"
            aria-label={`${metric.label}: ${loading || unavailable ? 'loading' : currency(metric.amount)}. ${metric.hint}`}
          >
            <LiquidSurface
              className={`dashboard-metric metric-${metric.tone}`}
            >
              <div className={`dashboard-symbol tone-${metric.tone}`}>
                <metric.icon size={21} strokeWidth={1.6} />
              </div>
              <div>
                <span>{metric.label}</span>
                <strong>{value(metric.amount)}</strong>
                <small>{metric.hint}</small>
              </div>
              <span className="metric-link" aria-hidden>
                <ArrowUpRight size={18} />
              </span>
            </LiquidSurface>
          </Link>
        ))}
      </div>
      <div className="dashboard-section-heading dashboard-actions-title">
        <h2>Quick actions</h2>
        <span>YOUR EVERYDAY ESSENTIALS</span>
      </div>
      <LiquidSurface className="dashboard-quick-actions">
        {[
          {
            label: 'Create invoice',
            sub: 'Start a new sale',
            icon: ReceiptText,
            to: '/billing/new',
            tone: 'violet',
          },
          {
            label: 'Manage stock',
            sub: 'Products & availability',
            icon: Package,
            to: '/inventory',
            tone: 'blue',
          },
          {
            label: 'Customers',
            sub: 'Balances & history',
            icon: Users,
            to: '/customers',
            tone: 'violet',
          },
          {
            label: 'View reports',
            sub: 'Know your numbers',
            icon: Wallet,
            to: '/reports',
            tone: 'amber',
          },
        ].map((action) => (
          <Link to={action.to} key={action.label}>
            <div className={`dashboard-symbol tone-${action.tone}`}>
              <action.icon size={20} strokeWidth={1.6} />
            </div>
            <div>
              <strong>{action.label}</strong>
              <small>{action.sub}</small>
            </div>
            <ArrowUpRight size={15} className="quick-action-arrow" />
          </Link>
        ))}
      </LiquidSurface>
      <div className="dashboard-bottom-grid">
        <LiquidSurface className="dashboard-activity">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">THE LATEST</p>
              <h2>Recent sales</h2>
            </div>
            <Link className="dashboard-text-link" to="/billing">
              All invoices <ArrowRight size={15} />
            </Link>
          </div>
          <div className="dashboard-sales-table">
            <div className="dashboard-sales-table-head">
              <span>INVOICE & CUSTOMER</span>
              <span>PAYMENT</span>
              <span>AMOUNT</span>
            </div>
            {loading ? (
              [0, 1, 2].map((i) => (
                <div className="liquid-skeleton sale-skeleton" key={i} />
              ))
            ) : data?.recent_sales?.length ? (
              data.recent_sales.slice(0, 5).map((sale) => (
                <Link to="/billing" key={sale.id} className="dashboard-sale">
                  <div className="sale-identity">
                    <div className="sale-icon">
                      <ReceiptText size={17} />
                    </div>
                    <div>
                      <strong>{sale.invoice_number || 'Invoice'}</strong>
                      <span>
                        {sale.customers?.name || 'Walk-in customer'}
                        {sale.created_at
                          ? ` · ${formatDistanceToNow(new Date(sale.created_at), { addSuffix: true })}`
                          : ''}
                      </span>
                    </div>
                  </div>
                  <span className="sale-payment">
                    {sale.payment_mode || 'Sale'}
                  </span>
                  <strong className="sale-amount">
                    {currency(sale.net_amount)} <ChevronRight size={14} />
                  </strong>
                </Link>
              ))
            ) : (
              <div className="dashboard-empty">
                <ReceiptText size={26} />
                <h3>
                  {unavailable ? 'Sales are unavailable.' : 'A fresh start.'}
                </h3>
                <p>
                  {unavailable
                    ? 'Refresh the dashboard to try again.'
                    : 'Your latest sales will appear here.'}
                </p>
                {!unavailable && (
                  <Link to="/billing/new">
                    Create your first invoice <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </LiquidSurface>
        <LiquidSurface className="dashboard-attention">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">INVENTORY HEALTH</p>
              <h2>Stock alerts</h2>
            </div>
            <ShieldCheck size={21} className="attention-shield" />
          </div>
          <div className="attention-items">
            {attention.map((item) => {
              const count = Number(item.count) || 0;
              const hasAlerts = !loading && !unavailable && count > 0;
              return (
                <Link
                  to={item.path}
                  className="attention-item"
                  key={item.label}
                >
                  <div className={`dashboard-symbol tone-${item.tone}`}>
                    <item.icon size={18} strokeWidth={1.7} />
                  </div>
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </div>
                  <span
                    className={[
                      'attention-count',
                      `tone-${item.tone}`,
                      hasAlerts ? 'attention-count--active' : '',
                      !hasAlerts && !loading && !unavailable
                        ? 'attention-count--clear'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {loading || unavailable ? '—' : count}
                  </span>
                  <ChevronRight size={13} />
                </Link>
              );
            })}
          </div>
          <div className="attention-note">
            <span
              className={`status-dot${alertTotal === 0 && !loading && !unavailable ? ' status-dot--success' : ''}`}
            />
            <span>
              {loading || unavailable
                ? 'Review stock levels and upcoming expiry dates.'
                : alertTotal === 0
                  ? 'Stock levels look healthy — no urgent alerts right now.'
                  : 'Review stock levels and upcoming expiry dates.'}
            </span>
          </div>
        </LiquidSurface>
      </div>
      <footer className="dashboard-footer">
        <ShieldCheck size={13} className="brand-star" aria-hidden /> Pharmacy overview
        <span>{format(new Date(), 'dd MMMM yyyy')}</span>
      </footer>
    </div>
  );
}

export const ClinicDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch, isFetching } =
    useClinicDashboardData();
  return (
    <ClinicDashboardView
      data={data}
      name={user?.full_name?.split(' ')[0] || 'there'}
      loading={isLoading}
      error={isError}
      refreshing={isFetching}
      onRefresh={() => {
        void refetch();
      }}
    />
  );
};
