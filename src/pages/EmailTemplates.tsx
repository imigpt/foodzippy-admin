import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, FileText } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formVariables, setFormVariables] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEmailTemplates();
      if (res.success) setTemplates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreate = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormSubject('');
    setFormBody('');
    setFormVariables('');
    setIsFormOpen(true);
  };

  const openEdit = (tpl: EmailTemplate) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormSubject(tpl.subject);
    setFormBody(tpl.body);
    setFormVariables(tpl.variables.join(', '));
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formSubject.trim() || !formBody.trim()) {
      toast({ title: 'Error', description: 'Name, subject and body are required', variant: 'destructive' });
      return;
    }

    const variables = formVariables
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      if (editingTemplate) {
        const res = await api.updateEmailTemplate(editingTemplate._id, {
          subject: formSubject,
          body: formBody,
          variables,
        });
        if (res.success) {
          toast({ title: 'Updated', description: 'Template updated successfully' });
          setIsFormOpen(false);
          fetchTemplates();
        }
      } else {
        const res = await api.createEmailTemplate({
          name: formName,
          subject: formSubject,
          body: formBody,
          variables,
        });
        if (res.success) {
          toast({ title: 'Created', description: 'Template created successfully' });
          setIsFormOpen(false);
          fetchTemplates();
        }
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save template', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.deleteEmailTemplate(deleteTarget._id);
      if (res.success) {
        toast({ title: 'Deleted', description: 'Template deleted' });
        setIsDeleteOpen(false);
        fetchTemplates();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const res = await api.seedEmailTemplates();
      if (res.success) {
        toast({ title: 'Done', description: 'Default templates seeded' });
        fetchTemplates();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to seed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500 mt-1">Manage reusable email templates with placeholder variables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" /> Seed Defaults
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Variables</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading...</TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  No templates yet. Click "Seed Defaults" or "New Template" to get started.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((tpl) => (
                <TableRow key={tpl._id}>
                  <TableCell className="font-medium font-mono text-sm">{tpl.name}</TableCell>
                  <TableCell>{tpl.subject}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tpl.variables.map((v) => (
                        <span key={v} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-mono">{v}</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(tpl.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(tpl)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => { setDeleteTarget(tpl); setIsDeleteOpen(true); }}>
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

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tplName">Template Name *</Label>
              <Input
                id="tplName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. delivery_partner_approval"
                disabled={!!editingTemplate}
              />
              {editingTemplate && <p className="text-xs text-gray-400 mt-1">Template name cannot be changed after creation</p>}
            </div>
            <div>
              <Label htmlFor="tplSubject">Subject *</Label>
              <Input id="tplSubject" value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="Email subject line" />
            </div>
            <div>
              <Label htmlFor="tplBody">Body *</Label>
              <Textarea
                id="tplBody"
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                placeholder="Email body with {{placeholders}}..."
              />
            </div>
            <div>
              <Label htmlFor="tplVars">Variables (comma-separated)</Label>
              <Input
                id="tplVars"
                value={formVariables}
                onChange={(e) => setFormVariables(e.target.value)}
                placeholder="{{name}}, {{loginId}}, {{password}}"
              />
              <p className="text-xs text-gray-400 mt-1">List the placeholder variables used in the template body</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
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
