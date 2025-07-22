import React, { useEffect, useState, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { ArrowLeft, Plus, Calendar, DollarSign, Link, Briefcase, Clock, FileText, Eye, Edit, Search, Filter, Grid, List, ChevronDown, Users, Star, TrendingUp, Clock3, CheckCircle, XCircle, AlertCircle, Send, User, MapPin, Award, ArrowUpDown, Download } from 'lucide-react';
import { ProjectTable } from '@/components/project/ProjectTable';
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
  id: string;
  name: string | null;
  email: string;
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [sortOption, setSortOption] = useState<'CREATED_AT' | 'DEADLINE' | 'BUDGET'>('CREATED_AT');
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

  // Filter projects based on selected category, search term, and status
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;
      
      if (!matchesSearch || !matchesStatus) return false;
      
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'global') return !project.categoryId;
      return project.categoryId === selectedCategory;
    });
  }, [projects, searchTerm, statusFilter, selectedCategory]);

  // Sort projects based on the selected sort option
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      if (sortOption === 'CREATED_AT') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOption === 'DEADLINE') {
        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        return 0;
      } else if (sortOption === 'BUDGET') {
        return (b.budget || 0) - (a.budget || 0);
      }
      return 0;
    });
  }, [filteredProjects, sortOption]);

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

  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleSubmitOfferClick = (project: Project) => {
    setSelectedProject(project);
    setIsSubmitOfferDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    try {
      const csvHeaders = [
        'ID',
        'Title',
        'Description',
        'Status',
        'Budget',
        'Deadline',
        'Category',
        'Created At'
      ];

      const csvData = sortedProjects.map(project => {
        const category = categories.find(c => c.id === project.categoryId);
        return [
          project.id,
          `"${project.title}"`,
          `"${project.description}"`,
          project.status,
          project.budget ? `$${project.budget}` : 'N/A',
          project.deadline ? format(new Date(project.deadline), 'yyyy-MM-dd') : 'N/A',
          category ? category.title : 'Global',
          format(new Date(project.createdAt), 'yyyy-MM-dd')
        ];
      });

      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `projects-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: `Exported ${sortedProjects.length} projects to CSV`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Group projects by category
  const projectsByCategory = {
    all: sortedProjects,
    global: sortedProjects.filter(p => !p.categoryId),
    ...categories.reduce((acc, category) => {
      acc[category.id] = sortedProjects.filter(p => p.categoryId === category.id);
      return acc;
    }, {} as Record<string, typeof projects>)
  };

  // Get category stats
  const getCategoryStats = () => {
    const stats = {
      all: projects.length,
      global: projects.filter(p => !p.categoryId).length
    };
    
    categories.forEach(category => {
      stats[category.id] = projects.filter(p => p.categoryId === category.id).length;
    });
    
    return stats;
  };

  const categoryStats = getCategoryStats();

  const ProjectCard = ({ project }: { project: Project }) => {
    const userOffer = userOffers[project.id];
    const category = categories.find(c => c.id === project.categoryId);
    
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 border-border hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {project.title}
              </CardTitle>
              <CardDescription className="mt-2 line-clamp-3">
                {project.description}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Category & Stats */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {category ? category.title : 'Global'}
              </Badge>
              {!isManager && userOffer && (
                <Badge className={getOfferStatusColor(userOffer.status)}>
                  {userOffer.status}
                </Badge>
              )}
            </div>
            
            {/* Project Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {project.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">${project.budget.toLocaleString()}</span>
                </div>
              )}
              {project.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewProject(project.id)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              {!isManager && project.status === 'OPEN' && !userOffer && (
                <Button
                  size="sm"
                  onClick={() => handleSubmitOfferClick(project)}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Offer
                </Button>
              )}
              {isManager && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditProject(project)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout userProfile={userProfile}>
      <div className="space-y-6 p-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-text-primary">
              {isManager ? 'Projects' : 'Available Projects'}
            </h1>
            <p className="text-text-secondary mt-1 text-sm md:text-base">
              {isManager ? 'Manage your project portfolio' : 'Browse available projects and submit offers'}
            </p>
          </div>
          
          {isManager && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary-hover text-primary-foreground self-start sm:self-auto">
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
          <Card className="bg-card border-border">
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
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOption} onValueChange={(value) => setSortOption(value as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREATED_AT">Created Date</SelectItem>
                    <SelectItem value="DEADLINE">Deadline</SelectItem>
                    <SelectItem value="BUDGET">Budget</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  All ({categoryStats.all})
                </TabsTrigger>
                <TabsTrigger value="global" className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Global ({categoryStats.global})
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    {category.title} ({categoryStats[category.id] || 0})
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Projects Content */}
              <TabsContent value={selectedCategory} className="mt-6">
                {sortedProjects.length === 0 ? (
                  <Card className="bg-card border-border">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No projects found</h3>
                      <p className="text-muted-foreground text-center mb-6">
                        {searchTerm
                          ? `No projects match your search "${searchTerm}"`
                          : `No projects in ${selectedCategory === 'all' ? 'any category' : selectedCategory === 'global' ? 'global category' : categories.find(c => c.id === selectedCategory)?.title || 'this category'}`
                        }
                      </p>
                      {isManager && (
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Project
                        </Button>
                      )}
                    </CardContent>
                  </Card>
) : (
                  <ProjectTable 
                    projects={sortedProjects}
                    isManager={isManager}
                    userOffers={userOffers}
                    onViewProject={handleViewProject}
                    onSubmitOffer={handleSubmitOfferClick}
                    onEditProject={handleEditProject}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    showViewToggle={true}
                    title={`${selectedCategory === 'all' ? 'All Projects' : selectedCategory === 'global' ? 'Global Projects' : categories.find(c => c.id === selectedCategory)?.title || 'Projects'} (${sortedProjects.length})`}
                    onSort={handleSort}
                    sortField={sortField}
                    sortDirection={sortDirection}
                  />
                )}
              </TabsContent>
            </Tabs>
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
    </MainLayout>
  );
};

export default Projects;
