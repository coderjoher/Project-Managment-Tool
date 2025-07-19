import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, DollarSign, TrendingUp, Send, Gift, Plus, ArrowUp, ArrowDown, Users, Calendar, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface FreelancerFinancial {
  freelancerId: string;
  freelancerName: string;
  freelancerEmail: string;
  freelancerAvatar?: string;
  totalEarned: number;
  totalPending: number;
  projectCount: number;
  lastPayment?: string;
  projects: ProjectFinancial[];
}

interface ProjectFinancial {
  id: string;
  projectId: string;
  projectTitle: string;
  acceptedPrice: number;
  amountPaid: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  createdAt: string;
}

interface UserProfile {
  role: 'MANAGER' | 'FREELANCER';
}

const Finances = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [freelancers, setFreelancers] = useState<FreelancerFinancial[]>([]);
  const [selectedFreelancer, setSelectedFreelancer] = useState<FreelancerFinancial | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);
  const [giftForm, setGiftForm] = useState({
    amount: '',
    description: '',
    type: 'bonus' as 'bonus' | 'gift'
  });

  const [totalStats, setTotalStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    activeFreelancers: 0,
    completedProjects: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
    fetchFreelancersFinancials();
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchFreelancersFinancials = async () => {
    if (!user) return;
    
    try {
      // Get user profile first
      const { data: profile } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'MANAGER') {
        // For non-managers, redirect or show different view
        setLoading(false);
        return;
      }

      // Get all projects managed by this user with their financials and freelancers
      const { data: projectsData, error: projectsError } = await supabase
        .from('Project')
        .select(`
          id,
          title,
          managerId,
          Financial (
            id,
            projectId,
            acceptedPrice,
            amountPaid,
            paymentStatus,
            createdAt
          ),
          Offer!inner (
            freelancerId,
            status
          )
        `)
        .eq('managerId', user.id)
        .eq('Offer.status', 'ACCEPTED');

      if (projectsError) throw projectsError;

      // Get freelancer details
      const freelancerIds = [...new Set(projectsData?.flatMap(p => p.Offer.map(o => o.freelancerId)) || [])];
      
      const { data: freelancersData, error: freelancersError } = await supabase
        .from('User')
        .select('id, name, email, avatar')
        .in('id', freelancerIds);

      if (freelancersError) throw freelancersError;

      // Process data to group by freelancer
      const freelancerMap = new Map<string, FreelancerFinancial>();
      
      projectsData?.forEach(project => {
        project.Offer.forEach(offer => {
          if (offer.status === 'ACCEPTED') {
            const freelancer = freelancersData?.find(f => f.id === offer.freelancerId);
            if (!freelancer) return;

            const financial = project.Financial[0];
            if (!financial) return;

            const key = offer.freelancerId;
            
            if (!freelancerMap.has(key)) {
              freelancerMap.set(key, {
                freelancerId: offer.freelancerId,
                freelancerName: freelancer.name || 'Unknown',
                freelancerEmail: freelancer.email,
                freelancerAvatar: freelancer.avatar,
                totalEarned: 0,
                totalPending: 0,
                projectCount: 0,
                projects: []
              });
            }

            const freelancerData = freelancerMap.get(key)!;
            freelancerData.totalEarned += financial.amountPaid;
            freelancerData.totalPending += (financial.acceptedPrice - financial.amountPaid);
            freelancerData.projectCount++;
            freelancerData.projects.push({
              id: financial.id,
              projectId: project.id,
              projectTitle: project.title,
              acceptedPrice: financial.acceptedPrice,
              amountPaid: financial.amountPaid,
              paymentStatus: financial.paymentStatus,
              createdAt: financial.createdAt
            });
          }
        });
      });

      const freelancersList = Array.from(freelancerMap.values());
      setFreelancers(freelancersList);

      // Calculate total stats
      const stats = {
        totalPaid: freelancersList.reduce((sum, f) => sum + f.totalEarned, 0),
        totalPending: freelancersList.reduce((sum, f) => sum + f.totalPending, 0),
        activeFreelancers: freelancersList.length,
        completedProjects: freelancersList.reduce((sum, f) => sum + f.projects.filter(p => p.paymentStatus === 'PAID').length, 0)
      };
      setTotalStats(stats);

      if (freelancersList.length > 0) {
        setSelectedFreelancer(freelancersList[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error loading financials",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGiveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFreelancer || !user) return;

    try {
      // Create a special financial update for gifts/bonuses
      const updateId = crypto.randomUUID();
      
      const updateData = {
        id: updateId,
        financialId: selectedFreelancer.projects[0]?.id || '', // Use first project or create a general one
        amount: parseFloat(giftForm.amount),
        description: `${giftForm.type === 'gift' ? '🎁 Gift' : '💰 Bonus'}: ${giftForm.description}`,
        updatedById: user.id
      };

      const { error } = await supabase
        .from('FinancialUpdate')
        .insert(updateData);

      if (error) throw error;

      toast({
        title: `${giftForm.type === 'gift' ? 'Gift' : 'Bonus'} sent successfully!`,
        description: `Sent $${giftForm.amount} to ${selectedFreelancer.freelancerName}`,
      });

      setIsGiftDialogOpen(false);
      setGiftForm({ amount: '', description: '', type: 'bonus' });
      fetchFreelancersFinancials();
    } catch (error: any) {
      toast({
        title: "Error sending gift",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'PARTIAL': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'PAID': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'OVERDUE': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-lg">Loading finances...</span>
        </div>
      </div>
    );
  }

  const isManager = userProfile?.role === 'MANAGER';

  if (!isManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Manager Access Required</h3>
            <p className="text-muted-foreground text-center mb-6">
              This page is only available for managers to track freelancer payments.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Financial Dashboard</h1>
              <p className="text-muted-foreground">Manage freelancer payments and track earnings</p>
            </div>
          </div>
        </div>

        {/* Top Cards - Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">${totalStats.totalPaid.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                  <p className="text-2xl font-bold text-blue-600">${totalStats.totalPending.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Freelancers</p>
                  <p className="text-2xl font-bold text-purple-600">{totalStats.activeFreelancers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Projects</p>
                  <p className="text-2xl font-bold text-orange-600">{totalStats.completedProjects}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {freelancers.length === 0 ? (
          <Card className="bg-gradient-card border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <DollarSign className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No freelancers found</h3>
              <p className="text-muted-foreground text-center mb-6">
                Freelancer financial data will appear here when you have active projects with accepted offers.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Freelancers List */}
            <Card className="bg-gradient-card border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Freelancers
                </CardTitle>
                <CardDescription>Select a freelancer to view details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {freelancers.map((freelancer) => (
                    <div
                      key={freelancer.freelancerId}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedFreelancer?.freelancerId === freelancer.freelancerId 
                          ? 'bg-primary/10 border border-primary/20 scale-[1.02]' 
                          : 'hover:bg-muted/20 hover:scale-[1.01]'
                      }`}
                      onClick={() => setSelectedFreelancer(freelancer)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={freelancer.freelancerAvatar} />
                          <AvatarFallback>
                            {freelancer.freelancerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{freelancer.freelancerName}</h4>
                          <p className="text-xs text-muted-foreground truncate">{freelancer.freelancerEmail}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">Earned: ${freelancer.totalEarned.toLocaleString()}</span>
                          <span className="text-blue-600">Pending: ${freelancer.totalPending.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{freelancer.projectCount} projects</span>
                          <span>{freelancer.projects.filter(p => p.paymentStatus === 'PAID').length} paid</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Freelancer Details */}
            <Card className="lg:col-span-2 bg-gradient-card border-white/10">
              {selectedFreelancer ? (
                <>
                  <CardHeader className="border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={selectedFreelancer.freelancerAvatar} />
                          <AvatarFallback>
                            {selectedFreelancer.freelancerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle>{selectedFreelancer.freelancerName}</CardTitle>
                          <CardDescription>{selectedFreelancer.freelancerEmail}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={isGiftDialogOpen} onOpenChange={setIsGiftDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Gift className="w-4 h-4 mr-2" />
                              Send Gift
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send Gift or Bonus</DialogTitle>
                              <DialogDescription>
                                Send a bonus payment or gift to {selectedFreelancer.freelancerName}
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleGiveGift}>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label>Type</Label>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant={giftForm.type === 'bonus' ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setGiftForm(prev => ({ ...prev, type: 'bonus' }))}
                                    >
                                      💰 Bonus
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={giftForm.type === 'gift' ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setGiftForm(prev => ({ ...prev, type: 'gift' }))}
                                    >
                                      🎁 Gift
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="gift-amount">Amount *</Label>
                                  <Input
                                    id="gift-amount"
                                    type="number"
                                    value={giftForm.amount}
                                    onChange={(e) => setGiftForm(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    required
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="gift-description">Message *</Label>
                                  <Textarea
                                    id="gift-description"
                                    value={giftForm.description}
                                    onChange={(e) => setGiftForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Add a message for the gift/bonus"
                                    required
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsGiftDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit">
                                  <Send className="w-4 h-4 mr-2" />
                                  Send {giftForm.type === 'gift' ? 'Gift' : 'Bonus'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-muted/10">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Total Earned</p>
                              <p className="text-xl font-bold">${selectedFreelancer.totalEarned.toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/10">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Pending</p>
                              <p className="text-xl font-bold">${selectedFreelancer.totalPending.toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/10">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Projects</p>
                              <p className="text-xl font-bold">{selectedFreelancer.projectCount}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Projects List */}
                    <div>
                      <h4 className="font-semibold mb-4">Project Financials</h4>
                      <div className="space-y-3">
                        {selectedFreelancer.projects.map((project) => (
                          <Card key={project.id} className="bg-muted/10">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium">{project.projectTitle}</h5>
                                <Badge className={getStatusColor(project.paymentStatus)}>
                                  {project.paymentStatus}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Total Value</p>
                                  <p className="font-medium">${project.acceptedPrice.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Paid</p>
                                  <p className="font-medium">${project.amountPaid.toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="mt-3">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Progress</span>
                                  <span>{Math.round((project.amountPaid / project.acceptedPrice) * 100)}%</span>
                                </div>
                                <Progress 
                                  value={(project.amountPaid / project.acceptedPrice) * 100} 
                                  className="h-2"
                                />
                              </div>
                              <div className="mt-2 flex justify-between items-center">
                                <p className="text-xs text-muted-foreground">
                                  Created: {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/project/${project.projectId}`)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Users className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a freelancer</h3>
                  <p className="text-muted-foreground text-center">
                    Choose a freelancer from the list to view their financial details and project history.
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finances;