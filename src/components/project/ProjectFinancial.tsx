import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Plus, Edit, Trash2 } from 'lucide-react';

interface ProjectFinancialDetail {
  id: string;
  projectId: string;
  description: string;
  percentage: number;
  amount: number | null;
  isPaid: boolean;
  paidAt: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectFinancialProps {
  projectId: string;
  canEdit: boolean;
}

const ProjectFinancial: React.FC<ProjectFinancialProps> = ({ projectId, canEdit }) => {
  const [financialDetails, setFinancialDetails] = useState<ProjectFinancialDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFinancialDetail, setEditingFinancialDetail] = useState<ProjectFinancialDetail | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    percentage: '',
    amount: '',
    dueDate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFinancialDetails();
  }, [projectId]);

  const fetchFinancialDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('ProjectFinancial')
        .select('*')
        .eq('projectId', projectId)
        .order('createdAt', { ascending: true });

      if (error) throw error;
      setFinancialDetails(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading financial details",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.description.trim() || !formData.percentage.trim()) {
      toast({
        title: "Validation Error",
        description: "Description and percentage are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const financialData = {
        projectId: projectId,
        description: formData.description.trim(),
        percentage: Number(formData.percentage),
        amount: formData.amount ? Number(formData.amount) : null,
        dueDate: formData.dueDate || null,
        notes: formData.notes.trim() || null,
      };

      let result;
      if (editingFinancialDetail) {
        // Update existing
        result = await supabase
          .from('ProjectFinancial')
          .update({ ...financialData, updatedAt: new Date().toISOString() })
          .eq('id', editingFinancialDetail.id);
      } else {
        // Create new
        result = await supabase
          .from('ProjectFinancial')
          .insert({ ...financialData, id: crypto.randomUUID() });
      }

      if (result.error) throw result.error;

      toast({
        title: "Financial detail saved",
        description: "Financial detail has been saved successfully",
      });

      setIsDialogOpen(false);
      fetchFinancialDetails();
    } catch (error: any) {
      toast({
        title: "Error saving financial detail",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (detail: ProjectFinancialDetail) => {
    setEditingFinancialDetail(detail);
    setFormData({
      description: detail.description,
      percentage: detail.percentage.toString(),
      amount: detail.amount ? detail.amount.toString() : '',
      dueDate: detail.dueDate || '',
      notes: detail.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (detailId: string) => {
    try {
      const { error } = await supabase
        .from('ProjectFinancial')
        .delete()
        .eq('id', detailId);

      if (error) throw error;

      toast({
        title: "Financial detail deleted",
        description: "Financial detail has been deleted successfully",
      });

      fetchFinancialDetails();
    } catch (error: any) {
      toast({
        title: "Error deleting financial detail",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Financial Overview</h3>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Financial Detail
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingFinancialDetail ? 'Edit Financial Detail' : 'Add Financial Detail'}</DialogTitle>
                <DialogDescription>
                  {editingFinancialDetail
                    ? 'Update the financial detail below'
                    : 'Add a new financial detail to the project'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percentage">Percentage *</Label>
                  <Input
                    id="percentage"
                    type="number"
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about the financial detail"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrUpdate} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Percentage</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {financialDetails.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No financial details added yet.
              </TableCell>
            </TableRow>
          ) : (
            financialDetails.map((detail) => (
              <TableRow key={detail.id}>
                <TableCell>{detail.description}</TableCell>
                <TableCell>{detail.percentage}%</TableCell>
                <TableCell>${detail.amount ? detail.amount.toFixed(2) : 'N/A'}</TableCell>
                <TableCell>{detail.isPaid ? 'Paid' : 'Unpaid'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {canEdit && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(detail)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(detail.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectFinancial;

