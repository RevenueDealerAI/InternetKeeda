// Theme Two admin page (independent implementation)

import React from 'react';
import { AdminReviewList } from '../../../components/admin/reviews/AdminReviewList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReviewManagementPage() {
  return (
    <div className="space-y-6 pt-8 space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews Management</h1>
        <p className="text-muted-foreground">
          Manage user reviews, including approval, editing, and removal.
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 rounded-full bg-purple-50 p-1">
          <TabsTrigger className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white" value="pending">Pending</TabsTrigger>
          <TabsTrigger className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white" value="approved">Approved</TabsTrigger>
          <TabsTrigger className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white" value="rejected">Rejected</TabsTrigger>
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