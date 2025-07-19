import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, DollarSign, Link, Edit, RefreshCw, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import CustomerDetails from '@/components/project/CustomerDetails';
import ProjectFinancial from '@/components/project/ProjectFinancial';
import ProjectLog from '@/components/project/ProjectLog';

interface Project {
  id: string;
  title: string;
  description: string;
  briefDetails: string | null;
  budget: number | null;
  driveLink: string | null;
  deadline: string | null;
  categoryId: string | null;
  statusId: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  managerId: string;
}

interface CategoryStatus {
  id: string;
  title: string;
  color: string;
  order: number;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: 'MANAGER' | 'FREELANCER';
}

const ProjectDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [categoryStatuses, setCategoryStatuses] = useState<CategoryStatus[]>([]);
  const [hasAcceptedOffer, setHasAcceptedOffer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    briefDetails: '',
    budget: '',
    driveLink: '',
    deadline: '',
    statusId: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !projectId) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
    fetchProject();
  }, [user, projectId, navigate]);

  // Check for accepted offer after userProfile is loaded
  useEffect(() => {
    if (userProfile) {
      checkAcceptedOffer();
    }
  }, [userProfile, user, projectId]);

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
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('Project')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      setProject(data);
      
      // Fetch category statuses if project has a category
      if (data.categoryId) {
        fetchCategoryStatuses(data.categoryId);
      }
      
      // Set form data for editing
      setEditFormData({
        title: data.title,
        description: data.description,
        briefDetails: data.briefDetails || '',
        budget: data.budget ? data.budget.toString() : '',
        driveLink: data.driveLink || '',
        deadline: data.deadline || '',
        statusId: data.statusId || '',
      });
    } catch (error: any) {
      toast({
        title: "Error loading project details",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryStatuses = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('CategoryStatus')
        .select('*')
        .eq('categoryId', categoryId)
        .order('order', { ascending: true });

      if (error) throw error;
      setCategoryStatuses(data || []);
    } catch (error: any) {
      console.error('Error fetching category statuses:', error);
    }
  };

  const checkAcceptedOffer = async () => {
    if (!user || !projectId || !userProfile?.role) return;
    
    // Only check for freelancers
    if (userProfile.role !== 'FREELANCER') {
      setHasAcceptedOffer(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('Offer')
        .select('id')
        .eq('projectId', projectId)
        .eq('freelancerId', user.id)
        .eq('status', 'ACCEPTED')
        .maybeSingle();

      if (error) {
        console.error('Error checking accepted offer:', error);
        setHasAcceptedOffer(false);
        return;
      }

      setHasAcceptedOffer(!!data);
    } catch (error: any) {
      console.error('Error checking accepted offer:', error);
      setHasAcceptedOffer(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!project || !editFormData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Project title is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        briefDetails: editFormData.briefDetails.trim() || null,
        budget: editFormData.budget ? parseFloat(editFormData.budget) : null,
        driveLink: editFormData.driveLink.trim() || null,
        deadline: editFormData.deadline || null,
        statusId: editFormData.statusId || null,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('Project')
        .update(updateData)
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Project updated",
        description: "Project has been updated successfully",
      });

      setIsEditDialogOpen(false);
      fetchProject();
    } catch (error: any) {
      toast({
        title: "Error updating project",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('Project')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully",
      });

      navigate('/projects');
    } catch (error: any) {
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleChangeStatus = async (statusId: string) => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('Project')
        .update({ statusId: statusId, updatedAt: new Date().toISOString() })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: "Project status has been updated",
      });

      fetchProject();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleChangeDefaultStatus = async (status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('Project')
        .update({ status: status, updatedAt: new Date().toISOString() })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: "Project status has been updated",
      });

      fetchProject();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
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
          <span className="text-lg">Loading project details...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground">The project you are looking for does not exist.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isManager = userProfile?.role === 'MANAGER' && project.managerId === userProfile.id;
  const isAcceptedFreelancer = userProfile?.role === 'FREELANCER' && hasAcceptedOffer;
  const canEdit = isManager;
  const canChangeStatus = isManager || isAcceptedFreelancer;

  const currentStatus = categoryStatuses.find(s => s.id === project.statusId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Project Details</h1>
            {canEdit && (
              <div className="flex gap-2">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Edit Project</DialogTitle>
                      <DialogDescription>
                        Update project details
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={editFormData.title}
                          onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="briefDetails">Brief Details (Rich Text)</Label>
                        <Textarea
                          id="briefDetails"
                          value={editFormData.briefDetails}
                          onChange={(e) => setEditFormData({ ...editFormData, briefDetails: e.target.value })}
                          rows={5}
                          placeholder="Add detailed project brief..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="budget">Budget</Label>
                          <Input
                            id="budget"
                            type="number"
                            value={editFormData.budget}
                            onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deadline">Deadline</Label>
                          <Input
                            id="deadline"
                            type="date"
                            value={editFormData.deadline}
                            onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="driveLink">Drive Link</Label>
                        <Input
                          id="driveLink"
                          value={editFormData.driveLink}
                          onChange={(e) => setEditFormData({ ...editFormData, driveLink: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateProject} disabled={saving}>
                          {saving ? 'Saving...' : 'Update'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Project</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this project? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteProject} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Project Card */}
          <Card className="bg-gradient-card border-white/10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-2xl">{project.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {currentStatus ? (
                    <Badge style={{ backgroundColor: currentStatus.color + '20', color: currentStatus.color }}>
                      {currentStatus.title}
                    </Badge>
                  ) : (
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  )}
                  {canChangeStatus && categoryStatuses.length > 0 && (
                    <Select value={project.statusId || ''} onValueChange={handleChangeStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryStatuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: status.color }}
                              />
                              {status.title}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {canChangeStatus && categoryStatuses.length === 0 && project.status !== 'OPEN' && (
                    <Select value={project.status} onValueChange={handleChangeDefaultStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN_PROGRESS">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            In Progress
                          </div>
                        </SelectItem>
                        <SelectItem value="COMPLETED">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            Completed
                          </div>
                        </SelectItem>
                        <SelectItem value="CANCELLED">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            Cancelled
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <CardDescription>{project.description}</CardDescription>

                {project.briefDetails && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Project Brief
                    </h4>
                    <div className="whitespace-pre-wrap text-sm">
                      {project.briefDetails}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-muted-foreground">
                    Created {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Details */}
            <CustomerDetails projectId={project.id} canEdit={canEdit} />

            {/* Project Log */}
            <ProjectLog projectId={project.id} />
          </div>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectFinancial projectId={project.id} canEdit={canEdit} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;

