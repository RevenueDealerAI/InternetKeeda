import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  TrendingUp,
  Clock,
  Eye,
  BarChart3,
  Zap,
  Calendar,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { Button } from "@/components/ui/button";

const API_URL = ''; // Use relative URLs since APIs are handled by Next.js API routes

interface DashboardStats {
  totalTools: number;
  categoryCounts: Array<{ _id: string; count: number }>;
  recentTools: Array<{ _id: string; name: string; category: string; createdAt: string; slug?: string }>;
  popularTools: Array<{ _id: string; name: string; views: number; slug?: string }>;
  statusCounts: Array<{ _id: string; count: number }>;
  pricingCounts: Array<{ _id: string; count: number }>;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_URL}/api/tools/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return response.json();
}

const COLORS = ['#7D37FF', '#A855F7', '#EC4899', '#F59E0B', '#10B981'];

export default function DashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading, error } = useQuery<DashboardStats, Error>({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats
  });
  // Pending counter sources from the admin-guarded endpoint, not the
  // public /api/tools/stats — matches theme-one's dashboard and
  // keeps pending-queue identifiers behind admin auth.
  const pendingQuery = useQuery<{ total: number }, Error>({
    queryKey: ['admin-pending-tools', 'count'],
    queryFn: async () => {
      const r = await fetch('/api/admin/tools/pending?limit=1', {
        credentials: 'include',
      });
      if (!r.ok) throw new Error('Failed to load pending count');
      return r.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          <p>Error loading dashboard data: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-yellow-50 text-yellow-600 px-4 py-3 rounded-2xl flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-purple-600">
          Dashboard
        </h2>
        <p className="text-sm text-gray-500">Overview of your platform activity</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 py-4">
            <CardTitle className="text-sm font-medium text-gray-500">Total Tools</CardTitle>
            <div className="p-2 bg-purple-50 rounded-2xl">
              <Wrench className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="px-6 py-2">
            <div className="text-3xl font-bold text-gray-900">{stats.totalTools}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">AI tools in the directory</span>
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">+12%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 py-4">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
            <div className="p-2 bg-purple-50 rounded-2xl">
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="px-6 py-2">
            <div className="text-3xl font-bold text-gray-900">{pendingQuery.data?.total ?? '—'}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 py-4">
            <CardTitle className="text-sm font-medium text-gray-500">Popular Category</CardTitle>
            <div className="p-2 bg-purple-50 rounded-2xl">
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="px-6 py-2">
            <div className="text-2xl font-bold text-gray-900 truncate">
              {stats.categoryCounts[0]?._id || 'N/A'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{stats.categoryCounts[0]?.count || 0} tools</span>
              <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" />
                Top
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 py-4">
            <CardTitle className="text-sm font-medium text-gray-500">Most Viewed</CardTitle>
            <div className="p-2 bg-purple-50 rounded-2xl">
              <Eye className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="px-6 py-2">
            <div className="text-2xl font-bold text-gray-900 truncate">
              {stats.popularTools[0]?.name || 'N/A'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{stats.popularTools[0]?.views || 0} views</span>
              <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                <Zap className="h-3 w-3" />
                Popular
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="rounded-2xl hover:shadow-xl transition-all">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-xl text-gray-900">Category Distribution</CardTitle>
            <CardDescription className="text-sm">Distribution of tools across categories</CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="_id" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} width={32} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="count" fill="#7D37FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl hover:shadow-xl transition-all">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-xl text-gray-900">Pricing Distribution</CardTitle>
            <CardDescription className="text-sm">Distribution of tools by pricing model</CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={stats.pricingCounts} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={30} outerRadius={80} paddingAngle={2}>
                    {stats.pricingCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {stats.pricingCounts.map((entry, index) => (
                <div key={entry._id} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs text-gray-600">{entry._id} ({entry.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl hover:shadow-xl transition-all">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Recent Tools</CardTitle>
            <CardDescription>Latest tools added to the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTools.map((tool) => (
                <div key={tool._id} className="group p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{tool.name}</p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">New</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{tool.category}</span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(tool.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => router.push(`/ai-tools/${tool.slug || tool._id}`)}
                    >
                      <Eye className="h-4 w-4 text-purple-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl hover:shadow-xl transition-all">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Popular Tools</CardTitle>
            <CardDescription>Most viewed tools on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.popularTools.map((tool, index) => (
                <div key={tool._id} className="group p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm">#{index + 1}</div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{tool.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Eye className="h-3.5 w-3.5" />
                            <span>{tool.views.toLocaleString()}</span>
                          </div>
                          {tool.views > 500 && (
                            <span className="flex items-center gap-1 text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                              <TrendingUp className="h-3 w-3" />
                              Trending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => router.push(`/ai-tools/${tool.slug || tool._id}`)}
                    >
                      <Eye className="h-4 w-4 text-purple-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


