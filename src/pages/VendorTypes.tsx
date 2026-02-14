import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, Store, Coffee, Hotel, Cake, Candy, AlertCircle, Check, X, Utensils, UtensilsCrossed, Beer, Wine, GlassWater, Pizza, IceCream2, Soup, Music, PartyPopper, Drumstick, Leaf, Salad } from 'lucide-react';
import { api, VendorType } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
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

const ICON_OPTIONS = [
  { value: 'store', label: 'Store', icon: Store },
  { value: 'coffee', label: 'Coffee', icon: Coffee },
  { value: 'hotel', label: 'Hotel', icon: Hotel },
  { value: 'cake', label: 'Cake', icon: Cake },
  { value: 'candy', label: 'Candy', icon: Candy },
  { value: 'utensils', label: 'Restaurant', icon: Utensils },
  { value: 'utensilsCrossed', label: 'Fine Dining', icon: UtensilsCrossed },
  { value: 'beer', label: 'Bar/Pub', icon: Beer },
  { value: 'wine', label: 'Wine Bar', icon: Wine },
  { value: 'glassWater', label: 'Beverage', icon: GlassWater },
  { value: 'pizza', label: 'Pizza', icon: Pizza },
  { value: 'iceCream', label: 'Ice Cream', icon: IceCream2 },
  { value: 'soup', label: 'Soup/Noodles', icon: Soup },
  { value: 'music', label: 'Club', icon: Music },
  { value: 'partyPopper', label: 'Event Venue', icon: PartyPopper },
  { value: 'drumstick', label: 'Non-Veg', icon: Drumstick },
  { value: 'leaf', label: 'Veg/Organic', icon: Leaf },
  { value: 'salad', label: 'Healthy Food', icon: Salad },
];

const getIconComponent = (iconName: string) => {
  const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
  return iconOption?.icon || Store;
};

interface VendorTypeFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
}

const initialFormData: VendorTypeFormData = {
  name: '',
  slug: '',
  description: '',
  icon: 'store',
  isActive: true,
};

export default function VendorTypes() {
  const [vendorTypes, setVendorTypes] = useState<VendorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<VendorType | null>(null);
  const [formData, setFormData] = useState<VendorTypeFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVendorTypes();
  }, []);

  const loadVendorTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getVendorTypes();
      if (response.success && response.data) {
        setVendorTypes(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load vendor types');
      toast.error('Failed to load vendor types');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: selectedType ? prev.slug : generateSlug(name),
    }));
  };

  const handleOpenModal = (type?: VendorType) => {
    if (type) {
      setSelectedType(type);
      setFormData({
        name: type.name,
        slug: type.slug,
        description: type.description || '',
        icon: type.icon || 'store',
        isActive: type.isActive,
      });
    } else {
      setSelectedType(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedType(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    try {
      setSaving(true);
      if (selectedType) {
        // Update
        await api.updateVendorType(selectedType._id, formData);
        toast.success('Vendor type updated successfully');
      } else {
        // Create
        await api.createVendorType({
          ...formData,
          order: vendorTypes.length + 1,
        });
        toast.success('Vendor type created successfully');
      }
      handleCloseModal();
      loadVendorTypes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vendor type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedType) return;

    try {
      await api.deleteVendorType(selectedType._id);
      toast.success('Vendor type deleted successfully');
      setShowDeleteDialog(false);
      setSelectedType(null);
      loadVendorTypes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete vendor type');
    }
  };

  const handleToggleActive = async (type: VendorType) => {
    try {
      await api.updateVendorType(type._id, { isActive: !type.isActive });
      toast.success(`Vendor type ${type.isActive ? 'disabled' : 'enabled'}`);
      loadVendorTypes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update vendor type');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-300 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Types</h1>
          <p className="text-gray-500 mt-1">
            Manage vendor categories like Restaurant, Cafe, Hotel, etc.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor Type
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How Vendor Types Work</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Each vendor type represents a business category (Restaurant, Cafe, Hotel, etc.)</li>
                <li>Form labels will dynamically change based on selected type</li>
                <li>Example: "Restaurant Name" becomes "Cafe Name" when Cafe is selected</li>
                <li>Agents/Employees will select a type before filling the vendor form</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendorTypes.map((type) => {
          const IconComponent = getIconComponent(type.icon);
          return (
            <Card 
              key={type._id} 
              className={`relative ${!type.isActive ? 'opacity-60 bg-gray-50' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${type.isActive ? 'bg-red-100' : 'bg-gray-200'}`}>
                      <IconComponent className={`w-6 h-6 ${type.isActive ? 'text-[#E82335]' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">
                        {type.slug}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    className={type.isActive ? 'bg-green-500 hover:bg-green-600 text-white border-transparent' : ''}
                    variant={type.isActive ? 'default' : 'secondary'}
                  >
                    {type.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {type.description && (
                  <p className="text-sm text-gray-600 mb-4">{type.description}</p>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={type.isActive}
                      onCheckedChange={() => handleToggleActive(type)}
                    />
                    <span className="text-xs text-gray-500">
                      {type.isActive ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(type)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setSelectedType(type);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {vendorTypes.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Vendor Types</h3>
          <p className="text-gray-500 mb-4">
            Get started by creating your first vendor type.
          </p>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor Type
          </Button>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedType ? 'Edit Vendor Type' : 'Create Vendor Type'}
            </DialogTitle>
            <DialogDescription>
              {selectedType 
                ? 'Update the vendor type details below.'
                : 'Add a new vendor type for your platform.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Restaurant, Cafe, Hotel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g., restaurant, cafe, hotel"
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                URL-friendly identifier. Used in API calls.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this vendor type"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {saving ? 'Saving...' : selectedType ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedType?.name}"? 
              This action cannot be undone. Existing vendors of this type will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedType(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
