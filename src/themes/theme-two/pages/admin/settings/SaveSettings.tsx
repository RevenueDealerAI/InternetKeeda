import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import type { SiteConfig } from '@/types/siteConfig';

interface SaveSettingsProps {
  data: Partial<SiteConfig>;
  onSuccess: (response: Record<string, unknown>) => void;
  label?: string;
}

export default function SaveSettings({ data, onSuccess, label = 'Save Settings' }: SaveSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { getToken } = useAuth();

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication failed. You must be logged in to save settings.');
        setLoading(false);
        return;
      }
      
      // Log what we're saving
      console.log('Saving data:', data);
      
      // Direct API call with axios
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/';
      console.log(`Sending PUT request to ${apiBaseUrl}/api/config`);
      
      const response = await axios.put(`${apiBaseUrl}/api/config`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Save response:', response.data);
      
      setSuccess(true);
      onSuccess(response.data);
      
      // Clear success after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      
      const apiError = err as { 
        response?: { data?: { error?: string }, status?: number }; 
        message?: string;
        code?: string;
      };
      
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        setError('Authentication error. Please ensure you have admin privileges.');
      } else if (apiError.response?.data?.error) {
        setError(apiError.response.data.error);
      } else if (apiError.message?.includes('Network Error')) {
        setError('Network error. Please check your internet connection and server status.');
      } else if (apiError.message) {
        setError(apiError.message);
      } else {
        setError('Failed to save settings. Please try again.');
      }
      
      console.log('Error details:', {
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-center text-red-500 text-sm mb-2">
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span>{error}</span>
        </div>
      )}
      
      <Button 
        onClick={handleSave} 
        disabled={loading}
        className={success ? "bg-green-500 hover:bg-green-600" : ""}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : success ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Saved!
          </>
        ) : (
          label
        )}
      </Button>
    </div>
  );
} 