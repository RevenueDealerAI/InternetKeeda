import React from 'react';
import { AdminReviewList } from '@/components/admin/reviews/AdminReviewList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReviewManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews Management</h1>
        <p className="text-muted-foreground">
          Manage user reviews, including approval, editing, and removal.
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <AdminReviewList status="pending" />
        </TabsContent>
        
        <TabsContent value="approved">
          <AdminReviewList status="approved" />
        </TabsContent>
        
        <TabsContent value="rejected">
          <AdminReviewList status="rejected" />
        </TabsContent>
      </Tabs>
    </div>
  );
} 