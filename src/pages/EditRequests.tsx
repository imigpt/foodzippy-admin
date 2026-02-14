import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Check, X, Eye, Calendar, User } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditRequest {
  _id: string;
  restaurantName: string;
  city: string;
  state: string;
  mobileNumber: string;
  createdById: {
    _id: string;
    name: string;
    username: string;
    email: string;
    role: string;
  };
  createdByName: string;
  editRequestDate: string;
  editRequested: boolean;
  editApproved: boolean;
  restaurantStatus: string;
}

export default function EditRequests() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
    // Mark edit requests as seen when page loads
    api.markEditRequestsAsSeen().catch(console.error);
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPendingEditRequests();
      setRequests(response.vendors || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load edit requests',
        variant: 'destructive',
      });
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openApproveDialog = (request: EditRequest) => {
    setSelectedRequest(request);
    setRemark('');
    setIsApproveDialogOpen(true);
  };

  const openRejectDialog = (request: EditRequest) => {
    setSelectedRequest(request);
    setRemark('');
    setIsRejectDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setIsSubmitting(true);
      await api.approveVendorEdit(selectedRequest._id, remark);

      toast({
        title: 'Success',
        description: 'Edit request approved successfully',
      });

      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      setRemark('');
      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!remark.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.rejectVendorEdit(selectedRequest._id, remark);

      toast({
        title: 'Success',
        description: 'Edit request rejected',
      });

      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setRemark('');
      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      publish: 'bg-green-100 text-green-800 hover:bg-green-100',
      reject: 'bg-red-100 text-red-800 hover:bg-red-100',
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || styles.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-6 lg:p-8  bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileEdit className="w-6 h-6" />
            Vendor Edit Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Approve or reject vendor edit permission requests from agents
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {requests?.length || 0} Pending
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-3xl font-bold mt-2">{requests?.length || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileEdit className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unique Agents</p>
              <p className="text-3xl font-bold mt-2">
                {new Set(requests.map(r => r.createdById?._id).filter(Boolean)).size}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Published Vendors</p>
              <p className="text-3xl font-bold mt-2">
                {requests.filter(r => r.restaurantStatus === 'publish').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Pending Edit Requests</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Current Status</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="animate-pulse text-muted-foreground">Loading...</div>
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FileEdit className="w-12 h-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No pending edit requests</p>
                    <p className="text-sm text-muted-foreground/70">
                      All edit requests have been processed
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell className="font-medium">{request.restaurantName}</TableCell>
                  <TableCell>{request.city}, {request.state}</TableCell>
                  <TableCell>{request.mobileNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {request.createdById?.name || request.createdByName || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.restaurantStatus)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {formatDate(request.editRequestDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/vendor/${request._id}`)}
                        title="View Vendor Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openApproveDialog(request)}
                        title="Approve Edit Request"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRejectDialog(request)}
                        title="Reject Edit Request"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Edit Request</DialogTitle>
            <DialogDescription>
              Grant edit permission for <strong>{selectedRequest?.restaurantName}</strong> to agent{' '}
              <strong>{selectedRequest?.createdById?.name || selectedRequest?.createdByName || 'N/A'}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-remark">Approval Remark (Optional)</Label>
              <Textarea
                id="approve-remark"
                placeholder="Add any notes about this approval..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Approving...' : 'Approve Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Edit Request</DialogTitle>
            <DialogDescription>
              Deny edit permission for <strong>{selectedRequest?.restaurantName}</strong> to agent{' '}
              <strong>{selectedRequest?.createdById?.name || selectedRequest?.createdByName || 'N/A'}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-remark">
                Reason for Rejection <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reject-remark"
                placeholder="Explain why this request is being rejected..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                This reason will be visible to the agent
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
