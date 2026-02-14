import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface FieldFormModalProps {
  open: boolean;
  onClose: () => void;
  field?: any;
  sections: any[];
  onSave: (fieldData: any) => Promise<void>;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'password', label: 'Password' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'multi_select', label: 'Multi-Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'boolean', label: 'Boolean (Yes/No)' },
  { value: 'file', label: 'File Upload' },
  { value: 'date', label: 'Date' },
  { value: 'voice', label: 'Voice Recording' },
];

export function FieldFormModal({ open, onClose, field, sections, onSave }: FieldFormModalProps) {
  const [formData, setFormData] = useState({
    section: '',
    sectionLabel: '',
    label: '',
    fieldKey: '',
    fieldType: 'text',
    placeholder: '',
    required: false,
    order: 1,
    visibleTo: ['agent', 'employee'],
    isActive: true,
    isSystemField: false,
    helpText: '',
    options: [] as string[],
  });

  const [optionInput, setOptionInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (field) {
      setFormData({
        section: field.section || '',
        sectionLabel: field.sectionLabel || '',
        label: field.label || '',
        fieldKey: field.fieldKey || '',
        fieldType: field.fieldType || 'text',
        placeholder: field.placeholder || '',
        required: field.required || false,
        order: field.order || 1,
        visibleTo: field.visibleTo || ['agent', 'employee'],
        isActive: field.isActive !== undefined ? field.isActive : true,
        isSystemField: field.isSystemField || false,
        helpText: field.helpText || '',
        options: field.options || [],
      });
    } else {
      // Reset for new field
      setFormData({
        section: sections[0]?.sectionKey || '',
        sectionLabel: sections[0]?.sectionLabel || '',
        label: '',
        fieldKey: '',
        fieldType: 'text',
        placeholder: '',
        required: false,
        order: 1,
        visibleTo: ['agent', 'employee'],
        isActive: true,
        isSystemField: false,
        helpText: '',
        options: [],
      });
    }
  }, [field, sections, open]);

  const handleSectionChange = (sectionKey: string) => {
    const section = sections.find((s) => s.sectionKey === sectionKey);
    setFormData({
      ...formData,
      section: sectionKey,
      sectionLabel: section?.sectionLabel || '',
    });
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setFormData({
        ...formData,
        options: [...formData.options, optionInput.trim()],
      });
      setOptionInput('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label || !formData.fieldKey || !formData.section) {
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving field:', error);
    } finally {
      setSaving(false);
    }
  };

  const needsOptions = ['select', 'multi_select'].includes(formData.fieldType);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{field ? 'Edit Field' : 'Add New Field'}</DialogTitle>
          <DialogDescription>
            {field ? 'Update field configuration' : 'Create a new form field'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section */}
          <div>
            <Label htmlFor="section">Section *</Label>
            <Select
              value={formData.section}
              onValueChange={handleSectionChange}
              disabled={!!field}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section._id} value={section.sectionKey}>
                    {section.sectionLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div>
            <Label htmlFor="label">Field Label *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., Restaurant Name"
              required
            />
          </div>

          {/* Field Key */}
          <div>
            <Label htmlFor="fieldKey">Field Key *</Label>
            <Input
              id="fieldKey"
              value={formData.fieldKey}
              onChange={(e) => setFormData({ ...formData, fieldKey: e.target.value })}
              placeholder="e.g., restaurantName (no spaces)"
              required
              disabled={!!field}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Unique identifier (camelCase, no spaces)
            </p>
          </div>

          {/* Field Type */}
          <div>
            <Label htmlFor="fieldType">Field Type *</Label>
            <Select
              value={formData.fieldType}
              onValueChange={(value) => setFormData({ ...formData, fieldType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Options (for select/multi-select) */}
          {needsOptions && (
            <div>
              <Label>Options</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  placeholder="Add option"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddOption} variant="secondary">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.options.map((option, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {option}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => handleRemoveOption(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder */}
          <div>
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={formData.placeholder}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              placeholder="e.g., Enter restaurant name"
            />
          </div>

          {/* Help Text */}
          <div>
            <Label htmlFor="helpText">Help Text</Label>
            <Textarea
              id="helpText"
              value={formData.helpText}
              onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
              placeholder="Additional help or instructions"
              rows={2}
            />
          </div>

          {/* Order */}
          <div>
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              min="1"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={formData.required}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, required: checked as boolean })
                }
                disabled={formData.isSystemField}
              />
              <Label htmlFor="required" className="cursor-pointer">
                Required field
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (visible in form)
              </Label>
            </div>
          </div>

          {/* Visible To */}
          <div>
            <Label>Visible To</Label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visibleAgent"
                  checked={formData.visibleTo.includes('agent')}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      visibleTo: checked
                        ? [...formData.visibleTo, 'agent']
                        : formData.visibleTo.filter((v) => v !== 'agent'),
                    });
                  }}
                />
                <Label htmlFor="visibleAgent" className="cursor-pointer">
                  Agent
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visibleEmployee"
                  checked={formData.visibleTo.includes('employee')}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      visibleTo: checked
                        ? [...formData.visibleTo, 'employee']
                        : formData.visibleTo.filter((v) => v !== 'employee'),
                    });
                  }}
                />
                <Label htmlFor="visibleEmployee" className="cursor-pointer">
                  Employee
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : field ? 'Update Field' : 'Create Field'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
