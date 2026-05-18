import { Megaphone, Target, BarChart, Users, Mail, ArrowRight, Check, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactSalesModal } from "../components/modals/ContactSalesModal";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/use-toast";
import { useAdvertisingPlans } from "@/lib/api/advertisingPlans";
import { useCreatePaymentSession } from "@/lib/api/payments";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Advertise = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();
  
  const { data: plans, isLoading, error } = useAdvertisingPlans(true); // Only fetch active plans
  const createPaymentSession = useCreatePaymentSession();

  const handleContactClick = () => {
    if (!isSignedIn) {
      toast({
        title: "Authentication Required",
        description: "Please log in to contact sales",
        variant: "destructive",
      });
      return;
    }
    setIsContactModalOpen(true);
  };

  const handlePurchase = async (planId: string, paymentMethod: 'stripe' | 'paypal') => {
    if (!isSignedIn) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase an advertising plan",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(planId);
    
    try {
      const result = await createPaymentSession.mutateAsync({
        planId,
        paymentMethod,
        successUrl: `${window.location.origin}/advertise/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/advertise/cancel`
      });

      if (result.url) {
        // Redirect to payment processor
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getPlacementColor = (placement: string) => {
    switch (placement) {
      case 'basic':
        return 'bg-gray-100 text-gray-800';
      case 'featured':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-orange-100 text-orange-800';
      case 'sponsored':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative">
      <div className="container mx-auto px-4 py-8 mt-20">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 mb-4">
            <Megaphone className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent mb-4">
            Advertise Your AI Tool
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Reach thousands of AI enthusiasts, developers, and businesses looking for the latest AI tools and solutions.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-100 transition-all duration-300 hover:shadow-lg text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 text-green-500 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">50K+</div>
            <div className="text-gray-600">Monthly Visitors</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-100 transition-all duration-300 hover:shadow-lg text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 text-green-500 mb-4">
              <Target className="w-6 h-6" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">85%</div>
            <div className="text-gray-600">Tech Decision Makers</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-100 transition-all duration-300 hover:shadow-lg text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 text-green-500 mb-4">
              <BarChart className="w-6 h-6" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">3.5x</div>
            <div className="text-gray-600">Avg. ROI</div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Choose Your Plan
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Loading advertising plans...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Failed to load advertising plans</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <Card 
                  key={plan._id}
                  className={`
                    relative transition-all duration-300 hover:shadow-xl
                    ${plan.isPopular 
                      ? 'border-green-200 shadow-lg scale-105 bg-gradient-to-br from-green-50 to-white' 
                      : 'border-gray-100 hover:border-green-100 hover:shadow-lg'
                    }
                  `}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {plan.name}
                      </CardTitle>
                      <Badge className={getPlacementColor(plan.placement)} variant="secondary">
                        {plan.placement}
                      </Badge>
                    </div>
                    <div className="flex items-baseline justify-center gap-1 mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatCurrency(plan.price, plan.currency)}
                      </span>
                      <span className="text-gray-500">/{plan.duration} days</span>
                    </div>
                    <CardDescription className="text-gray-600">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3 text-gray-600">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      
                      {/* Additional features based on plan settings */}
                      {plan.analytics && (
                        <li className="flex items-center gap-3 text-gray-600">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span>Advanced Analytics</span>
                        </li>
                      )}
                      {plan.socialPromotion && (
                        <li className="flex items-center gap-3 text-gray-600">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span>Social Media Promotion</span>
                        </li>
                      )}
                      {plan.newsletterFeature && (
                        <li className="flex items-center gap-3 text-gray-600">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span>Newsletter Feature</span>
                        </li>
                      )}
                      {plan.prioritySupport && (
                        <li className="flex items-center gap-3 text-gray-600">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span>Priority Support</span>
                        </li>
                      )}
                      {plan.customIntegrations && (
                        <li className="flex items-center gap-3 text-gray-600">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span>Custom Integrations</span>
                        </li>
                      )}
                    </ul>

                    {/* Payment Buttons */}
                    <div className="space-y-3">
                      {plan.stripePriceId && (
                        <Button 
                          className={`
                            w-full rounded-xl
                            ${plan.isPopular
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                              : 'bg-white border-2 border-green-100 text-green-600 hover:bg-green-50'
                            }
                          `}
                          onClick={() => handlePurchase(plan._id, 'stripe')}
                          disabled={isProcessingPayment === plan._id}
                        >
                          {isProcessingPayment === plan._id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pay with Stripe
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      )}
                      
                      {plan.paypalPlanId && (
                        <Button 
                          variant="outline"
                          className="w-full rounded-xl border-2 border-blue-100 text-blue-600 hover:bg-blue-50"
                          onClick={() => handlePurchase(plan._id, 'paypal')}
                          disabled={isProcessingPayment === plan._id}
                        >
                          {isProcessingPayment === plan._id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Pay with PayPal
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      )}
                      
                      {/* Fallback for plans without payment integration */}
                      {!plan.stripePriceId && !plan.paypalPlanId && (
                        <Button 
                          className="w-full rounded-xl bg-white border-2 border-green-100 text-green-500 hover:bg-green-50"
                          onClick={handleContactClick}
                        >
                          Contact Sales
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No advertising plans available at the moment.</p>
              <Button onClick={handleContactClick}>
                Contact Sales for Custom Plans
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Contact - Separate from main container */}
      <div className="relative z-10 bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl p-8 border border-gray-100 hover:border-green-100 transition-all duration-300 hover:shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Need a Custom Solution?
            </h2>
            <p className="text-gray-600 mb-8">
              Contact us to discuss custom advertising packages tailored to your specific needs.
            </p>
            <Button 
              className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 rounded-xl px-8 py-6 h-auto font-medium text-base relative z-20"
              onClick={handleContactClick}
            >
              <Mail className="w-5 h-5 mr-3" />
              Contact Sales
            </Button>
          </div>
        </div>
      </div>

      {/* Contact Sales Modal */}
      <ContactSalesModal 
        isOpen={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
      />
    </div>
  );
}; 