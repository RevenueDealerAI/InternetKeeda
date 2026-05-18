import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Globe, ExternalLink, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from 'sonner';
import { useSitemapStats, useGenerateSitemap } from '@/lib/api/sitemap';
import { format } from 'date-fns';

export default function SitemapSettings() {
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useSitemapStats();
  const generateSitemap = useGenerateSitemap();

  const handleGenerateSitemap = async () => {
    try {
      const result = await generateSitemap.mutateAsync();
      setLastGenerated(result.data.lastGenerated);
      toast.success(result.message);
      refetchStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate sitemap');
    }
  };

  const handleOpenSitemap = () => { if (stats?.sitemapUrl) window.open(stats.sitemapUrl, '_blank'); };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />XML Sitemap</CardTitle>
          <CardDescription>Generate and manage your site's XML sitemap for better search engine indexing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statsError ? (
            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>Failed to load sitemap statistics. Please check your server connection.</AlertDescription></Alert>
          ) : (
            <>
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="rounded-xl border shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total URLs</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-bold text-purple-600">{statsLoading ? (<Loader2 className="w-6 h-6 animate-spin" />) : (stats.totalUrls)}</div></CardContent></Card>
                  <Card className="rounded-xl border shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">AI Tools</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-bold text-blue-600">{statsLoading ? (<Loader2 className="w-6 h-6 animate-spin" />) : (stats.breakdown.tools)}</div></CardContent></Card>
                  <Card className="rounded-xl border shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Blog Posts</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-bold text-purple-600">{statsLoading ? (<Loader2 className="w-6 h-6 animate-spin" />) : (stats.breakdown.blogPosts)}</div></CardContent></Card>
                  <Card className="rounded-xl border shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">News Posts</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-bold text-orange-600">{statsLoading ? (<Loader2 className="w-6 h-6 animate-spin" />) : (stats.breakdown.newsPosts)}</div></CardContent></Card>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={handleGenerateSitemap} disabled={generateSitemap.isPending} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600">
                  {generateSitemap.isPending ? (<Loader2 className="w-4 h-4 animate-spin" />) : (<RefreshCw className="w-4 h-4" />)}
                  {generateSitemap.isPending ? 'Generating...' : 'Generate Sitemap'}
                </Button>
                {stats?.sitemapUrl && (
                  <Button variant="outline" onClick={handleOpenSitemap} className="flex items-center gap-2 rounded-full"><ExternalLink className="w-4 h-4" />View Sitemap</Button>
                )}
              </div>
              {lastGenerated && (
                <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>Sitemap generated successfully on {format(new Date(lastGenerated), 'PPP p')}</AlertDescription></Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>About XML Sitemaps</CardTitle><CardDescription>Learn more about how sitemaps help your site's SEO.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3"><Badge variant="secondary" className="mt-0.5">SEO</Badge><p className="text-sm text-muted-foreground">XML sitemaps help search engines discover and index all pages on your website more efficiently.</p></div>
            <div className="flex items-start gap-3"><Badge variant="secondary" className="mt-0.5">Auto</Badge><p className="text-sm text-muted-foreground">Your sitemap is automatically generated from all published content including AI tools, blog posts, and news articles.</p></div>
            <div className="flex items-start gap-3"><Badge variant="secondary" className="mt-0.5">Fresh</Badge><p className="text-sm text-muted-foreground">Generate a new sitemap whenever you add new content to ensure search engines have the latest information.</p></div>
          </div>
          {stats?.sitemapUrl && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg"><h4 className="font-medium mb-2">Sitemap URL</h4><code className="text-sm bg-muted px-2 py-1 rounded break-all">{stats.sitemapUrl}</code><p className="text-xs text-muted-foreground mt-2">Submit this URL to Google Search Console and other search engines for better indexing.</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

