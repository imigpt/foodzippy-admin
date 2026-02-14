import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { api } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!analytics) return { total: 0, pending: 0, published: 0, rejected: 0 };
    return {
      total: analytics.summary.total,
      pending: analytics.summary.pending,
      published: analytics.summary.approved,
      rejected: analytics.summary.rejected,
    };
  }, [analytics]);

  const monthlyRequestData = useMemo(() => {
    if (!analytics) return [];
    return analytics.monthlyRequests.map((item: any) => ({
      month: MONTH_NAMES[item.month] || item.month,
      requests: item.count,
    }));
  }, [analytics]);

  const statusData = useMemo(() => [
    { name: 'Pending', value: stats.pending, fill: 'hsl(var(--warning))' },
    { name: 'Published', value: stats.published, fill: 'hsl(var(--success))' },
    { name: 'Rejected', value: stats.rejected, fill: 'hsl(var(--destructive))' },
  ], [stats]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of vendor registration activity</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Requests"
          value={stats.total}
          icon={ClipboardList}
          variant="primary"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pending}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Published Vendors"
          value={stats.published}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Rejected Agent Requests"
          value={stats.rejected}
          icon={XCircle}
          variant="destructive"
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Requests Bar Chart */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Monthly Vendor Requests</h2>
              <p className="text-sm text-muted-foreground">Requests received per month</p>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRequestData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Request Trend Line Chart */}
        <div className="bg-card rounded-xl border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Request Trend</h2>
            <p className="text-sm text-muted-foreground">Vendor registration trend over time</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRequestData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-card rounded-xl border p-6 mb-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Status Breakdown</h2>
          <p className="text-sm text-muted-foreground">Current distribution of vendor request statuses</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statusData.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-2xl font-bold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <Button
          onClick={() => navigate('/vendor-requests?status=pending')}
          className="gap-2"
        >
          View Pending Requests
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
