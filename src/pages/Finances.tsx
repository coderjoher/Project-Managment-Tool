import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, DollarSign, TrendingUp, Send, Gift, Plus, ArrowUp, Users, Eye } from 'lucide-react';
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

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('User')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserProfile(data);
        
        // Fetch financial data after profile is loaded
        await fetchFreelancersFinancials();
      } catch (error: any) {
        toast({
          title: "Error loading profile",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchProfile();
  }, [user, navigate, toast]);

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
      const updateId = crypto.randomUUID();

      const updateData = {
        id: updateId,
        financialId: selectedFreelancer.projects[0]?.id || '',
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="w-16 h-16 text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Manager Access Required</h3>
            <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
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
    <MainLayout userProfile={userProfile}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="hover:bg-white/80 dark:hover:bg-slate-800/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-purple-700 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                Financial Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">Welcome back, track your team's earnings</p>
            </div>
          </div>
        </div>

        {freelancers.length === 0 ? (
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <DollarSign className="w-16 h-16 text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No freelancers found</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
                Freelancer financial data will appear here when you have active projects with accepted offers.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Freelancer Card & Summary */}
            <div className="lg:col-span-4 space-y-6">
              {/* Freelancer Card */}
              <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-2xl overflow-hidden">
                <CardContent className="p-6">
                  {selectedFreelancer && (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 ring-2 ring-white/30">
                            <AvatarImage src={selectedFreelancer.freelancerAvatar} />
                            <AvatarFallback className="bg-white/20 text-white">
                              {selectedFreelancer.freelancerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-white">{selectedFreelancer.freelancerName}</h3>
                            <p className="text-purple-100 text-sm">{selectedFreelancer.freelancerEmail}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/10 rounded-lg p-4 mb-4">
                        <div className="text-center">
                          <p className="text-purple-100 text-sm mb-1">Total Balance</p>
                          <p className="text-3xl font-bold text-white">
                            ${(selectedFreelancer.totalEarned + selectedFreelancer.totalPending).toLocaleString()}
                          </p>
                          <p className="text-purple-200 text-sm">USD</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Dialog open={isGiftDialogOpen} onOpenChange={setIsGiftDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="secondary" size="sm" className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0">
                              <Send className="w-4 h-4 mr-1" />
                              Send
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                        <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                          Request
                        </Button>
                        <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                          Top Up
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">${totalStats.totalPaid.toLocaleString()}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Total Paid</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">${totalStats.totalPending.toLocaleString()}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Pending</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Contacts */}
              <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Recent Contacts</CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs text-purple-600 hover:text-purple-700">
                      All Contacts
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:border-purple-500 hover:text-purple-500 cursor-pointer transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                    {freelancers.slice(0, 6).map((freelancer) => (
                      <div
                        key={freelancer.freelancerId}
                        className={`cursor-pointer transition-all duration-200 ${selectedFreelancer?.freelancerId === freelancer.freelancerId
                            ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                            : 'hover:scale-110'
                          }`}
                        onClick={() => setSelectedFreelancer(freelancer)}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={freelancer.freelancerAvatar} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                            {freelancer.freelancerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8">
              <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-xl">
                {selectedFreelancer ? (
                  <>
                    <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 pb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl text-slate-800 dark:text-white mb-1">
                            Transactions History
                          </CardTitle>
                          <CardDescription className="text-slate-600 dark:text-slate-400">
                            Recent financial activities and project payments
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                            Select Date Range
                          </Button>
                          <Button variant="outline" size="sm">
                            <ArrowUp className="w-3 h-3 mr-1" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {selectedFreelancer.projects.map((project, index) => (
                          <div key={project.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors border border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                                {project.projectTitle.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-800 dark:text-white">{project.projectTitle}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {project.paymentStatus === 'PAID' ? 'Payment of Project' : 'Received: Your Payment'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                  {format(new Date(project.createdAt), 'EEE. dd MMMM yyyy')} • {format(new Date(project.createdAt), 'h:mm a')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${project.paymentStatus === 'PAID'
                                  ? 'text-green-600'
                                  : 'text-blue-600'
                                }`}>
                                USD {project.amountPaid > 0 ? project.amountPaid.toLocaleString() : project.acceptedPrice.toLocaleString()}
                              </p>
                              <div className="flex items-center gap-2 justify-end mt-1">
                                <Badge className={`text-xs ${getStatusColor(project.paymentStatus)}`}>
                                  {project.paymentStatus}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => navigate(`/project/${project.projectId}`)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {selectedFreelancer.projects.length === 0 && (
                          <div className="text-center py-8">
                            <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                            <p className="text-slate-600 dark:text-slate-400">No transactions yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Users className="w-16 h-16 text-slate-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-white">Select a freelancer</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-center">
                      Choose a freelancer from the list to view their financial details and project history.
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Send Gift Dialog */}
        <Dialog open={isGiftDialogOpen} onOpenChange={setIsGiftDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleGiveGift}>
              <DialogHeader>
                <DialogTitle>Send Gift or Bonus</DialogTitle>
                <DialogDescription>
                  Send a gift or bonus to {selectedFreelancer?.freelancerName}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <select
                    id="type"
                    className="col-span-3 px-3 py-2 border rounded-md bg-background"
                    value={giftForm.type}
                    onChange={(e) => setGiftForm(prev => ({ ...prev, type: e.target.value as 'bonus' | 'gift' }))}
                  >
                    <option value="bonus">Bonus</option>
                    <option value="gift">Gift</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    className="col-span-3"
                    value={giftForm.amount}
                    onChange={(e) => setGiftForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Enter a message..."
                    className="col-span-3"
                    value={giftForm.description}
                    onChange={(e) => setGiftForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Send {giftForm.type}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout >
  );
};

export default Finances;