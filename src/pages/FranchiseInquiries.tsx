import { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface FranchiseInquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  status: 'pending' | 'contacted' | 'in-progress' | 'approved' | 'rejected';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  contacted: 'bg-blue-100 text-blue-800 border-blue-300',
  'in-progress': 'bg-purple-100 text-purple-800 border-purple-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

export default function FranchiseInquiries() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [inquiries, setInquiries] = useState<FranchiseInquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<FranchiseInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<FranchiseInquiry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    contacted: 0,
    inProgress: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadInquiries();
  }, []);

  useEffect(() => {
    filterInquiries();
  }, [search, statusFilter, inquiries]);

  const loadInquiries = async () => {
    try {
      setIsLoading(true);
      const response = await api.getFranchiseInquiries();
      const loadedInquiries = response.data || [];
      setInquiries(loadedInquiries);
      calculateStats(loadedInquiries);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load franchise inquiries',
        variant: 'destructive',
      });
      setInquiries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: FranchiseInquiry[]) => {
    const newStats = {
      total: data.length,
      pending: data.filter((i) => i.status === 'pending').length,
      contacted: data.filter((i) => i.status === 'contacted').length,
      inProgress: data.filter((i) => i.status === 'in-progress').length,
      approved: data.filter((i) => i.status === 'approved').length,
      rejected: data.filter((i) => i.status === 'rejected').length,
    };
    setStats(newStats);
  };

  const filterInquiries = () => {
    let filtered = [...inquiries];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(searchLower) ||
          i.email.toLowerCase().includes(searchLower) ||
          i.phone.includes(searchLower)
      );
    }

    setFilteredInquiries(filtered);
  };

  const handleViewInquiry = (inquiry: FranchiseInquiry) => {
    setSelectedInquiry(inquiry);
    setUpdateStatus(inquiry.status);
    setUpdateNotes(inquiry.notes || '');
    setIsViewDialogOpen(true);
  };

  const handleUpdateInquiry = async () => {
    if (!selectedInquiry) return;

    try {
      await api.updateFranchiseInquiry(selectedInquiry._id, {
        status: updateStatus,
        notes: updateNotes,
      });

      toast({
        title: 'Success',
        description: 'Franchise inquiry updated successfully',
      });

      setIsViewDialogOpen(false);
      loadInquiries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update inquiry',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteInquiry = async () => {
    if (!selectedInquiry) return;

    try {
      await api.deleteFranchiseInquiry(selectedInquiry._id);

      toast({
        title: 'Success',
        description: 'Franchise inquiry deleted successfully',
      });

      setIsDeleteDialogOpen(false);
      setSelectedInquiry(null);
      loadInquiries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete inquiry',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Franchise Inquiries</h1>
        <p className="text-gray-500 mt-1">
          Manage and track franchise inquiries from potential partners
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-2 border-gray-200">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border-2 border-yellow-200">
          <div className="text-sm text-yellow-700">Pending</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border-2 border-blue-200">
          <div className="text-sm text-blue-700">Contacted</div>
          <div className="text-2xl font-bold text-blue-900">{stats.contacted}</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4 border-2 border-purple-200">
          <div className="text-sm text-purple-700">In Progress</div>
          <div className="text-2xl font-bold text-purple-900">{stats.inProgress}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border-2 border-green-200">
          <div className="text-sm text-green-700">Approved</div>
          <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 border-2 border-red-200">
          <div className="text-sm text-red-700">Rejected</div>
          <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredInquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No franchise inquiries found
                </TableCell>
              </TableRow>
            ) : (
              filteredInquiries.map((inquiry) => (
                <TableRow key={inquiry._id}>
                  <TableCell className="font-medium">{inquiry.name}</TableCell>
                  <TableCell>{inquiry.email}</TableCell>
                  <TableCell>{inquiry.phone}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[inquiry.status]} border`}>
                      {inquiry.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(inquiry.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInquiry(inquiry)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedInquiry(inquiry);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View/Edit Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Franchise Inquiry Details</DialogTitle>
            <DialogDescription>View and update inquiry information</DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Name</Label>
                  <p className="mt-1 text-gray-900">{selectedInquiry.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="mt-1 text-gray-900">{selectedInquiry.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone</Label>
                  <p className="mt-1 text-gray-900">{selectedInquiry.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Submitted</Label>
                  <p className="mt-1 text-gray-900">{formatDate(selectedInquiry.createdAt)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-md">
                  {selectedInquiry.description}
                </p>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Add notes about this inquiry..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateInquiry}>Update Inquiry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Franchise Inquiry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inquiry from{' '}
              <strong>{selectedInquiry?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInquiry} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
