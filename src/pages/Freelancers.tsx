import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, Search, Mail, Calendar, User, Briefcase, Star, Eye, Plus, Send, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';

interface FreelancerProfile {
  id: string;
  name: string | null;
  email: string;
  role: 'MANAGER' | 'FREELANCER';
  avatar: string | null;
  createdAt: string;
}

interface FreelancerStats {
  totalOffers: number;
  acceptedOffers: number;
  totalEarnings: number;
  activeProjects: number;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: 'MANAGER' | 'FREELANCER';
}

const Freelancers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [freelancerStats, setFreelancerStats] = useState<Record<string, FreelancerStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFreelancers, setFilteredFreelancers] = useState<FreelancerProfile[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
  }, [user, navigate]);

  useEffect(() => {
    if (freelancers.length > 0) {
      const filtered = freelancers.filter(freelancer => 
        freelancer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFreelancers(filtered);
    }
  }, [searchTerm, freelancers]);

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

      // Check if user is a manager
      if (data.role !== 'MANAGER') {
        toast({
          title: "Access Denied",
          description: "Only managers can access the freelancers page",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      // Fetch freelancers if user is a manager
      await fetchFreelancers();
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

  const fetchFreelancers = async () => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('role', 'FREELANCER')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      setFreelancers(data);
      setFilteredFreelancers(data);
      
      // Fetch stats for each freelancer
      if (data.length > 0) {
        await fetchFreelancerStats(data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading freelancers",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchFreelancerStats = async (freelancerList: FreelancerProfile[]) => {
    const stats: Record<string, FreelancerStats> = {};
    
    for (const freelancer of freelancerList) {
      try {
        // Get offer statistics
        const { data: offers, error: offersError } = await supabase
          .from('Offer')
          .select('*')
          .eq('freelancerId', freelancer.id);

        if (offersError) throw offersError;

        const totalOffers = offers?.length || 0;
        const acceptedOffers = offers?.filter(offer => offer.status === 'ACCEPTED').length || 0;
        const totalEarnings = offers?.filter(offer => offer.status === 'ACCEPTED')
          .reduce((sum, offer) => sum + offer.price, 0) || 0;

        // Get active projects count
        const { data: activeProjects, error: projectsError } = await supabase
          .from('Project')
          .select('id')
          .eq('status', 'IN_PROGRESS')
          .in('id', offers?.filter(offer => offer.status === 'ACCEPTED').map(offer => offer.projectId) || []);

        if (projectsError) throw projectsError;

        stats[freelancer.id] = {
          totalOffers,
          acceptedOffers,
          totalEarnings,
          activeProjects: activeProjects?.length || 0
        };
      } catch (error) {
        console.error(`Error fetching stats for freelancer ${freelancer.id}:`, error);
        stats[freelancer.id] = {
          totalOffers: 0,
          acceptedOffers: 0,
          totalEarnings: 0,
          activeProjects: 0
        };
      }
    }
    
    setFreelancerStats(stats);
  };

  const handleInviteFreelancer = async () => {
    if (!user) return;

    setInviteLoading(true);
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
          role: 'FREELANCER',
          email: inviteEmail,
          invited_by: user?.id,
          expires_at: expiresAt.toISOString(),
        });

      if (inviteError) throw inviteError;

      setGeneratedInviteUrl(`${window.location.origin}/auth?token=${token}`);
      toast({
        title: "Invitation Link Generated",
        description: inviteEmail 
          ? `Invitation link has been created for ${inviteEmail}`
          : "Invitation link has been created for freelancer signup",
      });

      setInviteEmail('');
    } catch (error: any) {
      toast({
        title: "Error generating invitation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInviteUrl = async () => {
    if (generatedInviteUrl) {
      await navigator.clipboard.writeText(generatedInviteUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Invitation URL copied to clipboard",
      });
    }
  };

  const handleCloseInviteDialog = () => {
    setIsInviteDialogOpen(false);
    setGeneratedInviteUrl('');
    setUrlCopied(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-lg">Loading freelancers...</span>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'MANAGER') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only managers can access this page.</p>
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
              <h1 className="text-3xl font-bold">Freelancers</h1>
              <p className="text-muted-foreground">Manage and view all freelancer accounts</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              <Users className="w-4 h-4 mr-1" />
              {freelancers.length} Freelancers
            </Badge>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => setIsInviteDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Invite Freelancer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Freelancer</DialogTitle>
                  <DialogDescription>
                    Generate a one-time invitation link for a new freelancer to sign up. Email is optional.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {!generatedInviteUrl ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email Address (Optional)</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="freelancer@example.com (optional)"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleCloseInviteDialog}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleInviteFreelancer} 
                          disabled={inviteLoading}
                          className="gap-2"
                        >
                          {inviteLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Generate Invitation Link
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Invitation Link Generated</Label>
                        <div className="p-3 bg-muted rounded-lg border">
                          <div className="text-sm font-mono break-all mb-3">
                            {generatedInviteUrl}
                          </div>
                          <Button 
                            onClick={copyInviteUrl} 
                            className="w-full gap-2"
                            variant={urlCopied ? "secondary" : "default"}
                          >
                            {urlCopied ? (
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
                        </div>
                      </div>
                      <Alert>
                        <Mail className="h-4 w-4" />
                        <AlertDescription>
                          Share this link with the freelancer. They can use it once to create their account.
                        </AlertDescription>
                      </Alert>
                      <div className="flex justify-end">
                        <Button onClick={handleCloseInviteDialog}>
                          Done
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search freelancers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Freelancers Grid */}
        {filteredFreelancers.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No freelancers found' : 'No freelancers yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Try adjusting your search terms to find freelancers.'
                    : 'Freelancers will appear here once they sign up for the platform.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFreelancers.map((freelancer) => {
              const stats = freelancerStats[freelancer.id] || {
                totalOffers: 0,
                acceptedOffers: 0,
                totalEarnings: 0,
                activeProjects: 0
              };

              return (
                <Card key={freelancer.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                        {freelancer.avatar ? (
                          <img 
                            src={freelancer.avatar} 
                            alt={freelancer.name || 'Freelancer'} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {freelancer.name || 'Unnamed Freelancer'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {freelancer.email}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Briefcase className="w-3 h-3 mr-1" />
                        Freelancer
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">{stats.totalOffers}</div>
                          <div className="text-xs text-muted-foreground">Total Offers</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{stats.acceptedOffers}</div>
                          <div className="text-xs text-muted-foreground">Accepted</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{stats.activeProjects}</div>
                          <div className="text-xs text-muted-foreground">Active Projects</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">${stats.totalEarnings}</div>
                          <div className="text-xs text-muted-foreground">Total Earnings</div>
                        </div>
                      </div>

                      {/* Success Rate */}
                      <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">Success Rate</span>
                        </div>
                        <Badge variant="secondary">
                          {stats.totalOffers > 0 
                            ? `${Math.round((stats.acceptedOffers / stats.totalOffers) * 100)}%`
                            : 'N/A'
                          }
                        </Badge>
                      </div>

                      {/* Join Date */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined
                        </div>
                        <span>{format(new Date(freelancer.createdAt), 'MMM dd, yyyy')}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/messages`)}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/projects`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Projects
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Freelancers;
