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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, DollarSign, Link, Edit, RefreshCw, Trash2, FileText, Clock, User, Building, MessageCircle, Activity, FolderOpen, Settings } from 'lucide-react';
import { format } from 'date-fns';
import CustomerDetails from '@/components/project/CustomerDetails';
import ProjectFinancial from '@/components/project/ProjectFinancial';
import ProjectLog from '@/components/project/ProjectLog';
import { ProjectChat } from '@/components/project/ProjectChat';
import { MainLayout } from '@/components/layout/MainLayout';

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
    <MainLayout userProfile={userProfile}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/projects')} 
                className="gap-2 hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FolderOpen className="w-4 h-4" />
                <span>Project Details</span>
              </div>
            </div>
            
            {canEdit && (
              <div className="flex gap-2">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 hover:bg-primary/10">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Edit className="w-5 h-5" />
                        Edit Project Settings
                      </DialogTitle>
                      <DialogDescription>
                        Update project details and configuration
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Title *
                          </Label>
                          <Input
                            id="title"
                            value={editFormData.title}
                            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                            className="font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Description *
                          </Label>
                          <Textarea
                            id="description"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="briefDetails" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Brief Details
                          </Label>
                          <Textarea
                            id="briefDetails"
                            value={editFormData.briefDetails}
                            onChange={(e) => setEditFormData({ ...editFormData, briefDetails: e.target.value })}
                            rows={5}
                            placeholder="Add detailed project brief..."
                            className="resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="budget" className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Budget
                            </Label>
                            <Input
                              id="budget"
                              type="number"
                              value={editFormData.budget}
                              onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="deadline" className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Deadline
                            </Label>
                            <Input
                              id="deadline"
                              type="date"
                              value={editFormData.deadline}
                              onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="driveLink" className="flex items-center gap-2">
                            <Link className="w-4 h-4" />
                            Resources Link
                          </Label>
                          <Input
                            id="driveLink"
                            value={editFormData.driveLink}
                            onChange={(e) => setEditFormData({ ...editFormData, driveLink: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateProject} disabled={saving} className="gap-2">
                          {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                          {saving ? 'Updating...' : 'Update Project'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="w-5 h-5" />
                        Delete Project
                      </DialogTitle>
                      <DialogDescription className="text-base">
                        Are you sure you want to permanently delete this project? This action cannot be undone and will remove all associated data.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteProject} disabled={deleting} className="gap-2">
                        {deleting && <RefreshCw className="w-4 h-4 animate-spin" />}
                        {deleting ? 'Deleting...' : 'Delete Project'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Project Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Header Card */}
              <Card className="bg-gradient-to-r from-card via-card to-card/80 border-2 border-primary/10 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl lg:text-3xl font-bold tracking-tight">
                          {project.title}
                        </CardTitle>
                        {currentStatus ? (
                          <Badge
                            variant="outline"
                            className="px-3 py-1.5 text-sm font-medium"
                            style={{
                              backgroundColor: currentStatus.color + '15',
                              borderColor: currentStatus.color + '50',
                              color: currentStatus.color
                            }}
                          >
                            {currentStatus.title}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={`px-3 py-1.5 text-sm font-medium ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-base leading-relaxed max-w-2xl">
                        {project.description}
                      </CardDescription>
                    </div>
                    
                    {/* Status Controls */}
                    {canChangeStatus && (
                      <div className="flex flex-col gap-2">
                        {categoryStatuses.length > 0 ? (
                          <Select value={project.statusId || ''} onValueChange={handleChangeStatus}>
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder="Change Status" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryStatuses.map((status) => (
                                <SelectItem key={status.id} value={status.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: status.color }}
                                    />
                                    {status.title}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : project.status !== 'OPEN' && (
                          <Select value={project.status} onValueChange={handleChangeDefaultStatus}>
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder="Change Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IN_PROGRESS">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  In Progress
                                </div>
                              </SelectItem>
                              <SelectItem value="COMPLETED">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                                  Completed
                                </div>
                              </SelectItem>
                              <SelectItem value="CANCELLED">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500" />
                                  Cancelled
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                {/* Project Metrics */}
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {project.budget && (
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-center mb-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                          ${project.budget.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-500 font-medium">Budget</div>
                      </div>
                    )}

                    {project.deadline && (
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-center mb-2">
                          <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                          {format(new Date(project.deadline), 'MMM dd')}
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-500 font-medium">Deadline</div>
                      </div>
                    )}

                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-center mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {format(new Date(project.createdAt), 'MMM dd')}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-500 font-medium">Created</div>
                    </div>

                    {project.driveLink && (
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-center mb-2">
                          <Link className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-sm font-medium">
                          <a
                            href={project.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-700 dark:text-purple-400 hover:underline transition-colors"
                          >
                            View Resources
                          </a>
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-500">External Link</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Project Brief */}
              {project.briefDetails && (
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Project Brief
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                      <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                        {project.briefDetails}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Chat Section */}
              {(isManager || isAcceptedFreelancer) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Project Communication
                  </h3>
                  <ProjectChat projectId={project.id} projectTitle={project.title} />
                </div>
              )}
            </div>

            {/* Right Column - Details & Activity */}
            <div className="space-y-6">
              {/* Customer Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Details
                </h3>
                <CustomerDetails projectId={project.id} canEdit={canEdit} />
              </div>

              {/* Financial Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Overview
                </h3>
                <div className="bg-card rounded-lg border shadow-sm">
                  <ProjectFinancial projectId={project.id} canEdit={canEdit} />
                </div>
              </div>

              {/* Project Activity */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </h3>
                <div className="bg-card rounded-lg border shadow-sm">
                  <ProjectLog projectId={project.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProjectDetails;

