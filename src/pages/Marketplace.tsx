import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Briefcase, Info, Lock } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: 'MANAGER' | 'FREELANCER';
}

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

      // Check if user is a freelancer
      if (data.role !== 'FREELANCER') {
        toast({
          title: "Access Denied",
          description: "Only freelancers can access the marketplace",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-lg">Loading marketplace...</span>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'FREELANCER') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only freelancers can access this page.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Project Marketplace</h1>
              <p className="text-muted-foreground">Find and apply for projects</p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="w-5 h-5 text-orange-600" />
              How to Apply for Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              To view and apply for available projects, managers need to invite you or share project details directly. 
              Once you submit an offer for a project, you'll be able to track it in your offers page.
            </p>
          </CardContent>
        </Card>

        {/* No Direct Access Card */}
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Project Access Restricted</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                As a freelancer, you cannot directly browse open projects. Projects are shared with you through:
              </p>
              <div className="max-w-sm mx-auto text-left space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                  <p className="text-sm">Direct invitations from project managers</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                  <p className="text-sm">Shared project links or codes</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                  <p className="text-sm">External job postings with project references</p>
                </div>
              </div>
              <div className="mt-8 flex gap-4 justify-center">
                <Button onClick={() => navigate('/offers')}>
                  <Briefcase className="w-4 h-4 mr-2" />
                  View My Offers
                </Button>
                <Button variant="outline" onClick={() => navigate('/messages')}>
                  Contact Managers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Marketplace;
