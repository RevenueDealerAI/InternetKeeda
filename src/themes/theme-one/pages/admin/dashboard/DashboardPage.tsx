import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  Users,
  Wrench,
  FileText,
  Newspaper,
  TrendingUp,
  Clock,
  DollarSign,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  ArrowUp,
  ArrowDown,
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
import { RevenueCards } from "@/themes/theme-one/components/admin/RevenueCards";

const API_URL = ''; // Use relative URLs since APIs are handled by Next.js API routes

interface DashboardStats {
  totalTools: number;
  pendingSubmissions: number;
  categoryCounts: Array<{ _id: string; count: number }>;
  recentTools: Array<{ _id: string; name: string; category: string; createdAt: string; slug?: string }>;
  popularTools: Array<{ _id: string; name: string; views: number; slug?: string }>;
  statusCounts: Array<{ _id: string; count: number }>;
  pricingCounts: Array<{ _id: string; count: number }>;
  recentSubmissions: Array<{
    _id: string;
    name: string;
    category: string;
    createdAt: string;
    slug?: string;
    ownerUserId?: string;
  }>;
}

// Fetch dashboard stats
async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_URL}/api/tools/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return response.json();
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'];

export default function DashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading, error } = useQuery<DashboardStats, Error>({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          <p>Error loading dashboard data: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-yellow-50 text-yellow-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-1 md:space-y-2">
        <h2 className="text-xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
          Dashboard
        </h2>
        <p className="text-sm md:text-base text-gray-500">
          Welcome to your admin dashboard. Here's an overview of your platform.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 py-2 md:py-4">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Total Tools</CardTitle>
            <div className="p-1.5 md:p-2 bg-green-50 rounded-xl">
              <Wrench className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6 py-1 md:py-2">
            <div className="text-lg md:text-3xl font-bold text-gray-900">{stats.totalTools}</div>
            <div className="flex items-center gap-1 md:gap-2 mt-1">
              <span className="text-[10px] md:text-xs text-gray-500">AI tools in the directory</span>
              <span className="flex items-center text-[10px] md:text-xs text-green-600 bg-green-50 px-1.5 md:px-2 py-0.5 rounded-full">
                <ArrowUp className="h-2 w-2 md:h-3 md:w-3 mr-0.5" />
                12%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 py-2 md:py-4">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Pending</CardTitle>
            <div className="p-1.5 md:p-2 bg-blue-50 rounded-xl">
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6 py-1 md:py-2">
            <div className="text-lg md:text-3xl font-bold text-gray-900">{stats.pendingSubmissions}</div>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 py-2 md:py-4">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Popular Category</CardTitle>
            <div className="p-1.5 md:p-2 bg-green-50 rounded-xl">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6 py-1 md:py-2">
            <div className="text-sm md:text-2xl font-bold text-gray-900 truncate max-w-[110px] md:max-w-full">
              {stats.categoryCounts[0]?._id || 'N/A'}
            </div>
            <div className="flex items-center gap-1 md:gap-2 mt-1">
              <span className="text-[10px] md:text-xs text-gray-500">{stats.categoryCounts[0]?.count || 0} tools</span>
              <span className="flex items-center text-[10px] md:text-xs text-green-600 bg-green-50 px-1.5 md:px-2 py-0.5 rounded-full">
                <TrendingUp className="h-2 w-2 md:h-3 md:w-3 mr-0.5" />
                Top
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 py-2 md:py-4">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Most Viewed</CardTitle>
            <div className="p-1.5 md:p-2 bg-orange-50 rounded-xl">
              <Eye className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6 py-1 md:py-2">
            <div className="text-sm md:text-2xl font-bold text-gray-900 truncate max-w-[110px] md:max-w-full">
              {stats.popularTools[0]?.name || 'N/A'}
            </div>
            <div className="flex items-center gap-1 md:gap-2 mt-1">
              <span className="text-[10px] md:text-xs text-gray-500">{stats.popularTools[0]?.views || 0} views</span>
              <span className="flex items-center text-[10px] md:text-xs text-orange-600 bg-orange-50 px-1.5 md:px-2 py-0.5 rounded-full">
                <Zap className="h-2 w-2 md:h-3 md:w-3 mr-0.5" />
                Popular
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Submissions — moderation queue surfaced on dashboard */}
      {stats.recentSubmissions && stats.recentSubmissions.length > 0 && (
        <Card className="hover:shadow-lg transition-all duration-200 border-blue-100 bg-blue-50/30">
          <CardHeader className="px-3 md:px-6 py-3 md:py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base md:text-xl text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                Pending Submissions
                <span className="text-xs md:text-sm font-normal px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {stats.pendingSubmissions} total
                </span>
              </CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">
                Tools awaiting your review
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-blue-700 border-blue-200 hover:bg-blue-50"
              onClick={() => router.push('/admin/submissions')}
            >
              Review all
            </Button>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-4">
            <div className="space-y-2">
              {stats.recentSubmissions.map((sub) => (
                <div
                  key={sub._id}
                  className="group p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm md:text-base text-gray-900 truncate">
                        {sub.name}
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-blue-100 text-blue-700">
                        Pending
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                      {sub.category && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {sub.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(sub.createdAt), 'MMM d, yyyy')}
                      </span>
                      {sub.ownerUserId && (
                        <span className="truncate max-w-[180px] font-mono text-[10px]">
                          {sub.ownerUserId.slice(0, 12)}…
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-blue-700 hover:bg-blue-50"
                    onClick={() => router.push('/admin/submissions')}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue (Cashfree) */}
      <RevenueCards />

      {/* Charts */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="px-3 md:px-6 py-3 md:py-4">
            <CardTitle className="text-base md:text-xl text-gray-900">Category Distribution</CardTitle>
            <CardDescription className="text-xs md:text-sm">Distribution of tools across categories</CardDescription>
          </CardHeader>
          <CardContent className="px-2 md:px-4">
            <div className="h-[200px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="_id" 
                    stroke="#6b7280" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    height={60}
                    angle={-45}
                    textAnchor="end"
                    tick={{ fontSize: 10 }}
                    tickMargin={8}
                  />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} width={30} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="px-3 md:px-6 py-3 md:py-4">
            <CardTitle className="text-base md:text-xl text-gray-900">Pricing Distribution</CardTitle>
            <CardDescription className="text-xs md:text-sm">Distribution of tools by pricing model</CardDescription>
          </CardHeader>
          <CardContent className="px-2 md:px-4">
            <div className="h-[200px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={stats.pricingCounts}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    innerRadius={window.innerWidth < 768 ? 20 : 30}
                    outerRadius={window.innerWidth < 768 ? 60 : 80}
                    paddingAngle={2}
                    label={({ name, percent, value }) => {
                      const percentage = (percent * 100).toFixed(0);
                      // Only show labels for slices larger than 3% to avoid overlap
                      if (percent < 0.03) return '';
                      return window.innerWidth < 640 
                        ? `${percentage}%`
                        : `${name} ${percentage}%`;
                    }}
                    labelLine={true}
                    fontSize={window.innerWidth < 768 ? 10 : 12}
                  >
                    {stats.pricingCounts.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity duration-200"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {stats.pricingCounts.map((entry, index) => (
                <div key={entry._id} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-gray-600">
                    {entry._id} ({entry.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Recent Tools</CardTitle>
            <CardDescription>Latest tools added to the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTools.map((tool) => (
                <div 
                  key={tool._id} 
                  className="group p-4 rounded-xl border border-gray-100 hover:border-green-100 hover:bg-green-50/50 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                          {tool.name}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                          New
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                          {tool.category}
                        </span>
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
                      <Eye className="h-4 w-4 text-green-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Popular Tools</CardTitle>
            <CardDescription>Most viewed tools on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.popularTools.map((tool, index) => (
                <div 
                  key={tool._id}
                  className="group p-4 rounded-xl border border-gray-100 hover:border-green-100 hover:bg-green-50/50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                          {tool.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Eye className="h-3.5 w-3.5" />
                            <span>{tool.views.toLocaleString()}</span>
                          </div>
                          {index === 0 && (
                            <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                              <Zap className="h-3 w-3" />
                              Most Popular
                            </span>
                          )}
                          {tool.views > 500 && (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
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
                      <Eye className="h-4 w-4 text-green-600" />
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