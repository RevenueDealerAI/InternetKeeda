import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Check, X, Calendar, Globe, DollarSign } from "lucide-react";
import Image from "next/image";
import { normalizeImageUrl } from '@/utils/imageUrl';

export interface ToolSubmission {
    _id: string;
    toolName: string;
    description: string;
    websiteUrl: string;
    logoUrl: string;
    category: string;
    pricingType: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
}

interface SubmissionDetailsDialogProps {
    submission: ToolSubmission | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateStatus: (id: string, status: 'approved' | 'rejected') => void;
}

export function SubmissionDetailsDialog({
    submission,
    open,
    onOpenChange,
    onUpdateStatus
}: SubmissionDetailsDialogProps) {
    if (!submission) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-50 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        }
    };

    const getSubmissionImageUrl = (sub: ToolSubmission) => {
        if (sub.logoUrl && sub.logoUrl.trim() !== '') {
            const normalized = normalizeImageUrl(sub.logoUrl);
            if (normalized && normalized.trim() !== '') {
                return normalized;
            }
        }

        if (sub.websiteUrl) {
            try {
                const hostname = new URL(sub.websiteUrl).hostname;
                return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
            } catch {
                const domain = sub.websiteUrl.replace(/^https?:\/\//, '').split('/')[0];
                if (domain) {
                    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                }
            }
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.toolName || 'Tool')}&background=random`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="theme-two max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-gray-100 flex-shrink-0 bg-gray-100">
                            <Image
                                src={getSubmissionImageUrl(submission)}
                                alt={submission.toolName}
                                fill
                                className="object-cover"
                                unoptimized
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (!target.src.includes('ui-avatars.com') && !target.src.includes('google.com/s2/favicons')) {
                                        target.onerror = null;
                                        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.toolName || 'Tool')}&background=8039fd&color=fff&bold=true`;
                                        target.src = fallbackUrl;
                                    }
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                                {submission.toolName}
                            </DialogTitle>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={getStatusColor(submission.status)}>
                                    {submission.status}
                                </Badge>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                    {submission.category}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-500">Description</h4>
                        <p className="text-gray-900 leading-relaxed bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                            {submission.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Website URL
                            </h4>
                            <a
                                href={submission.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-purple-600 hover:underline break-all block"
                            >
                                {submission.websiteUrl}
                            </a>
                        </div>

                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Pricing Model
                            </h4>
                            <p className="text-gray-900 capitalize">{submission.pricingType}</p>
                        </div>

                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Submitted On
                            </h4>
                            <p className="text-gray-900">
                                {(() => {
                                    try {
                                        const date = new Date(submission.submittedAt);
                                        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                                    } catch {
                                        return 'N/A';
                                    }
                                })()}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => window.open(submission.websiteUrl, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit Website
                    </Button>

                    {submission.status === 'pending' && (
                        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <Button
                                onClick={() => {
                                    onUpdateStatus(submission._id, 'rejected');
                                    onOpenChange(false);
                                }}
                                className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                variant="outline"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                            <Button
                                onClick={() => {
                                    onUpdateStatus(submission._id, 'approved');
                                    onOpenChange(false);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
