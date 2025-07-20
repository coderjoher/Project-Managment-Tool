import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Copy, Plus, Check, User } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: 'MANAGER' | 'FREELANCER';
  is_superadmin: boolean;
}

interface ManagerInvite {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

const SuperAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [invites, setInvites] = useState<ManagerInvite[]>([]);
  const [urlCopied, setUrlCopied] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);

      // Check if user is a superadmin
      if (!data.is_superadmin) {
        toast({
          title: "Access Denied",
          description: "Only superadmins can access this page",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      // Fetch manager invites
      await fetchManagerInvites();
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagerInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('role', 'MANAGER')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error: any) {
      console.error('Error fetching invites:', error);
    }
  };

  const generateManagerSignupLink = async () => {
    setGeneratingLink(true);
    try {
      // Generate a unique token
      const token = crypto.randomUUID();

      // Set expiry to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation record
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          token,
          role: 'MANAGER',
          email: '', // Allow empty email for general signup links
          invited_by: user?.id,
          expires_at: expiresAt.toISOString(),
        });

      if (inviteError) throw inviteError;

      toast({
        title: "Success",
        description: "New manager signup link generated",
      });

      // Refresh the invites list
      await fetchManagerInvites();
    } catch (error: any) {
      toast({
        title: "Error generating link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const copySignupLink = async (token: string) => {
    const signupLink = `${window.location.origin}/auth?token=${token}`;
    await navigator.clipboard.writeText(signupLink);
    setUrlCopied(prev => ({ ...prev, [token]: true }));
    setTimeout(() => {
      setUrlCopied(prev => ({ ...prev, [token]: false }));
    }, 2000);
    toast({
      title: "Copied!",
      description: "Signup link copied to clipboard",
    });
  };

  const deleteInvite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invite link deleted successfully",
      });

      // Refresh the invites list
      await fetchManagerInvites();
    } catch (error: any) {
      toast({
        title: "Error deleting invite",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (!userProfile || !userProfile.is_superadmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only superadmins can access this page.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <MainLayout userProfile={userProfile}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">SuperAdmin</h1>
              <p className="text-muted-foreground">Manage manager signup links</p>
            </div>
          </div>
          <Button
            onClick={generateManagerSignupLink}
            disabled={generatingLink}
            className="gap-2"
          >
            {generatingLink ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Generate Manager Signup Link
              </>
            )}
          </Button>
        </div>

        {/* Active Links */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Manager Signup Links
              </CardTitle>
              <CardDescription>
                Active signup links for new managers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active signup links</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">Manager</Badge>
                          {invite.used_at ? (
                            <Badge variant="default">Used</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-500 border-green-500">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(invite.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!invite.used_at && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => copySignupLink(invite.token)}
                          >
                            {urlCopied[invite.token] ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy Link
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteInvite(invite.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Alert>
            <AlertDescription>
              These links can be used once to create a new manager account.
              They expire after 7 days or when used.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </MainLayout>
  );
};

export default SuperAdmin;
