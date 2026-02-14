import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Search, Users, Eye, UserCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, normalizeVendors } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Agent {
  _id: string;
  name: string;
  username: string;
  email?: string;
  profileImage?: string;
  isActive: boolean;
  role: 'agent' | 'employee';
  createdAt: string;
}

export default function Agents() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'agent' | 'employee'>('agent');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isVendorsDialogOpen, setIsVendorsDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentVendors, setAgentVendors] = useState<any[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [vendorTab, setVendorTab] = useState<'registered' | 'requests' | 'followups'>('registered');
  const [requestsDateFilter, setRequestsDateFilter] = useState<string>('all');
  const [followUpDateFilter, setFollowUpDateFilter] = useState<string>('all');
  const [vendorStats, setVendorStats] = useState<any>({});
  const [vendorCounts, setVendorCounts] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAgents();
  }, [activeTab]);

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      const response = await api.getUsers(activeTab);
      const loadedAgents = response.users || [];
      setAgents(loadedAgents);
      
      // Load vendor counts for both agents and employees
      loadVendorCounts(loadedAgents);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to load ${activeTab}s`,
        variant: 'destructive',
      });
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVendorCounts = async (agentsList: Agent[]) => {
    const counts: Record<string, number> = {};
    
    // Load vendor counts for each agent in parallel
    await Promise.all(
      agentsList.map(async (agent) => {
        try {
          const response = await api.getVendorsByAgent(agent._id, { 
            status: 'pending', // Only count pending requests
            includeStats: 'true' 
          });
          counts[agent._id] = response.data?.length || 0;
        } catch (error) {
          counts[agent._id] = 0;
        }
      })
    );
    
    setVendorCounts(counts);
  };

  const handleCreateAgent = async () => {
    if (!formData.name || !formData.username || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createUser({
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: activeTab,
      });

      toast({
        title: 'Success',
        description: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} created successfully`,
      });

      closeCreateDialog();
      loadAgents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to create ${activeTab}`,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleEditAgent = async () => {
    if (!selectedAgent || !formData.name || !formData.username) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const updateData: any = {
        name: formData.name,
        username: formData.username,
        isActive: formData.isActive,
      };

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await api.updateUserById(selectedAgent._id, updateData);

      toast({
        title: 'Success',
        description: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} updated successfully`,
      });

      closeEditDialog();
      loadAgents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update agent',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;

    try {
      setIsSubmitting(true);
      await api.deleteUserById(selectedAgent._id);

      toast({
        title: 'Success',
        description: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} deleted successfully`,
      });

      setIsDeleteDialogOpen(false);
      setSelectedAgent(null);
      loadAgents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to delete ${activeTab}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setIsSubmitting(false);
    resetForm();
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setIsSubmitting(false);
    setSelectedAgent(null);
    resetForm();
  };

  const openEditDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      username: agent.username,
      password: '',
      isActive: agent.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDeleteDialogOpen(true);
  };

  const openVendorsDialog = async (agent: Agent) => {
    setSelectedAgent(agent);
    setIsVendorsDialogOpen(true);
    setVendorTab('registered');
    setRequestsDateFilter('all');
    setFollowUpDateFilter('all');
    
    // Load vendors for this agent with statistics
    await loadAgentVendors(agent._id, 'registered', 'all', 'all');
  };

  const loadAgentVendors = async (
    agentId: string, 
    tab: 'registered' | 'requests' | 'followups',
    requestsFilter: string,
    followUpFilter: string
  ) => {
    try {
      setIsLoadingVendors(true);
      
      let queryParams: any = {
        agentId,
        includeStats: 'true',
        limit: 100 // Get more results for better overview
      };

      if (tab === 'registered') {
        // Only approved vendors
        queryParams.status = 'publish';
      } else if (tab === 'requests') {
        // All vendors with optional date filter
        if (requestsFilter !== 'all') {
          queryParams.dateFilter = requestsFilter;
        }
      } else if (tab === 'followups') {
        // Vendors with follow-up dates, with optional date filter
        if (followUpFilter !== 'all') {
          queryParams.followUpFilter = followUpFilter;
        }
      }

      const response = await api.getVendorsByAgent(agentId, queryParams);
      setAgentVendors(normalizeVendors(response.data || []));
      setVendorStats(response.statistics || {});
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load vendors',
        variant: 'destructive',
      });
      setAgentVendors([]);
      setVendorStats({});
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const handleTabChange = (value: string) => {
    const newTab = value as 'registered' | 'requests' | 'followups';
    setVendorTab(newTab);
    if (selectedAgent) {
      loadAgentVendors(selectedAgent._id, newTab, requestsDateFilter, followUpDateFilter);
    }
  };

  const handleRequestsFilterChange = (value: string) => {
    setRequestsDateFilter(value);
    if (selectedAgent) {
      loadAgentVendors(selectedAgent._id, 'requests', value, followUpDateFilter);
    }
  };

  const handleFollowUpFilterChange = (value: string) => {
    setFollowUpDateFilter(value);
    if (selectedAgent) {
      loadAgentVendors(selectedAgent._id, 'followups', requestsDateFilter, value);
    }
  };

  const handleViewVendor = (vendorId: string) => {
    setIsVendorsDialogOpen(false);
    navigate(`/vendor/${vendorId}`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      isActive: true,
    });
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.username.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage agents and employees who handle vendor registrations</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </Button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'agent'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Agents
          </button>
          <button
            onClick={() => setActiveTab('employee')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'employee'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Employees
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="animate-pulse text-muted-foreground">Loading...</div>
                </TableCell>
              </TableRow>
            ) : filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {search ? 'No agents found matching your search' : 'No agents yet. Create your first agent!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent) => (
                <TableRow key={agent._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                        {agent.profileImage ? (
                          <img 
                            src={agent.profileImage} 
                            alt={agent.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                            <UserCircle className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        {agent.email && (
                          <p className="text-xs text-muted-foreground">{agent.email}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{agent.username}</TableCell>
                  <TableCell>
                    <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(agent.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/agent-profile/${agent._id}`)}
                        title="View Profile & Attendance"
                      >
                        <UserCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openVendorsDialog(agent)}
                        title="View Vendors"
                        className="relative"
                      >
                        <Users className="w-4 h-4" />
                        {vendorCounts[agent._id] > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                            {vendorCounts[agent._id]}
                          </span>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(agent)}
                        title="Edit Agent"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(agent)}
                        title="Delete Agent"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => !open && closeCreateDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</DialogTitle>
            <DialogDescription>
              Add a new {activeTab} who can handle vendor registrations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-name"
                placeholder="eg: Mohit Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-username">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-username"
                placeholder="eg: mohit123"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCreateDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateAgent} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</DialogTitle>
            <DialogDescription>
              Update {activeTab} information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="Enter agent name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-username"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">
                Password <span className="text-muted-foreground">(leave blank to keep current)</span>
              </Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Enter new password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-status">Active Status</Label>
              <Switch
                id="edit-status"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleEditAgent} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the agent <strong>{selectedAgent?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Agent Vendors Dialog */}
      <Dialog open={isVendorsDialogOpen} onOpenChange={setIsVendorsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Vendors - {selectedAgent?.name}</DialogTitle>
            <DialogDescription>
              View and manage vendor registrations, requests, and follow-ups
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={vendorTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="registered" className="relative">
                Vendors Registered
                {vendorStats.approved > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {vendorStats.approved}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="requests" className="relative">
                Requests
                {vendorStats.totalRequests > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {vendorStats.totalRequests}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="followups" className="relative">
                Follow-Up Dates
                {vendorStats.totalWithFollowUp > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {vendorStats.totalWithFollowUp}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Registered Vendors Tab */}
            <TabsContent value="registered" className="flex-1 mt-4">
              {isLoadingVendors ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse text-muted-foreground">Loading vendors...</div>
                </div>
              ) : agentVendors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No approved vendors yet
                </div>
              ) : (
                <Table>x
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Date Approved</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.restaurantName}</TableCell>
                        <TableCell>{vendor.city}</TableCell>
                        <TableCell>{vendor.mobileNumber}</TableCell>
                        <TableCell>
                          {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewVendor(vendor.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests" className="flex-1 mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="requests-filter">Filter by Date:</Label>
                  <Select value={requestsDateFilter} onValueChange={handleRequestsFilterChange}>
                    <SelectTrigger id="requests-filter" className="w-[150px]">
                      <SelectValue placeholder="Select filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="daily">Today</SelectItem>
                      <SelectItem value="weekly">This Week</SelectItem>
                      <SelectItem value="monthly">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 ml-auto">
                  <Badge variant="outline" className="bg-yellow-50">
                    Pending: {vendorStats.pending || 0}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50">
                    Approved: {vendorStats.approved || 0}
                  </Badge>
                  <Badge variant="outline" className="bg-red-50">
                    Rejected: {vendorStats.rejected || 0}
                  </Badge>
                </div>
              </div>

              {isLoadingVendors ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse text-muted-foreground">Loading requests...</div>
                </div>
              ) : agentVendors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No vendor requests for selected filter
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.restaurantName}</TableCell>
                        <TableCell>{vendor.city}</TableCell>
                        <TableCell>{vendor.mobileNumber}</TableCell>
                        <TableCell>
                          <StatusBadge status={vendor.restaurantStatus} />
                        </TableCell>
                        <TableCell>
                          {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewVendor(vendor.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Follow-Ups Tab */}
            <TabsContent value="followups" className="flex-1 mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="followup-filter">Filter by Date:</Label>
                  <Select value={followUpDateFilter} onValueChange={handleFollowUpFilterChange}>
                    <SelectTrigger id="followup-filter" className="w-[150px]">
                      <SelectValue placeholder="Select filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Upcoming</SelectItem>
                      <SelectItem value="daily">Today</SelectItem>
                      <SelectItem value="weekly">This Week</SelectItem>
                      <SelectItem value="monthly">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 ml-auto">
                  <Badge variant="outline" className="bg-orange-50">
                    Today: {vendorStats.followUpToday || 0}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50">
                    This Week: {vendorStats.followUpWeek || 0}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50">
                    This Month: {vendorStats.followUpMonth || 0}
                  </Badge>
                </div>
              </div>

              {isLoadingVendors ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse text-muted-foreground">Loading follow-ups...</div>
                </div>
              ) : agentVendors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No follow-ups scheduled for selected filter
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Follow-Up Date</TableHead>
                      <TableHead>Convincing Status</TableHead>
                      <TableHead>Behavior</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentVendors
                      .sort((a, b) => {
                        const dateA = a.review?.followUpDate ? new Date(a.review.followUpDate).getTime() : 0;
                        const dateB = b.review?.followUpDate ? new Date(b.review.followUpDate).getTime() : 0;
                        return dateA - dateB;
                      })
                      .map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">{vendor.restaurantName}</TableCell>
                          <TableCell>{vendor.city}</TableCell>
                          <TableCell className="font-medium">
                            {vendor.review?.followUpDate 
                              ? new Date(vendor.review.followUpDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              vendor.review?.convincingStatus === 'convinced' ? 'default' : 
                              vendor.review?.convincingStatus === 'partially_convinced' ? 'secondary' : 
                              'outline'
                            }>
                              {vendor.review?.convincingStatus || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {vendor.review?.behavior || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewVendor(vendor.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
