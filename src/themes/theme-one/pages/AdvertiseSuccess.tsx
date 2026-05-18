import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Receipt, Calendar, CreditCard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVerifyPayment } from '@/lib/api/payments';
import { useToast } from '@/components/ui/use-toast';
import type { Purchase } from '@/lib/api/payments';

export const AdvertiseSuccess = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  
  const verifyPayment = useVerifyPayment();
  
  const handlePaymentVerification = useCallback(async (sessionId: string, paymentMethod: 'stripe' | 'paypal') => {
    try {
      const result = await verifyPayment.mutateAsync({ sessionId, paymentMethod });
      setPurchase(result);
      toast({
        title: "Payment Successful!",
        description: "Your advertising plan has been activated.",
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Payment Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify payment",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }, [verifyPayment, toast]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentId = searchParams.get('paymentId');
    
    if (sessionId) {
      // Stripe payment
      handlePaymentVerification(sessionId, 'stripe');
    } else if (paymentId) {
      // PayPal payment
      handlePaymentVerification(paymentId, 'paypal');
    } else {
      toast({
        title: "Invalid Payment Session",
        description: "No payment session found. Please try again.",
        variant: "destructive",
      });
      router.push('/advertise');
    }
  }, [searchParams, handlePaymentVerification, router, toast]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlacementColor = (placement: string) => {
    switch (placement) {
      case 'basic':
        return 'bg-gray-100 text-gray-800';
      case 'featured':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'sponsored':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Your advertising plan has been activated and is ready to use.
            </p>
          </div>

          {purchase && (
            <>
              {/* Purchase Summary */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Purchase Summary
                  </CardTitle>
                  <CardDescription>
                    Order #{purchase._id.slice(-8).toUpperCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{purchase.planName}</h3>
                        <Badge className={getPlacementColor(purchase.placement)} variant="secondary">
                          {purchase.placement}
                        </Badge>
                      </div>
                      <p className="text-gray-600">
                        Duration: {Math.ceil((new Date(purchase.endDate).getTime() - new Date(purchase.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(purchase.amount, purchase.currency)}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <CreditCard className="w-4 h-4" />
                        {purchase.paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'}
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-medium mb-2">Included Features:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {purchase.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium">{formatDate(purchase.startDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-medium">{formatDate(purchase.endDate)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>What's Next?</CardTitle>
                  <CardDescription>
                    Here's how to get the most out of your advertising plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Manage Your Campaign</h4>
                      <p className="text-gray-600 text-sm">
                        Visit your dashboard to add tool details, monitor performance, and track analytics.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Add Tool Information</h4>
                      <p className="text-gray-600 text-sm">
                        Provide your tool's URL, description, and other details to maximize visibility.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Monitor Performance</h4>
                      <p className="text-gray-600 text-sm">
                        Track impressions, clicks, and engagement to optimize your advertising strategy.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/advertise')}
              className="flex-1"
            >
              View More Plans
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 