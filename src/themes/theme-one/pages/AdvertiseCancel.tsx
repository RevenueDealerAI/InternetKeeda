import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AdvertiseCancel = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Cancel Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Cancelled
            </h1>
            <p className="text-gray-600">
              Your payment was cancelled and no charges were made.
            </p>
          </div>

          {/* Information Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What Happened?</CardTitle>
              <CardDescription>
                Your payment process was interrupted or cancelled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                  •
                </div>
                <div>
                  <p className="text-gray-600 text-sm">
                    No charges have been made to your payment method
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                  •
                </div>
                <div>
                  <p className="text-gray-600 text-sm">
                    Your advertising plan selection has not been activated
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                  •
                </div>
                <div>
                  <p className="text-gray-600 text-sm">
                    You can try again anytime with the same or different plan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/advertise')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Need help? Contact our support team for assistance with your advertising needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 