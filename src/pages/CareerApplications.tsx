import { useState, useEffect } from 'react';
import { Search, Eye, Trash2 } from 'lucide-react';
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

interface CareerApplication {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  city: string;
  message: string;
  resumeUrl: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<CareerApplication['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  reviewing: 'bg-blue-100 text-blue-800 border-blue-300',
  shortlisted: 'bg-purple-100 text-purple-800 border-purple-300',
  hired: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

export default function CareerApplications() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [filtered, setFiltered] = useState<CareerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<CareerApplication | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    shortlisted: 0,
    hired: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [search, statusFilter, applications]);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const response = await api.getCareerApplications();
      const data: CareerApplication[] = (response.data || []) as CareerApplication[];
      setApplications(data);
      calculateStats(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load career applications',
        variant: 'destructive',
      });
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: CareerApplication[]) => {
    setStats({
      total: data.length,
      pending: data.filter((a) => a.status === 'pending').length,
      reviewing: data.filter((a) => a.status === 'reviewing').length,
      shortlisted: data.filter((a) => a.status === 'shortlisted').length,
      hired: data.filter((a) => a.status === 'hired').length,
      rejected: data.filter((a) => a.status === 'rejected').length,
    });
  };

  const filterApplications = () => {
    let result = [...applications];
    if (statusFilter !== 'all') result = result.filter((a) => a.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.phone.includes(q) ||
          a.position.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  };

  const handleView = (app: CareerApplication) => {
    setSelected(app);
    setUpdateStatus(app.status);
    setUpdateNotes(app.notes || '');
    setIsViewOpen(true);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      await api.updateCareerApplication(selected._id, {
        status: updateStatus,
        notes: updateNotes,
      });
      toast({ title: 'Success', description: 'Application updated successfully' });
      setIsViewOpen(false);
      loadApplications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update application',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await api.deleteCareerApplication(selected._id);
      toast({ title: 'Success', description: 'Application deleted successfully' });
      setIsDeleteOpen(false);
      setSelected(null);
      loadApplications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete application',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Career Applications</h1>
        <p className="text-gray-500 mt-1">Manage job applications submitted through the careers page</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-2 border-gray-200">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border-2 border-yellow-200">
          <div className="text-sm text-yellow-700">Pending</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border-2 border-blue-200">
          <div className="text-sm text-blue-700">Reviewing</div>
          <div className="text-2xl font-bold text-blue-900">{stats.reviewing}</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4 border-2 border-purple-200">
          <div className="text-sm text-purple-700">Shortlisted</div>
          <div className="text-2xl font-bold text-purple-900">{stats.shortlisted}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border-2 border-green-200">
          <div className="text-sm text-green-700">Hired</div>
          <div className="text-2xl font-bold text-green-900">{stats.hired}</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 border-2 border-red-200">
          <div className="text-sm text-red-700">Rejected</div>
          <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, phone, position or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow border">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No career applications found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((app) => (
                <TableRow key={app._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{app.fullName}</p>
                      <p className="text-sm text-gray-500">{app.email}</p>
                      <p className="text-sm text-gray-500">{app.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{app.position}</TableCell>
                  <TableCell>{app.city}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        statusColors[app.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(app.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(app)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => { setSelected(app); setIsDeleteOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* View / Update Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Full Name</Label>
                  <p className="font-medium">{selected.fullName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Position</Label>
                  <p className="font-medium">{selected.position}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">{selected.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <p className="font-medium">{selected.phone}</p>
                </div>
                <div>
                  <Label className="text-gray-500">City</Label>
                  <p className="font-medium">{selected.city}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Applied On</Label>
                  <p className="font-medium">{formatDate(selected.createdAt)}</p>
                </div>
              </div>
              {selected.message && (
                <div>
                  <Label className="text-gray-500">Message</Label>
                  <p className="mt-1 text-sm bg-gray-50 rounded-lg p-3">{selected.message}</p>
                </div>
              )}
              {selected.resumeUrl && (
                <div>
                  <Label className="text-gray-500">Resume</Label>
                  <a
                    href={selected.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1 text-blue-600 hover:underline text-sm"
                  >
                    View / Download Resume
                  </a>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="statusSelect">Update Status</Label>
                  <Select value={updateStatus} onValueChange={setUpdateStatus}>
                    <SelectTrigger id="statusSelect" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="notesField">Internal Notes</Label>
                <Textarea
                  id="notesField"
                  className="mt-1"
                  rows={3}
                  placeholder="Add internal notes about this applicant..."
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the application from{' '}
              <strong>{selected?.fullName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
