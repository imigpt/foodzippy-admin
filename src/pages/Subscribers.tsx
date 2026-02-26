import { useState, useEffect } from 'react';
import { Search, Trash2, Download, ToggleLeft, ToggleRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Subscriber {
  _id: string;
  email: string;
  status: 'active' | 'inactive';
  source: string;
  createdAt: string;
}

export default function Subscribers() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Subscriber | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    try {
      setIsLoading(true);
      const [subRes, statsRes] = await Promise.all([
        api.getSubscribers({ limit: 200 }),
        api.getSubscriberStats(),
      ]);
      setSubscribers((subRes.data || []) as Subscriber[]);
      if (statsRes.success) setStats(statsRes.data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to fetch subscribers', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = subscribers.filter((s) => {
    const matchSearch = !search || s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleStatus = async (sub: Subscriber) => {
    const newStatus = sub.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateSubscriber(sub._id, { status: newStatus });
      toast({ title: 'Success', description: `Subscriber marked ${newStatus}` });
      loadSubscribers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await api.deleteSubscriber(selected._id);
      toast({ title: 'Success', description: 'Subscriber deleted' });
      setIsDeleteOpen(false);
      setSelected(null);
      loadSubscribers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await api.exportSubscribers();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subscribers.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Success', description: 'CSV exported' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Export failed', variant: 'destructive' });
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscribers</h1>
        <p className="text-gray-500 mt-1">Manage email subscribers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-gray-50 border-gray-200 text-gray-900' },
          { label: 'Active', value: stats.active, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Inactive', value: stats.inactive, color: 'bg-red-50 border-red-200 text-red-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.color}`}>
            <p className="text-sm font-medium opacity-70">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search by email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-[#E82335] font-semibold">Email</TableHead>
              <TableHead className="text-[#E82335] font-semibold">Status</TableHead>
              <TableHead className="text-[#E82335] font-semibold">Source</TableHead>
              <TableHead className="text-[#E82335] font-semibold">Subscribed On</TableHead>
              <TableHead className="text-[#E82335] font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">No subscribers found</TableCell></TableRow>
            ) : (
              filtered.map((sub) => (
                <TableRow key={sub._id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{sub.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${sub.status === 'active' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                      {sub.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500">{sub.source}</TableCell>
                  <TableCell className="text-gray-500">{formatDate(sub.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => toggleStatus(sub)} title={sub.status === 'active' ? 'Deactivate' : 'Activate'}>
                        {sub.status === 'active' ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(sub); setIsDeleteOpen(true); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirm */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscriber</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selected?.email}</strong>? This cannot be undone.
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
