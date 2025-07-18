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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, DollarSign, TrendingUp, Upload, FileText, Plus, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface Financial {
  id: string;
  projectId: string;
  estimatedBudget: number | null;
  acceptedPrice: number;
  amountPaid: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  createdAt: string;
  updatedAt: string;
  Project: {
    title: string;
    managerId: string;
  };
}

interface FinancialUpdate {
  id: string;
  financialId: string;
  amount: number | null;
  description: string;
  createdAt: string;
  User: {
    name: string | null;
    email: string;
  };
}

interface UserProfile {
  role: 'MANAGER' | 'FREELANCER';
}

const Finances = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [selectedFinancial, setSelectedFinancial] = useState<Financial | null>(null);
  const [updates, setUpdates] = useState<FinancialUpdate[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
    fetchFinancials();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedFinancial) {
      fetchUpdates(selectedFinancial.id);
    }
  }, [selectedFinancial]);

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

  const fetchFinancials = async () => {
    if (!user) return;
    
    try {
      let query = supabase.from('Financial').select(`
        *,
        Project!inner(title, managerId)
      `);

      // Filter based on user role
      const { data: profile } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'MANAGER') {
        query = query.eq('Project.managerId', user.id);
      } else {
        // For freelancers, we need to find financials for projects they have accepted offers on
        // This is a simplified version - in reality you'd join through offers
        query = query.limit(0); // Hide for now until proper relationship is established
      }

      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) throw error;
      setFinancials(data || []);
      
      if (data && data.length > 0) {
        setSelectedFinancial(data[0]);
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

  const fetchUpdates = async (financialId: string) => {
    try {
      const { data, error } = await supabase
        .from('FinancialUpdate')
        .select(`
          *,
          User(name, email)
        `)
        .eq('financialId', financialId)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      setUpdates(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading updates",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinancial || !user || userProfile?.role !== 'MANAGER') return;

    try {
      const updateId = crypto.randomUUID();
      
      const updateData = {
        id: updateId,
        financialId: selectedFinancial.id,
        amount: updateForm.amount ? parseFloat(updateForm.amount) : null,
        description: updateForm.description,
        updatedById: user.id
      };

      const { error } = await supabase
        .from('FinancialUpdate')
        .insert(updateData);

      if (error) throw error;

      // Update the financial record if amount was provided
      if (updateForm.amount) {
        const newAmountPaid = selectedFinancial.amountPaid + parseFloat(updateForm.amount);
        const newStatus = newAmountPaid >= selectedFinancial.acceptedPrice ? 'PAID' : 'PARTIAL';

        await supabase
          .from('Financial')
          .update({ 
            amountPaid: newAmountPaid,
            paymentStatus: newStatus,
            updatedAt: new Date().toISOString()
          })
          .eq('id', selectedFinancial.id);
      }

      toast({
        title: "Update added successfully",
        description: "Financial record has been updated",
      });

      setIsUpdateDialogOpen(false);
      setUpdateForm({ amount: '', description: '' });
      fetchFinancials();
      fetchUpdates(selectedFinancial.id);
    } catch (error: any) {
      toast({
        title: "Error adding update",
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-lg">Loading finances...</span>
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
              <h1 className="text-3xl font-bold">Finances</h1>
              <p className="text-muted-foreground">
                {isManager ? 'Track payments and budgets' : 'View earnings and invoices'}
              </p>
            </div>
          </div>
        </div>

        {financials.length === 0 ? (
          <Card className="bg-gradient-card border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <DollarSign className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No financial records found</h3>
              <p className="text-muted-foreground text-center mb-6">
                {isManager 
                  ? "Financial records will appear here when you accept offers from freelancers."
                  : "Your earnings and payment information will appear here when projects are active."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Records List */}
            <Card className="bg-gradient-card border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {financials.map((financial) => (
                    <div
                      key={financial.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedFinancial?.id === financial.id 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted/20'
                      }`}
                      onClick={() => setSelectedFinancial(financial)}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {financial.Project.title}
                        </h4>
                        <Badge className={getStatusColor(financial.paymentStatus)}>
                          {financial.paymentStatus}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Paid: ${financial.amountPaid}</span>
                          <span>Total: ${financial.acceptedPrice}</span>
                        </div>
                        <Progress 
                          value={(financial.amountPaid / financial.acceptedPrice) * 100} 
                          className="mt-1 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card className="lg:col-span-2 bg-gradient-card border-white/10">
              {selectedFinancial ? (
                <>
                  <CardHeader className="border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedFinancial.Project.title}</CardTitle>
                        <CardDescription>
                          Financial overview and payment tracking
                        </CardDescription>
                      </div>
                      {isManager && (
                        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Update
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Payment Update</DialogTitle>
                              <DialogDescription>
                                Record a payment or add a note about the financial status.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddUpdate}>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="amount">Payment Amount (Optional)</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    value={updateForm.amount}
                                    onChange={(e) => setUpdateForm(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="description">Description *</Label>
                                  <Textarea
                                    id="description"
                                    value={updateForm.description}
                                    onChange={(e) => setUpdateForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe the payment or update"
                                    required
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit">Add Update</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-muted/10">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Total Value</p>
                              <p className="text-xl font-bold">${selectedFinancial.acceptedPrice.toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/10">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Paid</p>
                              <p className="text-xl font-bold">${selectedFinancial.amountPaid.toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/10">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-orange-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Remaining</p>
                              <p className="text-xl font-bold">
                                ${(selectedFinancial.acceptedPrice - selectedFinancial.amountPaid).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Payment Progress</span>
                        <span>{Math.round((selectedFinancial.amountPaid / selectedFinancial.acceptedPrice) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(selectedFinancial.amountPaid / selectedFinancial.acceptedPrice) * 100} 
                        className="h-3"
                      />
                    </div>

                    {/* Payment Updates */}
                    <div>
                      <h3 className="font-semibold mb-4">Payment History</h3>
                      {updates.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No payment updates yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {updates.map((update) => (
                            <Card key={update.id} className="bg-muted/10">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm">{update.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-muted-foreground">
                                        By {update.User.name || update.User.email}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(update.createdAt), 'MMM dd, yyyy HH:mm')}
                                      </span>
                                    </div>
                                  </div>
                                  {update.amount && (
                                    <Badge variant="outline" className="text-green-600">
                                      +${update.amount.toLocaleString()}
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Select a project</h3>
                    <p className="text-muted-foreground">
                      Choose a project from the left to view financial details.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finances;