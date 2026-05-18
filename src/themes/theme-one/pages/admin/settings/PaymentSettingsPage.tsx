import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, CreditCard, AlertTriangle, TestTube2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  usePaymentSettings, 
  useUpdatePaymentSettings, 
  useTestStripeConnection,
  type PaymentSettings as PaymentSettingsType 
} from '@/lib/api/paymentSettings';

export default function PaymentSettingsPage() {
  const { toast } = useToast();
  const { data: settings, isLoading, error } = usePaymentSettings();
  const updateSettings = useUpdatePaymentSettings();
  const testStripe = useTestStripeConnection();
  
  // Form state
  const [formData, setFormData] = useState<Partial<PaymentSettingsType>>({});
  const [showSecrets, setShowSecrets] = useState({
    stripeTestSecret: false,
    stripeLiveSecret: false,
    stripeTestWebhook: false,
    stripeLiveWebhook: false,
    paypalSandboxSecret: false,
    paypalLiveSecret: false
  });
  
  // Initialize form data when settings load
  useState(() => {
    if (settings) {
      setFormData(settings);
    }
  });

  const handleUpdateField = (path: string, value: string | boolean | object) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: Record<string, unknown> = newData as Record<string, unknown>;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast({
        title: "Success",
        description: "Payment settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const handleTestStripe = async (mode: 'test' | 'live') => {
    try {
      const result = await testStripe.mutateAsync({ mode });
      toast({
        title: "Stripe Connection Successful",
        description: `Connected to ${result.data.country} account (${result.data.currency})`,
      });
    } catch (error) {
      toast({
        title: "Stripe Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Stripe",
        variant: "destructive",
      });
    }
  };

  const toggleSecretVisibility = (field: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const renderPasswordInput = (
    label: string,
    value: string | undefined,
    onChange: (value: string) => void,
    secretKey: keyof typeof showSecrets,
    placeholder: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={showSecrets[secretKey] ? "text" : "password"}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => toggleSecretVisibility(secretKey)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showSecrets[secretKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          Failed to load payment settings. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure Stripe and PayPal payment providers for your advertising plans
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Stripe Status</p>
                <div className="flex items-center gap-2">
                  {formData.stripe?.enabled ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-green-700">Enabled</span>
                      <Badge variant="outline" className="text-xs">
                        {formData.stripe.mode}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-500">Disabled</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">PayPal Status</p>
                <div className="flex items-center gap-2">
                  {formData.paypal?.enabled ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-green-700">Enabled</span>
                      <Badge variant="outline" className="text-xs">
                        {formData.paypal.mode}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-500">Disabled</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Default Currency</p>
                <p className="font-medium">{formData.currency || 'USD'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Provider Configuration</CardTitle>
          <CardDescription>
            Configure your payment providers and switch between test and live modes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stripe" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stripe">Stripe</TabsTrigger>
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            {/* Stripe Configuration */}
            <TabsContent value="stripe" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Stripe Configuration</h3>
                  <p className="text-sm text-gray-600">Configure Stripe payment processing</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="stripe-enabled">Enabled</Label>
                  <Switch
                    id="stripe-enabled"
                    checked={formData.stripe?.enabled || false}
                    onCheckedChange={(checked) => handleUpdateField('stripe.enabled', checked)}
                  />
                </div>
              </div>

              {formData.stripe?.enabled && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select
                      value={formData.stripe?.mode || 'test'}
                      onValueChange={(value) => handleUpdateField('stripe.mode', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="test">Test Mode</SelectItem>
                        <SelectItem value="live">Live Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Test Configuration */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Test Configuration</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestStripe('test')}
                          disabled={testStripe.isPending}
                        >
                          {testStripe.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <TestTube2 className="w-4 h-4 mr-2" />
                          )}
                          Test Connection
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Publishable Key</Label>
                          <Input
                            value={formData.stripe?.test?.publishableKey || ''}
                            onChange={(e) => handleUpdateField('stripe.test.publishableKey', e.target.value)}
                            placeholder="pk_test_..."
                          />
                        </div>
                        
                        {renderPasswordInput(
                          'Secret Key',
                          formData.stripe?.test?.secretKey,
                          (value) => handleUpdateField('stripe.test.secretKey', value),
                          'stripeTestSecret',
                          'sk_test_...'
                        )}
                        
                        {renderPasswordInput(
                          'Webhook Secret',
                          formData.stripe?.test?.webhookSecret,
                          (value) => handleUpdateField('stripe.test.webhookSecret', value),
                          'stripeTestWebhook',
                          'whsec_...'
                        )}
                      </div>
                    </div>

                    {/* Live Configuration */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Live Configuration</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestStripe('live')}
                          disabled={testStripe.isPending}
                        >
                          {testStripe.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <TestTube2 className="w-4 h-4 mr-2" />
                          )}
                          Test Connection
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Publishable Key</Label>
                          <Input
                            value={formData.stripe?.live?.publishableKey || ''}
                            onChange={(e) => handleUpdateField('stripe.live.publishableKey', e.target.value)}
                            placeholder="pk_live_..."
                          />
                        </div>
                        
                        {renderPasswordInput(
                          'Secret Key',
                          formData.stripe?.live?.secretKey,
                          (value) => handleUpdateField('stripe.live.secretKey', value),
                          'stripeLiveSecret',
                          'sk_live_...'
                        )}
                        
                        {renderPasswordInput(
                          'Webhook Secret',
                          formData.stripe?.live?.webhookSecret,
                          (value) => handleUpdateField('stripe.live.webhookSecret', value),
                          'stripeLiveWebhook',
                          'whsec_...'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* PayPal Configuration */}
            <TabsContent value="paypal" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">PayPal Configuration</h3>
                  <p className="text-sm text-gray-600">Configure PayPal payment processing</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="paypal-enabled">Enabled</Label>
                  <Switch
                    id="paypal-enabled"
                    checked={formData.paypal?.enabled || false}
                    onCheckedChange={(checked) => handleUpdateField('paypal.enabled', checked)}
                  />
                </div>
              </div>

              {formData.paypal?.enabled && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select
                      value={formData.paypal?.mode || 'sandbox'}
                      onValueChange={(value) => handleUpdateField('paypal.mode', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox Mode</SelectItem>
                        <SelectItem value="live">Live Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Sandbox Configuration */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Sandbox Configuration</h4>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Client ID</Label>
                          <Input
                            value={formData.paypal?.sandbox?.clientId || ''}
                            onChange={(e) => handleUpdateField('paypal.sandbox.clientId', e.target.value)}
                            placeholder="PayPal Sandbox Client ID"
                          />
                        </div>
                        
                        {renderPasswordInput(
                          'Client Secret',
                          formData.paypal?.sandbox?.clientSecret,
                          (value) => handleUpdateField('paypal.sandbox.clientSecret', value),
                          'paypalSandboxSecret',
                          'PayPal Sandbox Client Secret'
                        )}
                        
                        <div className="space-y-2">
                          <Label>Webhook ID</Label>
                          <Input
                            value={formData.paypal?.sandbox?.webhookId || ''}
                            onChange={(e) => handleUpdateField('paypal.sandbox.webhookId', e.target.value)}
                            placeholder="Webhook ID (optional)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live Configuration */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Live Configuration</h4>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Client ID</Label>
                          <Input
                            value={formData.paypal?.live?.clientId || ''}
                            onChange={(e) => handleUpdateField('paypal.live.clientId', e.target.value)}
                            placeholder="PayPal Live Client ID"
                          />
                        </div>
                        
                        {renderPasswordInput(
                          'Client Secret',
                          formData.paypal?.live?.clientSecret,
                          (value) => handleUpdateField('paypal.live.clientSecret', value),
                          'paypalLiveSecret',
                          'PayPal Live Client Secret'
                        )}
                        
                        <div className="space-y-2">
                          <Label>Webhook ID</Label>
                          <Input
                            value={formData.paypal?.live?.webhookId || ''}
                            onChange={(e) => handleUpdateField('paypal.live.webhookId', e.target.value)}
                            placeholder="Webhook ID (optional)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">General Settings</h3>
                <p className="text-sm text-gray-600">Configure general payment settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select
                    value={formData.currency || 'USD'}
                    onValueChange={(value) => handleUpdateField('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Environment</Label>
                  <Select
                    value={formData.environment || 'development'}
                    onValueChange={(value) => handleUpdateField('environment', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="min-w-[120px]"
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Stripe Setup:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Create a Stripe account at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">stripe.com</a></li>
              <li>Go to Developers → API keys to get your publishable and secret keys</li>
              <li>Go to Developers → Webhooks to create a webhook endpoint and get the signing secret</li>
              <li>Configure webhook URL: <code className="bg-gray-100 px-1 rounded">{window.location.origin}/api/payments/webhook</code></li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">PayPal Setup:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Create a PayPal Developer account at <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developer.paypal.com</a></li>
              <li>Create an application to get Client ID and Client Secret</li>
              <li>Configure webhook notifications (optional but recommended)</li>
              <li>Test in sandbox mode before switching to live</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 