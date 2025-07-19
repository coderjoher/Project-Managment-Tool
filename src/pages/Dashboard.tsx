import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SimpleThemeToggle } from '@/components/theme/ThemeToggle';
import Layout from '@/components/layout';
import { 
  Users, 
  Briefcase, 
  MessageSquare, 
  DollarSign, 
  Plus, 
  Bell,
  Calendar,
  TrendingUp,
  FileText,
  LogOut,
  BarChart3,
  Clock,
  CheckCircle,
  Eye,
  Tag
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: 'MANAGER' | 'FREELANCER';
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
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

      if (error) {
        console.log('No user profile found, creating one...');
        // Create user profile if it doesn't exist
        const role = user.user_metadata?.role || 'FREELANCER';
        const { data: newProfile, error: createError } = await supabase
          .from('User')
          .insert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || null,
            role: role
          })
          .select()
          .single();

        if (createError) throw createError;
        setUserProfile(newProfile);
      } else {
        setUserProfile(data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const isManager = userProfile?.role === 'MANAGER';

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Welcome back, User!</h2>
              <p className="text-muted-foreground">
                Here's what's happening with your projects today.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <SimpleThemeToggle />
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Projects</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Offers</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold">1</p>
                  </div>
                      <div className="w-12 h-12 bg-status-in-progress/10 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-status-in-progress" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                      <div className="w-12 h-12 bg-status-completed/10 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-status-completed" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manager Quick Actions */}
          {isManager && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/categories')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <Tag className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Manage Categories</h4>
                        <p className="text-sm text-muted-foreground">Organize your projects</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/projects')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Manage Projects</h4>
                        <p className="text-sm text-muted-foreground">View and create projects</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/messages')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Messages</h4>
                        <p className="text-sm text-muted-foreground">Chat with freelancers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/freelancers')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">View Freelancers</h4>
                        <p className="text-sm text-muted-foreground">Manage freelancer accounts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Recent Projects and Offers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Projects</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-primary hover:text-primary/80"
                    onClick={() => navigate('/projects')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    OPEN
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div>
                      <h4 className="font-medium">First</h4>
                      <p className="text-sm text-muted-foreground">7/18/2025</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">OPEN</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div>
                      <h4 className="font-medium">This is first project</h4>
                      <p className="text-sm text-muted-foreground">7/18/2025</p>
                    </div>
                    <Badge className="bg-status-in-progress text-white">IN PROGRESS</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Recent Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div>
                      <h4 className="font-medium">$500</h4>
                      <p className="text-sm text-muted-foreground">First</p>
                    </div>
                    <Badge className="bg-status-completed text-white">ACCEPTED</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div>
                      <h4 className="font-medium">$880</h4>
                      <p className="text-sm text-muted-foreground">This is first project</p>
                    </div>
                    <Badge className="bg-status-completed text-white">ACCEPTED</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;