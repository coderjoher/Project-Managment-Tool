import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Settings, GripVertical } from 'lucide-react';

interface CategoryStatus {
  id: string;
  title: string;
  description: string | null;
  color: string;
  order: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryStatusesProps {
  categoryId: string;
  categoryTitle: string;
  onClose: () => void;
}

const CategoryStatuses: React.FC<CategoryStatusesProps> = ({ categoryId, categoryTitle, onClose }) => {
  const [statuses, setStatuses] = useState<CategoryStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<CategoryStatus | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: '#3B82F6',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const defaultStatuses = [
    { title: 'Not Started', description: 'Project has not begun', color: '#6B7280' },
    { title: 'In Progress', description: 'Project is being worked on', color: '#3B82F6' },
    { title: 'Under Review', description: 'Project is being reviewed', color: '#F59E0B' },
    { title: 'Completed', description: 'Project is complete', color: '#10B981' },
  ];

  useEffect(() => {
    fetchStatuses();
  }, [categoryId]);

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('CategoryStatus')
        .select('*')
        .eq('categoryId', categoryId)
        .order('order', { ascending: true });

      if (error) throw error;
      setStatuses(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading statuses",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStatus = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Status title is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const statusData = {
        id: crypto.randomUUID(),
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        categoryId: categoryId,
        order: statuses.length, // Add at the end
      };

      const { error } = await supabase
        .from('CategoryStatus')
        .insert(statusData);

      if (error) throw error;

      toast({
        title: "Status created",
        description: "Category status has been created successfully",
      });

      setFormData({ title: '', description: '', color: '#3B82F6' });
      setIsDialogOpen(false);
      fetchStatuses();
    } catch (error: any) {
      toast({
        title: "Error creating status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingStatus || !formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Status title is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('CategoryStatus')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
          updatedAt: new Date().toISOString()
        })
        .eq('id', editingStatus.id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: "Category status has been updated successfully",
      });

      setEditingStatus(null);
      setFormData({ title: '', description: '', color: '#3B82F6' });
      setIsDialogOpen(false);
      fetchStatuses();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    try {
      const { error } = await supabase
        .from('CategoryStatus')
        .delete()
        .eq('id', statusId);

      if (error) throw error;

      toast({
        title: "Status deleted",
        description: "Category status has been deleted successfully",
      });

      fetchStatuses();
    } catch (error: any) {
      toast({
        title: "Error deleting status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditStatus = (status: CategoryStatus) => {
    setEditingStatus(status);
    setFormData({
      title: status.title,
      description: status.description || '',
      color: status.color,
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingStatus(null);
    setFormData({ title: '', description: '', color: '#3B82F6' });
  };

  const handleCreateDefaultStatuses = async () => {
    try {
      const statusesData = defaultStatuses.map((status, index) => ({
        id: crypto.randomUUID(),
        title: status.title,
        description: status.description,
        color: status.color,
        categoryId: categoryId,
        order: index,
      }));

      const { error } = await supabase
        .from('CategoryStatus')
        .insert(statusesData);

      if (error) throw error;

      toast({
        title: "Default statuses created",
        description: "Default statuses have been added to this category",
      });

      fetchStatuses();
    } catch (error: any) {
      toast({
        title: "Error creating default statuses",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span>Loading statuses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Manage Statuses</h3>
          <p className="text-sm text-muted-foreground">
            Customize statuses for "{categoryTitle}" category
          </p>
        </div>
        <div className="flex gap-2">
          {statuses.length === 0 && (
            <Button variant="outline" onClick={handleCreateDefaultStatuses}>
              <Settings className="w-4 h-4 mr-2" />
              Add Default Statuses
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStatus ? 'Edit Status' : 'Create New Status'}
                </DialogTitle>
                <DialogDescription>
                  {editingStatus 
                    ? 'Update the status details below'
                    : 'Add a new status to this category'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status-title">Status Title</Label>
                  <Input
                    id="status-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter status title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-description">Description (Optional)</Label>
                  <Textarea
                    id="status-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter status description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-color">Status Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: formData.color }}
                    />
                    <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedColors.map((color) => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              {color}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingStatus ? handleUpdateStatus : handleCreateStatus}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingStatus ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={onClose}>
            Back to Categories
          </Button>
        </div>
      </div>

      {statuses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Settings className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No statuses yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create custom statuses for this category to track project progress
            </p>
            <div className="flex gap-2">
              <Button onClick={handleCreateDefaultStatuses}>
                <Settings className="w-4 h-4 mr-2" />
                Add Default Statuses
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Status
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statuses.map((status) => (
            <Card key={status.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <CardTitle className="text-lg">{status.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {status.description && (
                  <CardDescription className="mb-4">
                    {status.description}
                  </CardDescription>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditStatus(status)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStatus(status.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryStatuses;
