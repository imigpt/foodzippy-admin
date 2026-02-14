import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { api, normalizeVendor } from '@/lib/api';
import MapPreview from '@/components/MapPreview';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function VendorEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [vendor, setVendor] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get vendor type name with proper capitalization
  const getVendorTypeName = () => {
    if (!vendor?.vendorType) return 'Restaurant';
    return vendor.vendorType.charAt(0).toUpperCase() + vendor.vendorType.slice(1);
  };

  const vendorTypeName = vendor ? getVendorTypeName() : 'Restaurant';

  useEffect(() => {
    if (id) {
      loadVendor();
    }
  }, [id]);

  const loadVendor = async () => {
    try {
      setIsLoading(true);
      const response = await api.getVendorById(id!);
      setVendor(normalizeVendor(response.data));
    } catch (error) {
      console.error('Failed to load vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendor details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vendor not found</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const updateField = (field: string, value: any) => {
    setVendor((prev: any) => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.updateVendor(id!, vendor);
      toast({
        title: 'Changes saved',
        description: 'Vendor information has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsSaving(true);
      await api.updateVendor(id!, { restaurantStatus: 'publish' });
      toast({
        title: 'Vendor approved',
        description: 'The vendor has been published successfully.',
      });
      navigate('/vendor-requests');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve vendor',
        variant: 'destructive',
      });
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSaving(true);
      await api.updateVendor(id!, { restaurantStatus: 'reject' });
      toast({
        title: 'Vendor rejected',
        description: 'The vendor request has been rejected.',
        variant: 'destructive',
      });
      navigate('/vendor-requests');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject vendor',
        variant: 'destructive',
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Edit Vendor</h1>
          <p className="text-muted-foreground">{vendor.restaurantName}</p>
        </div>
        <div className="flex items-center gap-2">
          {vendor.restaurantStatus === 'pending' && (
            <>
              <Button variant="outline" onClick={handleReject} className="gap-2 text-destructive hover:text-destructive">
                <X className="w-4 h-4" />
                Reject
              </Button>
              <Button onClick={handleApprove} className="gap-2 bg-success hover:bg-success/90">
                <Check className="w-4 h-4" />
                Approve
              </Button>
            </>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Vendor Information */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">{vendorTypeName} Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">{vendorTypeName} Name</Label>
              <Input
                id="restaurantName"
                value={vendor.restaurantName}
                onChange={(e) => updateField('restaurantName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantImage">{vendorTypeName} Image</Label>
              <Input
                id="restaurantImage"
                value={vendor.restaurantImage}
                onChange={(e) => updateField('restaurantImage', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantStatus">{vendorTypeName} Status</Label>
              <Select
                value={vendor.restaurantStatus}
                onValueChange={(value) => updateField('restaurantStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">rating</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                value={vendor.rating}
                onChange={(e) => updateField('rating', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approxDeliveryTime">approxDeliveryTime</Label>
              <Input
                id="approxDeliveryTime"
                value={vendor.approxDeliveryTime}
                onChange={(e) => updateField('approxDeliveryTime', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approxPriceForTwo">approxPriceForTwo</Label>
              <Input
                id="approxPriceForTwo"
                type="number"
                value={vendor.approxPriceForTwo}
                onChange={(e) => updateField('approxPriceForTwo', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificateCode">certificateCode</Label>
              <Input
                id="certificateCode"
                value={vendor.certificateCode}
                onChange={(e) => updateField('certificateCode', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">mobileNumber</Label>
              <Input
                id="mobileNumber"
                value={vendor.mobileNumber}
                onChange={(e) => updateField('mobileNumber', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="shortDescription">shortDescription</Label>
              <Textarea
                id="shortDescription"
                value={vendor.shortDescription}
                onChange={(e) => updateField('shortDescription', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categories">categories (comma separated)</Label>
              <Input
                id="categories"
                value={vendor.categories.join(', ')}
                onChange={(e) => updateField('categories', e.target.value.split(', ').map((s) => s.trim()))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="services">services (comma separated)</Label>
              <Input
                id="services"
                value={vendor.services.join(', ')}
                onChange={(e) => updateField('services', e.target.value.split(', ').map((s) => s.trim()))}
              />
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  id="isPureVeg"
                  checked={vendor.isPureVeg}
                  onCheckedChange={(checked) => updateField('isPureVeg', checked)}
                />
                <Label htmlFor="isPureVeg">isPureVeg</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isPopular"
                  checked={vendor.isPopular}
                  onCheckedChange={(checked) => updateField('isPopular', checked)}
                />
                <Label htmlFor="isPopular">isPopular</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery & Pricing */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Delivery & Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryChargeType">deliveryChargeType</Label>
              <Select
                value={vendor.deliveryChargeType}
                onValueChange={(value) => updateField('deliveryChargeType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="dynamic">Dynamic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fixedCharge">fixedCharge</Label>
              <Input
                id="fixedCharge"
                type="number"
                value={vendor.fixedCharge}
                onChange={(e) => updateField('fixedCharge', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dynamicCharge">dynamicCharge</Label>
              <Input
                id="dynamicCharge"
                type="number"
                value={vendor.dynamicCharge}
                onChange={(e) => updateField('dynamicCharge', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeCharge">storeCharge</Label>
              <Input
                id="storeCharge"
                type="number"
                value={vendor.storeCharge}
                onChange={(e) => updateField('storeCharge', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryRadius">deliveryRadius</Label>
              <Input
                id="deliveryRadius"
                type="number"
                value={vendor.deliveryRadius}
                onChange={(e) => updateField('deliveryRadius', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumOrderPrice">minimumOrderPrice</Label>
              <Input
                id="minimumOrderPrice"
                type="number"
                value={vendor.minimumOrderPrice}
                onChange={(e) => updateField('minimumOrderPrice', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionRate">commissionRate</Label>
              <Input
                id="commissionRate"
                type="number"
                value={vendor.commissionRate}
                onChange={(e) => updateField('commissionRate', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Location Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchLocation">searchLocation</Label>
              <Input
                id="searchLocation"
                value={vendor.searchLocation}
                onChange={(e) => updateField('searchLocation', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fullAddress">fullAddress</Label>
              <Input
                id="fullAddress"
                value={vendor.fullAddress}
                onChange={(e) => updateField('fullAddress', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">city</Label>
              <Input
                id="city"
                value={vendor.city}
                onChange={(e) => updateField('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">state</Label>
              <Input
                id="state"
                value={vendor.state}
                onChange={(e) => updateField('state', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">pincode</Label>
              <Input
                id="pincode"
                value={vendor.pincode}
                onChange={(e) => updateField('pincode', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark">landmark</Label>
              <Input
                id="landmark"
                value={vendor.landmark}
                onChange={(e) => updateField('landmark', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="latitude">latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.0001"
                value={vendor.latitude}
                onChange={(e) => updateField('latitude', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.0001"
                value={vendor.longitude}
                onChange={(e) => updateField('longitude', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mapType">mapType</Label>
              <Input
                id="mapType"
                value={vendor.mapType}
                onChange={(e) => updateField('mapType', e.target.value)}
              />
            </div>
          </div>
          {/* Map Preview */}
          <div className="mt-4">
            <MapPreview 
              latitude={vendor.latitude} 
              longitude={vendor.longitude} 
              title={vendor.restaurantName}
            />
          </div>
        </div>

        {/* Bank & Payment Details */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Bank & Payment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">bankName</Label>
              <Input
                id="bankName"
                value={vendor.bankName}
                onChange={(e) => updateField('bankName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankCode">bankCode</Label>
              <Input
                id="bankCode"
                value={vendor.bankCode}
                onChange={(e) => updateField('bankCode', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientName">recipientName</Label>
              <Input
                id="recipientName"
                value={vendor.recipientName}
                onChange={(e) => updateField('recipientName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">accountNumber</Label>
              <Input
                id="accountNumber"
                value={vendor.accountNumber}
                onChange={(e) => updateField('accountNumber', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upiId">upiId</Label>
              <Input
                id="upiId"
                value={vendor.upiId}
                onChange={(e) => updateField('upiId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypalId">paypalId</Label>
              <Input
                id="paypalId"
                value={vendor.paypalId}
                onChange={(e) => updateField('paypalId', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Account Credentials */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Account Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loginEmail">loginEmail</Label>
              <Input
                id="loginEmail"
                type="email"
                value={vendor.loginEmail}
                onChange={(e) => updateField('loginEmail', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loginPassword">loginPassword</Label>
              <Input
                id="loginPassword"
                type="password"
                value={vendor.loginPassword}
                onChange={(e) => updateField('loginPassword', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Agent Information */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Agent Information</h2>
          <div className="space-y-2">
            <Label htmlFor="agentName">Agent Name</Label>
            <Input
              id="agentName"
              value={vendor.agentName || ''}
              onChange={(e) => updateField('agentName', e.target.value)}
              placeholder="Enter agent name"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
