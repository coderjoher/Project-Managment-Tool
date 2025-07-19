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
import { Plus, Edit, Trash2, Tag, Palette, Eye, EyeOff, Settings } from 'lucide-react';
import CategoryStatuses from './CategoryStatuses';

interface ProjectCategory {
  id: string;
  title: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  color: string;
  managerId: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectCategoriesProps {
  managerId: string;
}

const ProjectCategories: React.FC<ProjectCategoriesProps> = ({ managerId }) => {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: '#3B82F6',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  const [saving, setSaving] = useState(false);
  const [selectedCategoryForStatuses, setSelectedCategoryForStatuses] = useState<ProjectCategory | null>(null);
  const { toast } = useToast();

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  useEffect(() => {
    fetchCategories();
  }, [managerId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('ProjectCategory')
        .select('*')
        .eq('managerId', managerId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading categories",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Category title is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const categoryData = {
        id: crypto.randomUUID(),
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        status: formData.status,
        managerId: managerId
      };

      const { error } = await supabase
        .from('ProjectCategory')
        .insert(categoryData);

      if (error) throw error;

      toast({
        title: "Category created",
        description: "Project category has been created successfully",
      });

      setFormData({ title: '', description: '', color: '#3B82F6', status: 'ACTIVE' });
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error creating category",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Category title is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('ProjectCategory')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
          status: formData.status,
          updatedAt: new Date().toISOString()
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast({
        title: "Category updated",
        description: "Project category has been updated successfully",
      });

      setEditingCategory(null);
      setFormData({ title: '', description: '', color: '#3B82F6', status: 'ACTIVE' });
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error updating category",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('ProjectCategory')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Category deleted",
        description: "Project category has been deleted successfully",
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category: ProjectCategory) => {
    setEditingCategory(category);
    setFormData({
      title: category.title,
      description: category.description || '',
      color: category.color,
      status: category.status
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({ title: '', description: '', color: '#3B82F6', status: 'ACTIVE' });
  };

  const toggleCategoryStatus = async (category: ProjectCategory) => {
    try {
      const newStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const { error } = await supabase
        .from('ProjectCategory')
        .update({ 
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: "Category updated",
        description: `Category has been ${newStatus.toLowerCase()}`,
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error updating category",
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
          <span>Loading categories...</span>
        </div>
      </div>
    );
  }

  if (selectedCategoryForStatuses) {
    return (
      <CategoryStatuses 
        categoryId={selectedCategoryForStatuses.id}
        categoryTitle={selectedCategoryForStatuses.title}
        onClose={() => setSelectedCategoryForStatuses(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Categories</h2>
          <p className="text-muted-foreground">
            Organize your projects with custom categories
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? 'Update the category details below'
                  : 'Add a new category to organize your projects'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Category Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter category title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Category Color</Label>
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
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'ACTIVE' | 'INACTIVE' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Tag className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first project category to start organizing your projects
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                  <Badge variant={category.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {category.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {category.description && (
                  <CardDescription className="mb-4">
                    {category.description}
                  </CardDescription>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCategoryForStatuses(category)}
                      title="Manage Statuses"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategoryStatus(category)}
                    >
                      {category.status === 'ACTIVE' ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
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

export default ProjectCategories;
