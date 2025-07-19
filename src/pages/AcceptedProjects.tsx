import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, DollarSign, Link, CheckCircle, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  driveLink: string | null;
  deadline: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  managerId: string;
}

interface AcceptedOffer {
  id: string;
  projectId: string;
  freelancerId: string;
  price: number;
  deliveryTime: number;
  description: string | null;
  status: 'ACCEPTED' | 'PENDING' | 'REJECTED';
  createdAt: string;
  Project: Project;
}

interface UserProfile {
  role: 'MANAGER' | 'FREELANCER';
}

const AcceptedProjects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [acceptedOffers, setAcceptedOffers] = useState<AcceptedOffer[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
    fetchAcceptedOffers();
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

  const fetchAcceptedOffers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('Offer')
        .select(`
          *,
          Project!inner(*)
        `)
        .eq('freelancerId', user.id)
        .in('status', ['ACCEPTED', 'PENDING'])
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      setAcceptedOffers((data || []) as AcceptedOffer[]);
    } catch (error: any) {
      toast({
        title: "Error loading accepted projects",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'COMPLETED': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-lg">Loading accepted projects...</span>
        </div>
      </div>
    );
  }

  // Only freelancers should access this page
  if (userProfile?.role !== 'FREELANCER') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">This page is only available to freelancers.</p>
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
              <h1 className="text-3xl font-bold">Accepted Projects</h1>
              <p className="text-muted-foreground">
                Projects where your offers have been accepted
              </p>
            </div>
          </div>
        </div>

        {acceptedOffers.length === 0 ? (
          <Card className="bg-gradient-card border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No accepted projects yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                When project managers accept your offers, they will appear here.
              </p>
              <Button onClick={() => navigate('/projects')}>
                <Eye className="w-4 h-4 mr-2" />
                Browse Available Projects
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acceptedOffers.map((offer) => (
              <Card key={offer.id} className="bg-gradient-card border-white/10 hover:shadow-primary transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{offer.Project.title}</CardTitle>
                    <Badge className={getStatusColor(offer.Project.status)}>
                      {offer.Project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {offer.Project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-green-500">Accepted Price: ${offer.price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Delivery: {offer.deliveryTime} day{offer.deliveryTime !== 1 ? 's' : ''}</span>
                    </div>
                    {offer.Project.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>Original Budget: ${offer.Project.budget.toLocaleString()}</span>
                      </div>
                    )}
                    {offer.Project.deadline && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Deadline: {format(new Date(offer.Project.deadline), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {offer.Project.driveLink && (
                      <div className="flex items-center gap-2 text-sm">
                        <Link className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={offer.Project.driveLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Resources
                        </a>
                      </div>
                    )}
                    {offer.description && (
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Your Notes:</p>
                        <p className="line-clamp-2">{offer.description}</p>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-xs text-muted-foreground">
                        Offer Accepted {format(new Date(offer.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/projects/${offer.Project.id}`)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
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

export default AcceptedProjects;
