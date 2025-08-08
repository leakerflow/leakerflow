'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from 'lucide-react';

interface GoogleSignInProps {
  returnUrl?: string;
}

export default function GoogleSignIn({ returnUrl }: GoogleSignInProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log('returnUrl', returnUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Build callback URL using current origin (will be 3100 under toolbar)
          redirectTo: `${window.location.origin}/auth/callback${
            returnUrl ? `?next=${encodeURIComponent(returnUrl)}` : ''
          }`,
          // Request URL back so we can force top-level navigation when inside iframe
          queryParams: { prompt: 'consent' },
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      // Force top-level navigation (outside iframe) to satisfy Google login requirements
      if (data?.url) {
        if (window.top) {
          (window.top as Window).location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full h-12 flex items-center justify-center text-sm font-medium tracking-wide rounded-full bg-background text-foreground border border-border hover:bg-accent/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-sans"
      type="button"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FcGoogle className="w-4 h-4 mr-2" />
      )}
      <span className="font-medium">
        {isLoading ? 'Signing in...' : 'Continue with Google'}
      </span>
    </button>
  );
}