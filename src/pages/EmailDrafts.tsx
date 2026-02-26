import { useState, useEffect } from 'react';
import { Plus, Send, Pencil, Trash2, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EmailDraft {
  _id: string;
  subject: string;
  body: string;
  createdBy: string;
  lastSentAt: string | null;
  recipientCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Subscriber {
  _id: string;
  email: string;
  status: 'active' | 'inactive';
}

export default function EmailDrafts() {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<EmailDraft | null>(null);

  // Create / Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');

  // Delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Send dialog
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [sendAll, setSendAll] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      setIsLoading(true);
      const res = await api.getEmailDrafts();
      setDrafts(res.data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load drafts', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditMode('create');
    setEditSubject('');
    setEditBody('');
    setSelected(null);
    setIsEditOpen(true);
  };

  const openEdit = (draft: EmailDraft) => {
    setEditMode('edit');
    setEditSubject(draft.subject);
    setEditBody(draft.body);
    setSelected(draft);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!editSubject.trim() || !editBody.trim()) {
      toast({ title: 'Error', description: 'Subject and body are required', variant: 'destructive' });
      return;
    }
    try {
      if (editMode === 'create') {
        await api.createEmailDraft({ subject: editSubject, body: editBody });
        toast({ title: 'Success', description: 'Draft created' });
      } else if (selected) {
        await api.updateEmailDraft(selected._id, { subject: editSubject, body: editBody });
        toast({ title: 'Success', description: 'Draft updated' });
      }
      setIsEditOpen(false);
      loadDrafts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await api.deleteEmailDraft(selected._id);
      toast({ title: 'Success', description: 'Draft deleted' });
      setIsDeleteOpen(false);
      setSelected(null);
      loadDrafts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  const openSend = async (draft: EmailDraft) => {
    setSelected(draft);
    setSendAll(true);
    setSelectedSubIds([]);
    try {
      const res = await api.getSubscribers({ limit: 500, status: 'active' });
      setSubscribers((res.data || []) as Subscriber[]);
    } catch {
      setSubscribers([]);
    }
    setIsSendOpen(true);
  };

  const toggleSubId = (id: string) => {
    setSelectedSubIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    try {
      const ids = sendAll ? undefined : selectedSubIds;
      const res = await api.sendEmailDraft(selected._id, ids);
      toast({ title: 'Success', description: res.message });
      setIsSendOpen(false);
      loadDrafts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Drafts</h1>
          <p className="text-gray-500 mt-1">Create and send emails to subscribers</p>
        </div>
        <Button onClick={openCreate} className="bg-[#E82335] hover:bg-[#c91d2e]">
          <Plus className="w-4 h-4 mr-2" />New Draft
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-[#E82335] font-semibold">Subject</TableHead>
              <TableHead className="text-[#E82335] font-semibold">Created</TableHead>
              <TableHead className="text-[#E82335] font-semibold">Last Sent</TableHead>
              <TableHead className="text-[#E82335] font-semibold">Recipients</TableHead>
              <TableHead className="text-[#E82335] font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">Loading...</TableCell></TableRow>
            ) : drafts.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">No drafts yet. Create one!</TableCell></TableRow>
            ) : (
              drafts.map((d) => (
                <TableRow key={d._id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium">{d.subject}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">{formatDate(d.createdAt)}</TableCell>
                  <TableCell className="text-gray-500">{formatDate(d.lastSentAt)}</TableCell>
                  <TableCell className="text-gray-500">{d.recipientCount || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Send" onClick={() => openSend(d)}>
                        <Send className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(d)}>
                        <Pencil className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Delete" onClick={() => { setSelected(d); setIsDeleteOpen(true); }}>
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

      {/* Create / Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editMode === 'create' ? 'Create Draft' : 'Edit Draft'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} placeholder="Email subject..." />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} placeholder="Write your email content..." rows={8} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#E82335] hover:bg-[#c91d2e]">
              {editMode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "<strong>{selected?.subject}</strong>"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Dialog */}
      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Subject</p>
              <p className="font-medium">{selected?.subject}</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="sendTo" checked={sendAll} onChange={() => setSendAll(true)} className="accent-[#E82335]" />
                <span className="text-sm font-medium">Send to all active subscribers ({subscribers.length})</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="sendTo" checked={!sendAll} onChange={() => setSendAll(false)} className="accent-[#E82335]" />
                <span className="text-sm font-medium">Send to selected subscribers</span>
              </label>
            </div>

            {!sendAll && (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {subscribers.length === 0 ? (
                  <p className="text-center text-gray-400 py-4 text-sm">No active subscribers</p>
                ) : (
                  subscribers.map((sub) => (
                    <label key={sub._id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-0">
                      <input
                        type="checkbox"
                        checked={selectedSubIds.includes(sub._id)}
                        onChange={() => toggleSubId(sub._id)}
                        className="accent-[#E82335]"
                      />
                      <span className="text-sm">{sub.email}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={sending || (!sendAll && selectedSubIds.length === 0)}
              className="bg-[#E82335] hover:bg-[#c91d2e]"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
