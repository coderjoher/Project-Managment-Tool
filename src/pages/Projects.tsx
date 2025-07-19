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
import { ArrowLeft, Plus, Calendar, DollarSign, Link, Briefcase, Clock, FileText, Eye, Edit } from 'lucide-react';
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

interface UserProfile {
  role: 'MANAGER' | 'FREELANCER';
}

interface Offer {
  id: string;
  projectId: string;
  freelancerId: string;
  price: number;
  deliveryTime: number;
  description: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

interface ProjectCategory {
  id: string;
  title: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userOffers, setUserOffers] = useState<{ [projectId: string]: Offer }>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    driveLink: '',
    deadline: '',
    categoryId: ''
  });
  const [isSubmitOfferDialogOpen, setIsSubmitOfferDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [offerFormData, setOfferFormData] = useState({
    price: '',
    deliveryTime: '',
    description: ''
  });
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
    fetchProjects();
  }, [user, navigate]);
  
  useEffect(() => {
    if (userProfile) {
      fetchUserOffers();
      if (userProfile.role === 'MANAGER') {
        fetchCategories();
      }
    }
  }, [userProfile, user]);

  const fetchCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ProjectCategory')
        .select('id, title, status')
        .eq('managerId', user.id)
        .eq('status', 'ACTIVE')
        .order('title', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as ProjectCategory[]);
    } catch (error: any) {
      toast({
        title: "Error loading categories",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('Project')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading projects",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOffers = async () => {
    if (!user || userProfile?.role !== 'FREELANCER') return;
    
    try {
      const { data, error } = await supabase
        .from('Offer')
        .select('*')
        .eq('freelancerId', user.id);
      
      if (error) throw error;
      
      // Convert to a map for easy lookup
      const offersMap: { [projectId: string]: Offer } = {};
      data?.forEach((offer) => {
        offersMap[offer.projectId] = offer;
      });
      
      setUserOffers(offersMap);
    } catch (error: any) {
      console.error('Error fetching user offers:', error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || userProfile?.role !== 'MANAGER') return;

    try {
      // Generate a UUID for the project
      const projectId = crypto.randomUUID();
      
      const projectData = {
        id: projectId,
        title: formData.title,
        description: formData.description,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        driveLink: formData.driveLink || null,
        deadline: formData.deadline || null,
        categoryId: formData.categoryId,
        managerId: user.id,
        status: 'OPEN' as const,
        updatedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('Project')
        .insert(projectData);

      if (error) throw error;

      toast({
        title: "Project created successfully",
        description: "Your project is now open for offers",
      });

      setIsCreateDialogOpen(false);
      setFormData({ title: '', description: '', budget: '', driveLink: '', deadline: '', categoryId: '' });
      fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject || userProfile?.role !== 'FREELANCER' || isSubmittingOffer) return;

    setIsSubmittingOffer(true);
    try {
      const offerId = crypto.randomUUID();
      
      const offerData = {
        id: offerId,
        projectId: selectedProject.id,
        freelancerId: user.id,
        price: parseFloat(offerFormData.price),
        deliveryTime: parseInt(offerFormData.deliveryTime),
        description: offerFormData.description || null,
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

      setIsSubmitOfferDialogOpen(false);
      setOfferFormData({ price: '', deliveryTime: '', description: '' });
      setSelectedProject(null);
      fetchUserOffers(); // Refresh offers to show the new offer status
    } catch (error: any) {
      toast({
        title: "Error submitting offer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleSubmitOfferClick = (project: Project) => {
    setSelectedProject(project);
    setIsSubmitOfferDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-status-open/10 text-status-open border-status-open/20';
      case 'IN_PROGRESS': return 'bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20';
      case 'COMPLETED': return 'bg-status-completed/10 text-status-completed border-status-completed/20';
      case 'CANCELLED': return 'bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getOfferStatusColor = (status: string) => {
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
          <span className="text-lg">Loading projects...</span>
        </div>
      </div>
    );
  }

  const isManager = userProfile?.role === 'MANAGER';

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
              <h1 className="text-3xl font-bold">{isManager ? 'Projects' : 'Offer Project'}</h1>
              <p className="text-muted-foreground">
                {isManager ? 'Manage your project portfolio' : 'Browse available projects and submit offers'}
              </p>
            </div>
          </div>
          
          {isManager && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new project to start receiving offers from freelancers.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Project Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter project title"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your project requirements"
                        rows={4}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="categoryId">Category *</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.length === 0 ? (
                            <SelectItem value="" disabled>
                              No categories available. Create categories first.
                            </SelectItem>
                          ) : (
                            categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="budget">Budget (Optional)</Label>
                        <Input
                          id="budget"
                          type="number"
                          value={formData.budget}
                          onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="deadline">Deadline (Optional)</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="driveLink">Google Drive Link (Optional)</Label>
                      <Input
                        id="driveLink"
                        value={formData.driveLink}
                        onChange={(e) => setFormData(prev => ({ ...prev, driveLink: e.target.value }))}
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Project</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {projects.length === 0 ? (
          <Card className="bg-gradient-card border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground text-center mb-6">
                {isManager 
                  ? "Start by creating your first project to collaborate with freelancers."
                  : "Check back later for new project opportunities."
                }
              </p>
              {isManager && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="bg-gradient-card border-white/10 hover:shadow-primary transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                      {!isManager && userOffers[project.id] && (
                        <Badge className={getOfferStatusColor(userOffers[project.id].status)}>
                          {userOffers[project.id].status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>Budget: ${project.budget.toLocaleString()}</span>
                      </div>
                    )}
                    {project.deadline && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Deadline: {format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {project.driveLink && (
                      <div className="flex items-center gap-2 text-sm">
                        <Link className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={project.driveLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Resources
                        </a>
                      </div>
                    )}
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {!isManager && project.status === 'OPEN' && !userOffers[project.id] && (
                        <Button
                          size="sm"
                          onClick={() => handleSubmitOfferClick(project)}
                          className="flex-1"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Submit Offer
                        </Button>
                      )}
                      {isManager && project.managerId === user?.id && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/projects/${project.id}`)}
                            title="Edit Project"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Submit Offer Dialog */}
        <Dialog open={isSubmitOfferDialogOpen} onOpenChange={setIsSubmitOfferDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Submit Offer</DialogTitle>
              <DialogDescription>
                {selectedProject && `Submit your offer for "${selectedProject.title}"`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitOffer}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="offer-price">Price ($) *</Label>
                    <Input
                      id="offer-price"
                      type="number"
                      value={offerFormData.price}
                      onChange={(e) => setOfferFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="offer-delivery">Delivery (days) *</Label>
                    <Input
                      id="offer-delivery"
                      type="number"
                      value={offerFormData.deliveryTime}
                      onChange={(e) => setOfferFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                      placeholder="7"
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="offer-description">Additional Notes (Optional)</Label>
                  <Textarea
                    id="offer-description"
                    value={offerFormData.description}
                    onChange={(e) => setOfferFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your approach or add any relevant details"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSubmitOfferDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingOffer}>
                  {isSubmittingOffer ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Offer'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Projects;
