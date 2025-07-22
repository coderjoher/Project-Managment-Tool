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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, FileText, DollarSign, Clock, Plus, CheckCircle, XCircle, Grid, List, Download, Filter, Search, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';

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
  
  // View and filter states
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'deliveryTime'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
      // First, get the offer and project details
      const { data: offer, error: offerError } = await supabase
        .from('Offer')
        .select(`
          projectId,
          price,
          Project!inner(budget)
        `)
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;

      // Update the offer status
      const { error: updateOfferError } = await supabase
        .from('Offer')
        .update({ status })
        .eq('id', offerId);

      if (updateOfferError) throw updateOfferError;

      // If the offer is accepted, update project status and create financial record
      if (status === 'ACCEPTED') {
        // Update the project status to IN_PROGRESS
        const { error: updateProjectError } = await supabase
          .from('Project')
          .update({
            status: 'IN_PROGRESS',
            updatedAt: new Date().toISOString()
          })
          .eq('id', offer.projectId);

        if (updateProjectError) throw updateProjectError;

        // Create a financial record for the accepted offer
        const financialId = crypto.randomUUID();
        const currentTime = new Date().toISOString();

        const { error: createFinancialError } = await supabase
          .from('Financial')
          .insert({
            id: financialId,
            projectId: offer.projectId,
            acceptedPrice: offer.price,
            estimatedBudget: offer.Project?.budget || null,
            amountPaid: 0,
            paymentStatus: 'PENDING',
            createdAt: currentTime,
            updatedAt: currentTime
          });

        if (createFinancialError) throw createFinancialError;
      }

      toast({
        title: `Offer ${status.toLowerCase()}`,
        description: status === 'ACCEPTED'
          ? `The offer has been accepted and the project is now in progress`
          : `The offer has been ${status.toLowerCase()}`,
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

  // Filter and sort offers
  const filteredAndSortedOffers = useMemo(() => {
    let filtered = offers.filter(offer => {
      const matchesSearch = searchTerm === '' || 
        offer.Project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (offer.User?.name && offer.User.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (offer.User?.email && offer.User.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'ALL' || offer.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort offers
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'deliveryTime':
          aValue = a.deliveryTime;
          bValue = b.deliveryTime;
          break;
        default: // createdAt
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [offers, searchTerm, statusFilter, sortBy, sortOrder]);

  // Export functionality
  const handleExport = () => {
    const csvData = filteredAndSortedOffers.map(offer => ({
      'Project Title': offer.Project.title,
      'Price': `$${offer.price.toLocaleString()}`,
      'Delivery Time': `${offer.deliveryTime} days`,
      'Status': offer.status,
      'Freelancer': offer.User?.name || offer.User?.email || 'N/A',
      'Description': offer.description || 'N/A',
      'Submitted Date': format(new Date(offer.createdAt), 'MMM dd, yyyy')
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `offers-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export completed",
      description: `Exported ${filteredAndSortedOffers.length} offers to CSV`,
    });
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
    <MainLayout userProfile={userProfile}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            
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
          <>
            {/* Filter and View Controls */}
            <Card className="mb-6 bg-gradient-to-r from-card via-card to-card/80 border border-primary/10">
              <CardHeader className="pb-4">
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filters</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-sm text-muted-foreground">
                      {filteredAndSortedOffers.length} of {offers.length} offers
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Export Button */}
                    <Button variant="outline" onClick={handleExport} className="gap-2">
                      <Download className="w-4 h-4" />
                      Export CSV
                    </Button>
                    
                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                      <Button
                        variant={viewMode === 'cards' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('cards')}
                        className="gap-2"
                      >
                        <Grid className="w-4 h-4" />
                        Cards
                      </Button>
                      <Button
                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className="gap-2"
                      >
                        <List className="w-4 h-4" />
                        Table
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search offers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Sort By */}
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date Submitted</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="deliveryTime">Delivery Time</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Sort Order */}
                  <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Content Area */}
            {viewMode === 'cards' ? (
              /* Cards View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedOffers.map((offer) => (
                  <Card key={offer.id} className="bg-gradient-card border-white/10 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">{offer.Project.title}</CardTitle>
                        <Badge className={getStatusColor(offer.status)}>
                          {offer.status}
                        </Badge>
                      </div>
                      {!isFreelancer && offer.User && (
                        <CardDescription className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          By: {offer.User.name || offer.User.email}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-600">${offer.price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-600">{offer.deliveryTime} day{offer.deliveryTime !== 1 ? 's' : ''}</span>
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
                              className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                              onClick={() => handleUpdateOfferStatus(offer.id, 'ACCEPTED')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => handleUpdateOfferStatus(offer.id, 'REJECTED')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}

                        <div className="pt-2 border-t border-border/50">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(offer.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* Table View */
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Project</TableHead>
                        {!isFreelancer && <TableHead className="font-semibold">Freelancer</TableHead>}
                        <TableHead className="font-semibold">Price</TableHead>
                        <TableHead className="font-semibold">Delivery</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Submitted</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        {!isFreelancer && <TableHead className="font-semibold text-center">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedOffers.map((offer) => (
                        <TableRow key={offer.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium max-w-[200px]">
                            <div className="line-clamp-2">{offer.Project.title}</div>
                          </TableCell>
                          {!isFreelancer && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {offer.User?.name || offer.User?.email || 'N/A'}
                                </span>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-1 text-green-600 font-medium">
                              <DollarSign className="w-4 h-4" />
                              ${offer.price.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-blue-600">
                              <Clock className="w-4 h-4" />
                              {offer.deliveryTime} day{offer.deliveryTime !== 1 ? 's' : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(offer.status)}>
                              {offer.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(offer.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[250px]">
                            <div className="line-clamp-2 text-sm text-muted-foreground">
                              {offer.description || 'No description'}
                            </div>
                          </TableCell>
                          {!isFreelancer && (
                            <TableCell>
                              {offer.status === 'PENDING' ? (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 border-green-200 text-green-700 hover:bg-green-50"
                                    onClick={() => handleUpdateOfferStatus(offer.id, 'ACCEPTED')}
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 border-red-200 text-red-700 hover:bg-red-50"
                                    onClick={() => handleUpdateOfferStatus(offer.id, 'REJECTED')}
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">No actions</span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Offers;