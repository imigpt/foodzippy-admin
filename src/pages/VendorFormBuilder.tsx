import { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, GripVertical, AlertCircle, Store } from 'lucide-react';
import { api, VendorType } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FieldFormModal } from '@/components/FieldFormModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface FormField {
  _id: string;
  section: string;
  sectionLabel: string;
  label: string;
  fieldKey: string;
  fieldType: string;
  options?: string[];
  placeholder: string;
  required: boolean;
  order: number;
  visibleTo: string[];
  isActive: boolean;
  isSystemField: boolean;
  helpText?: string;
  vendorTypes?: string[];
  labelTemplate?: string;
}

interface FormSection {
  _id: string;
  sectionKey: string;
  sectionLabel: string;
  sectionDescription: string;
  order: number;
  stepNumber: number;
  isActive: boolean;
  visibleTo: string[];
  fields: FormField[];
  vendorTypes?: string[];
  labelTemplate?: string;
}

export default function VendorFormBuilder() {
  const [formConfig, setFormConfig] = useState<FormSection[]>([]);
  const [vendorTypes, setVendorTypes] = useState<VendorType[]>([]);
  const [selectedVendorType, setSelectedVendorType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<FormField | null>(null);
  const [activeTab, setActiveTab] = useState('step-1');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadVendorTypes();
  }, []);

  useEffect(() => {
    if (selectedVendorType) {
      loadFormConfig();
    }
  }, [selectedVendorType]);

  const loadVendorTypes = async () => {
    try {
      const response = await api.getVendorTypes(true);
      if (response.success && response.data) {
        setVendorTypes(response.data);
        // Set first vendor type as default
        if (response.data.length > 0) {
          setSelectedVendorType(response.data[0].slug);
        }
      }
    } catch (err: any) {
      console.error('Failed to load vendor types:', err);
      toast.error('Failed to load vendor types');
    }
  };

  const loadFormConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getFormConfig(undefined, selectedVendorType);
      console.log('Form config response:', response);
      if (response.success && response.data) {
        setFormConfig(response.data);
      } else {
        setError('No form configuration found. Please run seed script.');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load form configuration';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Form config error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async () => {
    if (!fieldToDelete) return;

    try {
      await api.deleteFieldConfig(fieldToDelete._id);
      toast.success('Field deleted successfully');
      loadFormConfig();
      setShowDeleteDialog(false);
      setFieldToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete field');
    }
  };

  const handleToggleFieldStatus = async (field: FormField) => {
    try {
      await api.updateFieldConfig(field._id, {
        isActive: !field.isActive,
      });
      toast.success(field.isActive ? 'Field disabled' : 'Field enabled');
      loadFormConfig();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update field');
    }
  };

  const handleToggleRequired = async (field: FormField) => {
    try {
      await api.updateFieldConfig(field._id, {
        required: !field.required,
      });
      toast.success(field.required ? 'Field is now optional' : 'Field is now required');
      loadFormConfig();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update field');
    }
  };

  const handleSaveField = async (fieldData: any) => {
    try {
      if (selectedField) {
        // Update existing field
        await api.updateFieldConfig(selectedField._id, fieldData);
        toast.success('Field updated successfully');
      } else {
        // Create new field
        await api.createFieldConfig(fieldData);
        toast.success('Field created successfully');
      }
      loadFormConfig();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save field');
      throw error;
    }
  };

  const getFieldTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-100 text-blue-800',
      email: 'bg-purple-100 text-purple-800',
      password: 'bg-red-100 text-red-800',
      number: 'bg-green-100 text-green-800',
      textarea: 'bg-yellow-100 text-yellow-800',
      select: 'bg-indigo-100 text-indigo-800',
      multi_select: 'bg-pink-100 text-pink-800',
      boolean: 'bg-cyan-100 text-cyan-800',
      file: 'bg-orange-100 text-orange-800',
      date: 'bg-teal-100 text-teal-800',
      voice: 'bg-violet-100 text-violet-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const step1Sections = formConfig.filter((s) => s.stepNumber === 1);
  const step2Sections = formConfig.filter((s) => s.stepNumber === 2);

  const selectedTypeName = vendorTypes.find(t => t.slug === selectedVendorType)?.name || 'Vendor';

  if (loading && vendorTypes.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-300 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 bg-gray-300 min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">{error}</p>
              <p className="text-sm">Please ensure the backend is running and run:</p>
              <code className="block bg-black/10 p-2 rounded text-xs mt-2">
                cd backend && node seed-form-config.js
              </code>
              <Button onClick={loadFormConfig} className="mt-4" size="sm">
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (formConfig.length === 0) {
    return (
      <div className="container mx-auto py-6 bg-gray-300 min-h-screen">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">No form configuration found</p>
              <p className="text-sm">Run the seed script to populate the initial form configuration:</p>
              <code className="block bg-muted p-2 rounded text-xs mt-2">
                cd backend && node seed-form-config.js
              </code>
              <Button onClick={loadFormConfig} className="mt-4" size="sm">
                Refresh
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendor Form Builder</h1>
          <p className="text-muted-foreground mt-1">
            Manage vendor registration form fields and sections
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Form
          </Button>
          <Button onClick={() => { setSelectedField(null); setShowFieldModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      {/* Vendor Type Selector */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-700">Select Vendor Type:</span>
            </div>
            <Select value={selectedVendorType} onValueChange={setSelectedVendorType}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {vendorTypes.map((type) => (
                  <SelectItem key={type._id} value={type.slug}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 flex-1">
              Preview and edit form fields as they appear for <strong className="text-orange-600">{selectedTypeName}</strong> type.
              Labels like "Restaurant Name" will show as "{selectedTypeName} Name".
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Changes made here will affect the vendor registration form for agents and employees.
          System fields ({selectedTypeName} Name, Image, Address, Location) cannot be deleted.
          <div className="mt-2 text-xs">
            <strong>Total Sections:</strong> {formConfig.length} | 
            <strong> Step 1:</strong> {step1Sections.length} sections | 
            <strong> Step 2:</strong> {step2Sections.length} sections
          </div>
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
      /* Tabs for Steps */
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="step-1">Step 1: {selectedTypeName} Details</TabsTrigger>
          <TabsTrigger value="step-2">Step 2: Review & Follow-up</TabsTrigger>
        </TabsList>

        {/* Step 1 Content */}
        <TabsContent value="step-1" className="space-y-6">
          {step1Sections.map((section) => (
            <Card key={section._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{section.sectionLabel}</CardTitle>
                    <CardDescription>{section.sectionDescription}</CardDescription>
                  </div>
                  <Badge variant={section.isActive ? 'default' : 'secondary'}>
                    {section.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {section.fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No fields in this section
                  </p>
                ) : (
                  <div className="space-y-2">
                    {section.fields.map((field) => (
                      <div
                        key={field._id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          !field.isActive ? 'bg-muted/50' : 'bg-card'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{field.label}</span>
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                              {field.isSystemField && (
                                <Badge variant="secondary" className="text-xs">
                                  System
                                </Badge>
                              )}
                              {!field.isActive && (
                                <Badge variant="outline" className="text-xs">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                                {field.fieldKey}
                              </code>
                              <Badge className={`text-xs ${getFieldTypeColor(field.fieldType)}`}>
                                {field.fieldType}
                              </Badge>
                              <span>·</span>
                              <span>Order: {field.order}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleRequired(field)}
                            disabled={field.isSystemField}
                          >
                            {field.required ? 'Make Optional' : 'Make Required'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleFieldStatus(field)}
                          >
                            {field.isActive ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedField(field);
                              setShowFieldModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setFieldToDelete(field);
                              setShowDeleteDialog(true);
                            }}
                            disabled={field.isSystemField}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Step 2 Content */}
        <TabsContent value="step-2" className="space-y-6">
          {step2Sections.map((section) => (
            <Card key={section._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{section.sectionLabel}</CardTitle>
                    <CardDescription>{section.sectionDescription}</CardDescription>
                  </div>
                  <Badge variant={section.isActive ? 'default' : 'secondary'}>
                    {section.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {section.fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No fields in this section
                  </p>
                ) : (
                  <div className="space-y-2">
                    {section.fields.map((field) => (
                      <div
                        key={field._id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          !field.isActive ? 'bg-muted/50' : 'bg-card'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{field.label}</span>
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                              {!field.isActive && (
                                <Badge variant="outline" className="text-xs">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                                {field.fieldKey}
                              </code>
                              <Badge className={`text-xs ${getFieldTypeColor(field.fieldType)}`}>
                                {field.fieldType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleRequired(field)}
                          >
                            {field.required ? 'Make Optional' : 'Make Required'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedField(field);
                              setShowFieldModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fieldToDelete?.label}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteField} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Field Form Modal */}
      <FieldFormModal
        open={showFieldModal}
        onClose={() => {
          setShowFieldModal(false);
          setSelectedField(null);
        }}
        field={selectedField}
        sections={formConfig}
        onSave={handleSaveField}
      />

      {/* Preview Dialog */}
      <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
        <AlertDialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Form Preview</AlertDialogTitle>
            <AlertDialogDescription>
              This is how agents and employees will see the vendor registration form.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="text-sm font-semibold text-primary">STEP 1: {selectedTypeName.toUpperCase()} DETAILS</div>
            {step1Sections.map((section) => (
              <div key={section._id} className="space-y-3">
                <div className="border-l-4 border-primary pl-3">
                  <h3 className="font-semibold text-lg">{section.sectionLabel}</h3>
                  {section.sectionDescription && (
                    <p className="text-sm text-muted-foreground">{section.sectionDescription}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  {section.fields.filter(f => f.isActive).map((field) => (
                    <div key={field._id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{field.label}</span>
                        {field.required && <span className="text-red-500 text-xs">*</span>}
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {field.fieldType}
                        {field.placeholder && ` - ${field.placeholder}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-sm font-semibold text-secondary mt-8">STEP 2: REVIEW & FOLLOW-UP</div>
            {step2Sections.map((section) => (
              <div key={section._id} className="space-y-3">
                <div className="border-l-4 border-secondary pl-3">
                  <h3 className="font-semibold text-lg">{section.sectionLabel}</h3>
                  {section.sectionDescription && (
                    <p className="text-sm text-muted-foreground">{section.sectionDescription}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  {section.fields.filter(f => f.isActive).map((field) => (
                    <div key={field._id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{field.label}</span>
                        {field.required && <span className="text-red-500 text-xs">*</span>}
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {field.fieldType}
                        {field.placeholder && ` - ${field.placeholder}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
