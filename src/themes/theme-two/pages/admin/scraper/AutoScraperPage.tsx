import React, { useState } from 'react';
import { Bot, Play, Terminal, Info, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AutoScraperPage() {
    const [cronKey, setCronKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastRunStatus, setLastRunStatus] = useState<'success' | 'error' | null>(null);

    const handleManualTrigger = async () => {
        if (!cronKey) {
            toast.error('Please enter your Cron Secret key');
            return;
        }

        setIsLoading(true);
        setLastRunStatus(null);
        try {
            const response = await fetch(`/api/cron/scrape?key=${cronKey}`);
            const data = await response.json();

            if (response.ok) {
                toast.success('Scraper triggered successfully!');
                setLastRunStatus('success');
            } else {
                toast.error(data.error || 'Failed to trigger scraper');
                setLastRunStatus('error');
            }
        } catch (error) {
            toast.error('Network error occurred');
            setLastRunStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    const vercelJsonConfig = `{
  "crons": [
    {
      "path": "/api/cron/scrape?key=YOUR_CRON_SECRET",
      "schedule": "0 0 * * *"
    }
  ]
}`;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                    <Bot className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Auto-Scraper Engine</h1>
                    <p className="text-gray-500">Manage and monitor the automated tool scraping system</p>
                </div>
            </div>

            <Card className="border-purple-100 shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                        About Auto-Scraper
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 leading-relaxed">
                        The system includes a smart script that scrapes <strong>TopAI.tools</strong> for new listings.
                        You can automate this process so your site gets new content every day without you lifting a finger.
                    </p>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Play className="w-5 h-5 text-purple-600" />
                            Manual Trigger (Testing)
                        </CardTitle>
                        <CardDescription>
                            Run the scraper immediately. Useful for testing or forcing an update.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Cron Secret Key</label>
                            <Input
                                type="password"
                                placeholder="YOUR_CRON_SECRET from .env.local"
                                value={cronKey}
                                onChange={(e) => setCronKey(e.target.value)}
                                className="font-mono"
                            />
                            <p className="text-xs text-gray-500">
                                Replace <span className="font-mono bg-gray-100 px-1 rounded">YOUR_CRON_SECRET</span> with the value from your environment variables.
                            </p>

                            <Alert className="bg-blue-50 border-blue-200 mt-2">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-800">How to get your key?</AlertTitle>
                                <AlertDescription className="text-blue-700 text-xs mt-1">
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li><strong>Locally:</strong> Check your <code className="bg-blue-100 px-1 rounded">.env.local</code> file for <code>CRON_SECRET</code>.</li>
                                        <li><strong>Missing?</strong> You can generate one using a command like <code className="bg-blue-100 px-1 rounded">uuidgen</code> in your terminal, or use any random string. Add it to <code>.env.local</code> as <code>CRON_SECRET=your-secret</code>.</li>
                                        <li><strong>Production:</strong> Go to Vercel Dashboard &rarr; Settings &rarr; Environment Variables.</li>
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        </div>


                        <Button
                            onClick={handleManualTrigger}
                            disabled={isLoading}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Running Scraper...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Run Scraper Now
                                </>
                            )}
                        </Button>

                        {lastRunStatus === 'success' && (
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800">Success</AlertTitle>
                                <AlertDescription className="text-green-700">
                                    Scraper triggered successfully. New tools will appear in the <a href="/admin/submissions" className="underline font-medium hover:text-green-900">Tool Submissions</a> page for review.
                                </AlertDescription>
                            </Alert>
                        )}

                        {lastRunStatus === 'error' && (
                            <Alert className="bg-red-50 border-red-200">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertTitle className="text-red-800">Error</AlertTitle>
                                <AlertDescription className="text-red-700">
                                    Failed to trigger scraper. Check your key and try again.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-white">
                            <Terminal className="w-5 h-5 text-purple-400" />
                            Automating with Vercel Cron
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Recommended for production deployment
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-300">
                            If you deploy on Vercel, automation is built-in. Check your <code className="bg-slate-800 px-1 py-0.5 rounded text-purple-300">vercel.json</code> file in the root folder.
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto">
                            <pre className="text-green-400">
                                {vercelJsonConfig}
                            </pre>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-800/50 p-3 rounded">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p>
                                Ensure your project has the <code className="text-purple-300">vercel.json</code> file in the root folder with the configuration above.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
