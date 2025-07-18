import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  LogOut
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-card border-b border-white/10 backdrop-blur-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">OfferSync Sphere</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {userProfile?.name || userProfile?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge 
                variant="secondary" 
                className={isManager ? "bg-gradient-secondary" : "bg-gradient-tertiary"}
              >
                {userProfile?.role}
              </Badge>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}!
          </h2>
          <p className="text-muted-foreground">
            {isManager 
              ? "Manage your projects and track collaboration progress." 
              : "Discover new opportunities and manage your offers."
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="bg-gradient-card border-white/10 hover:shadow-primary transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/projects')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6 text-primary-foreground" />
                </div>
                {isManager && <Plus className="w-5 h-5 text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1">Projects</CardTitle>
              <CardDescription>
                {isManager ? "Create and manage projects" : "Browse available projects"}
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-card border-white/10 hover:shadow-secondary transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/offers')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-secondary-foreground" />
                </div>
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1">Offers</CardTitle>
              <CardDescription>
                {isManager ? "Review incoming offers" : "Manage your submissions"}
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-card border-white/10 hover:shadow-tertiary transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/messages')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-tertiary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-tertiary-foreground" />
                </div>
                <div className="w-2 h-2 bg-tertiary rounded-full"></div>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1">Messages</CardTitle>
              <CardDescription>
                Real-time project communication
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-card border-white/10 hover:shadow-primary transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/finances')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-primary-foreground" />
                </div>
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1">Finances</CardTitle>
              <CardDescription>
                {isManager ? "Track payments and budgets" : "View earnings and invoices"}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-card border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Recent Projects
              </CardTitle>
              <CardDescription>
                Your latest project activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div>
                    <h4 className="font-medium">E-commerce Platform</h4>
                    <p className="text-sm text-muted-foreground">3 offers submitted</p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div>
                    <h4 className="font-medium">Mobile App Design</h4>
                    <p className="text-sm text-muted-foreground">In progress</p>
                  </div>
                  <Badge variant="secondary">Working</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div>
                    <h4 className="font-medium">Website Redesign</h4>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <Badge variant="default" className="bg-success">Done</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Recent Messages
              </CardTitle>
              <CardDescription>
                Latest conversation updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
                    <span className="text-xs text-secondary-foreground font-medium">JS</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">John Smith</h4>
                    <p className="text-sm text-muted-foreground">The latest designs look great! When can we...</p>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-tertiary rounded-full flex items-center justify-center">
                    <span className="text-xs text-tertiary-foreground font-medium">AM</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Alice Miller</h4>
                    <p className="text-sm text-muted-foreground">I've uploaded the revised proposal to...</p>
                    <span className="text-xs text-muted-foreground">5 hours ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-xs text-primary-foreground font-medium">RD</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Robert Davis</h4>
                    <p className="text-sm text-muted-foreground">Thanks for the quick turnaround on this...</p>
                    <span className="text-xs text-muted-foreground">1 day ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-hero/20 border-white/10 backdrop-blur-glass">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-2">Ready to get started?</h3>
              <p className="text-muted-foreground mb-6">
                {isManager 
                  ? "Create your first project and start collaborating with talented freelancers."
                  : "Browse available projects and submit your best offers to get hired."
                }
              </p>
              <Button 
                size="lg" 
                variant={isManager ? "secondary" : "tertiary"}
                className="px-8"
              >
                <Plus className="w-5 h-5 mr-2" />
                {isManager ? "Create Project" : "Find Projects"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;