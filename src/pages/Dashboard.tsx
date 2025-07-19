import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SimpleThemeToggle } from '@/components/theme/ThemeToggle';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProjectTable } from '@/components/project/ProjectTable';
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

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  managerId: string;
  categoryId?: string;
  createdAt: string;
  Category?: { name: string };
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchUserProfile();
    fetchProjects();
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

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('Project')
        .select(`
          *,
          Category (
            name
          )
        `)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setProjects([]);
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
    <MainLayout userProfile={userProfile}>
      <div className="space-y-6 p-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Dashboard</h1>
            <p className="text-text-secondary mt-1 text-sm md:text-base">
              Welcome back! Here's what's happening with your projects.
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground self-start sm:self-auto">
            View All Projects
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Total Projects</p>
                <p className="text-2xl font-semibold text-text-primary">2</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Active Offers</p>
                <p className="text-2xl font-semibold text-text-primary">0</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-text-muted">In Progress</p>
                <p className="text-2xl font-semibold text-text-primary">1</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Completed</p>
                <p className="text-2xl font-semibold text-text-primary">0</p>
              </div>
            </div>
          </div>
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

          {/* Recent Projects Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-text-primary">Recent Projects</h2>
              <Button variant="outline" size="sm" className="self-start sm:self-auto" onClick={() => navigate('/projects')}>
                View All
              </Button>
            </div>

            {/* Project Table */}
            <ProjectTable 
              projects={projects.slice(0, 5)} // Show only first 5 projects
              isManager={isManager}
              userOffers={{}}
              onViewProject={(projectId) => navigate(`/projects/${projectId}`)}
              onSubmitOffer={() => {}}
              onEditProject={() => {}}
            />
          </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;