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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, FileText, DollarSign, Clock, Plus, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Offer {
  id: string;
  projectId: string;
  freelancerId: string;
  price: number;
  deliveryTime: number;
  description: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  Project: {
    title: string;
    managerId: string;
  };
  User?: {
    name: string | null;
    email: string;
  };
}

interface Project {
  id: string;
  title: string;
  status: string;
}

interface UserProfile {
  role: 'MANAGER' | 'FREELANCER';
}

const Offers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    price: '',
    deliveryTime: '',
    description: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
    fetchOffers();
    fetchProjects();
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

  const fetchOffers = async () => {
    if (!user) return;
    
    try {
      let query = supabase.from('Offer').select(`
        *,
        Project!inner(title, managerId),
        User(name, email)
      `);

      // Filter based on user role
      const { data: profile } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'FREELANCER') {
        query = query.eq('freelancerId', user.id);
      } else if (profile?.role === 'MANAGER') {
        query = query.eq('Project.managerId', user.id);
      }

      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) throw error;
      setOffers(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading offers",
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
        .select('id, title, status')
        .eq('status', 'OPEN')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || userProfile?.role !== 'FREELANCER') return;

    try {
      // Generate a UUID for the offer
      const offerId = crypto.randomUUID();
      
      const offerData = {
        id: offerId,
        projectId: formData.projectId,
        freelancerId: user.id,
        price: parseFloat(formData.price),
        deliveryTime: parseInt(formData.deliveryTime),
        description: formData.description || null,
        status: 'PENDING' as const
      };

      const { error } = await supabase
        .from('Offer')
        .insert(offerData);

      if (error) throw error;

      toast({
        title: "Offer submitted successfully",
        description: "Your offer has been sent to the project manager",
      });

      setIsCreateDialogOpen(false);
      setFormData({ projectId: '', price: '', deliveryTime: '', description: '' });
      fetchOffers();
    } catch (error: any) {
      toast({
        title: "Error submitting offer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateOfferStatus = async (offerId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const { error } = await supabase
        .from('Offer')
        .update({ status })
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: `Offer ${status.toLowerCase()}`,
        description: `The offer has been ${status.toLowerCase()}`,
      });

      fetchOffers();
    } catch (error: any) {
      toast({
        title: "Error updating offer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'ACCEPTED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-lg">Loading offers...</span>
        </div>
      </div>
    );
  }

  const isFreelancer = userProfile?.role === 'FREELANCER';

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
              <h1 className="text-3xl font-bold">Offers</h1>
              <p className="text-muted-foreground">
                {isFreelancer ? 'Manage your offer submissions' : 'Review incoming offers'}
              </p>
            </div>
          </div>
          
          {isFreelancer && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Submit New Offer</DialogTitle>
                  <DialogDescription>
                    Submit your offer for a project. Include your price and delivery timeline.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateOffer}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="project">Project *</Label>
                      <Select value={formData.projectId} onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="price">Price ($) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="deliveryTime">Delivery (days) *</Label>
                        <Input
                          id="deliveryTime"
                          type="number"
                          value={formData.deliveryTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                          placeholder="7"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Additional Notes (Optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your approach or add any relevant details"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Submit Offer</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {offers.length === 0 ? (
          <Card className="bg-gradient-card border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No offers found</h3>
              <p className="text-muted-foreground text-center mb-6">
                {isFreelancer 
                  ? "Start by submitting offers to available projects."
                  : "Offers will appear here when freelancers submit them to your projects."
                }
              </p>
              {isFreelancer && projects.length > 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your First Offer
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <Card key={offer.id} className="bg-gradient-card border-white/10 hover:shadow-secondary transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{offer.Project.title}</CardTitle>
                    <Badge className={getStatusColor(offer.status)}>
                      {offer.status}
                    </Badge>
                  </div>
                  {!isFreelancer && offer.User && (
                    <CardDescription>
                      By: {offer.User.name || offer.User.email}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">${offer.price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{offer.deliveryTime} day{offer.deliveryTime !== 1 ? 's' : ''}</span>
                    </div>
                    {offer.description && (
                      <div className="text-sm text-muted-foreground">
                        <p className="line-clamp-3">{offer.description}</p>
                      </div>
                    )}
                    
                    {!isFreelancer && offer.status === 'PENDING' && (
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleUpdateOfferStatus(offer.id, 'ACCEPTED')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleUpdateOfferStatus(offer.id, 'REJECTED')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-xs text-muted-foreground">
                        Submitted {format(new Date(offer.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;