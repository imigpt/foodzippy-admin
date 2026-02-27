import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Trash2, CheckCircle, XCircle, Truck, Users, Clock, Ban } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

interface DeliveryPartner {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  loginId?: string;
  rejectionReason?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Approved: 'bg-green-100 text-green-800 border-green-300',
  Rejected: 'bg-red-100 text-red-800 border-red-300',
};

export default function DeliveryPartnerRequests() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Dialogs
  const [selected, setSelected] = useState<DeliveryPartner | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Approve form
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryStatus, setRetryStatus] = useState('');

  // Reject form
  const [rejectReason, setRejectReason] = useState('');

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getDeliveryPartners({ page, limit: 20, status: statusFilter, search });
      if (res.success) {
        setPartners(res.data);
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchStats = async () => {
    try {
      const res = await api.getDeliveryPartnerStats();
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Load email template when approve dialog opens
  const openApproveDialog = async (partner: DeliveryPartner) => {
    setSelected(partner);
    setLoginId('');
    setPassword('');
    setIsSubmitting(false);

    // Ping the backend now to wake up Render so it's ready when the user clicks approve
    api.ping().catch(() => {});

    // Try to load the default template
    try {
      const res = await api.getEmailTemplates();
      if (res.success) {
        const tpl = res.data.find((t: any) => t.name === 'delivery_partner_approval');
        if (tpl) {
          setEmailSubject(tpl.subject);
          setEmailBody(tpl.body);
        } else {
          setEmailSubject('Delivery Partner Application Approved');
          setEmailBody(
            `Dear {{name}},\n\nCongratulations! Your application has been approved.\n\nLogin Details:\nID: {{loginId}}\nPassword: {{password}}\n\nPlease keep this information secure.\n\nRegards,\n{{appName}}`
          );
        }
      }
    } catch {
      setEmailSubject('Delivery Partner Application Approved');
      setEmailBody(
        `Dear {{name}},\n\nCongratulations! Your application has been approved.\n\nLogin Details:\nID: {{loginId}}\nPassword: {{password}}\n\nPlease keep this information secure.\n\nRegards,\n{{appName}}`
      );
    }

    setIsApproveOpen(true);
  };

  const handleApprove = async () => {
    if (!selected) return;
    if (!loginId.trim() || !password.trim()) {
      toast({ title: 'Error', description: 'Login ID and password are required', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    setRetryStatus('');

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 6000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 1) {
          setRetryStatus(`Retrying ${attempt}/${MAX_RETRIES}...`);
        }
        const res = await api.approveDeliveryPartner(selected._id, {
          loginId: loginId.trim(),
          password: password.trim(),
          emailSubject,
          emailBody,
        });
        if (res.success) {
          const emailOk = (res as any).emailSent !== false;
          toast({
            title: 'Approved',
            description: emailOk
              ? 'Application approved and credentials sent via email'
              : 'Application approved but email failed — please share credentials manually',
            variant: emailOk ? 'default' : 'destructive',
          });
          setIsApproveOpen(false);
          setRetryStatus('');
          fetchPartners();
          fetchStats();
          setIsSubmitting(false);
          return;
        }
      } catch (err: any) {
        const isNetworkError =
          err.message === 'Failed to fetch' ||
          err.message?.includes('NetworkError') ||
          err.message?.includes('network error');

        if (isNetworkError && attempt < MAX_RETRIES) {
          setRetryStatus(`Server waking up… retrying in ${RETRY_DELAY_MS / 1000}s (${attempt}/${MAX_RETRIES})`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          continue;
        }

        toast({
          title: 'Error',
          description: isNetworkError
            ? 'Cannot reach the server. It may be starting up — please wait 30 seconds and try again.'
            : err.message || 'Failed to approve',
          variant: 'destructive',
        });
        break;
      }
    }

    setRetryStatus('');
    setIsSubmitting(false);
  };

  const openRejectDialog = (partner: DeliveryPartner) => {
    setSelected(partner);
    setRejectReason('');
    setIsRejectOpen(true);
  };

  const handleReject = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const res = await api.rejectDeliveryPartner(selected._id, rejectReason);
      if (res.success) {
        toast({ title: 'Rejected', description: 'Application has been rejected' });
        setIsRejectOpen(false);
        fetchPartners();
        fetchStats();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to reject', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const res = await api.deleteDeliveryPartner(selected._id);
      if (res.success) {
        toast({ title: 'Deleted', description: 'Application deleted' });
        setIsDeleteOpen(false);
        fetchPartners();
        fetchStats();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  // Preview email body with placeholders replaced
  const getPreviewBody = () => {
    if (!selected) return emailBody;
    return emailBody
      .replace(/\{\{name\}\}/g, selected.fullName)
      .replace(/\{\{loginId\}\}/g, loginId || '[Login ID]')
      .replace(/\{\{password\}\}/g, password || '[Password]')
      .replace(/\{\{email\}\}/g, selected.email)
      .replace(/\{\{phone\}\}/g, selected.phone)
      .replace(/\{\{appName\}\}/g, 'Foodzippy');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Partner Requests</h1>
          <p className="text-gray-500 mt-1">Manage delivery partner applications and approvals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold">{stats.approved}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg"><Ban className="h-5 w-5 text-red-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, phone..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell>
              </TableRow>
            ) : partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">No applications found</TableCell>
              </TableRow>
            ) : (
              partners.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-medium">{p.fullName}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(p); setIsViewOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {p.status === 'Pending' && (
                        <>
                          <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => openApproveDialog(p)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => openRejectDialog(p)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => { setSelected(p); setIsDeleteOpen(true); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {/* ── View Dialog ── */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-xs">Full Name</Label>
                  <p className="font-medium">{selected.fullName}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Status</Label>
                  <p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[selected.status]}`}>
                      {selected.status}
                    </span>
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Email</Label>
                  <p className="font-medium">{selected.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Phone</Label>
                  <p className="font-medium">{selected.phone}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500 text-xs">Address</Label>
                  <p className="font-medium">{selected.address}</p>
                </div>
                {selected.loginId && (
                  <div>
                    <Label className="text-gray-500 text-xs">Login ID</Label>
                    <p className="font-medium">{selected.loginId}</p>
                  </div>
                )}
                {selected.rejectionReason && (
                  <div className="col-span-2">
                    <Label className="text-gray-500 text-xs">Rejection Reason</Label>
                    <p className="font-medium text-red-600">{selected.rejectionReason}</p>
                  </div>
                )}
                {selected.approvedBy && (
                  <div>
                    <Label className="text-gray-500 text-xs">Approved By</Label>
                    <p className="font-medium">{selected.approvedBy}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-500 text-xs">Applied On</Label>
                  <p className="font-medium">{new Date(selected.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selected?.status === 'Pending' && (
              <div className="flex gap-2">
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => { setIsViewOpen(false); openApproveDialog(selected!); }}>
                  Approve
                </Button>
                <Button variant="destructive" onClick={() => { setIsViewOpen(false); openRejectDialog(selected!); }}>
                  Reject
                </Button>
              </div>
            )}
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Approve Dialog ── */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve — {selected?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loginId">Login ID *</Label>
                <Input id="loginId" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="e.g. DP001" />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Generate a secure password" />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Truck className="h-4 w-4" /> Approval Email
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Available placeholders: <code className="text-xs bg-gray-100 px-1 rounded">{'{{name}}'}</code>{' '}
                <code className="text-xs bg-gray-100 px-1 rounded">{'{{loginId}}'}</code>{' '}
                <code className="text-xs bg-gray-100 px-1 rounded">{'{{password}}'}</code>{' '}
                <code className="text-xs bg-gray-100 px-1 rounded">{'{{email}}'}</code>{' '}
                <code className="text-xs bg-gray-100 px-1 rounded">{'{{phone}}'}</code>{' '}
                <code className="text-xs bg-gray-100 px-1 rounded">{'{{appName}}'}</code>
              </p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="emailSubject">Email Subject</Label>
                  <Input id="emailSubject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="emailBody">Email Body</Label>
                  <Textarea id="emailBody" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={8} className="font-mono text-sm" />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-2">Email Preview</h3>
              <div className="bg-gray-50 rounded-lg border p-4 text-sm whitespace-pre-wrap">{getPreviewBody()}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isSubmitting}>
              {retryStatus || (isSubmitting ? 'Approving...' : 'Approve & Send Email')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject — {selected?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="rejectReason">Reason (optional)</Label>
            <Textarea id="rejectReason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Provide a reason for rejection..." rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
              {isSubmitting ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the application from <strong>{selected?.fullName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
