import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Star, Calendar, MessageSquare, Smile, IndianRupee, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, normalizeVendor, PaymentConfig } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import MapPreview from '@/components/MapPreview';

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Payment states
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVisitStatus, setSelectedVisitStatus] = useState<string>('');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  
  // Listing charge states
  const [selectedListingType, setSelectedListingType] = useState<'launching' | 'vip' | 'normal'>('launching');
  const [listingCharge, setListingCharge] = useState<number>(0);
  const [isUpdatingListing, setIsUpdatingListing] = useState(false);

  useEffect(() => {
    if (id) {
      loadVendor();
      loadPaymentConfig();
    }
  }, [id]);

  const loadPaymentConfig = async () => {
    try {
      const response = await api.getPaymentConfig();
      if (response.success) {
        setPaymentConfig(response.config);
      }
    } catch (error) {
      console.error('Failed to load payment config:', error);
    }
  };

  const loadVendor = async () => {
    if (!id || typeof id !== 'string') {
      console.error('Invalid vendor ID:', id);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.getVendorById(id);
      const normalizedVendor = normalizeVendor(response.data);
      setVendor(normalizedVendor);
      setSelectedCategory(normalizedVendor.paymentCategory || '');
      setSelectedVisitStatus(normalizedVendor.visitStatus || 'pending-visit');
      setSelectedListingType(normalizedVendor.listingType || 'launching');
      setListingCharge(normalizedVendor.listingCharge || 0);
    } catch (error) {
      console.error('Failed to load vendor:', error);
      setVendor(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentStatusUpdate = async () => {
    if (!selectedCategory || !selectedVisitStatus) {
      toast({
        title: 'Missing Information',
        description: 'Please select both category and visit status',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdatingPayment(true);
      const response = await api.updateVendorPaymentStatus(id!, {
        paymentCategory: selectedCategory,
        visitStatus: selectedVisitStatus,
      });
      if (response.success) {
        toast({
          title: 'Success',
          description: response.paymentCreated 
            ? `Payment of ₹${response.paymentAmount} created for ${response.paymentType}`
            : 'Payment status updated',
        });
        // Update vendor state with returned data to show updated values immediately
        if (response.vendor) {
          setVendor((prev: any) => ({
            ...prev,
            paymentCategory: response.vendor.paymentCategory,
            visitStatus: response.vendor.visitStatus,
            followUpDate: response.vendor.followUpDate,
            totalPaymentDue: response.vendor.totalPaymentDue,
            totalPaymentPaid: response.vendor.totalPaymentPaid,
            paymentCompleted: response.vendor.paymentCompleted,
          }));
        } else {
          loadVendor(); // Fallback to reload
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleListingChargeUpdate = async () => {
    try {
      setIsUpdatingListing(true);
      const token = localStorage.getItem('admin_token'); // Changed from 'adminToken' to 'admin_token'
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/admin/vendors/${id}/listing-charge`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingCharge }),
      });

      const data = await response.json();

      if (response.ok) {
        // Also update listing type
        const updateResponse = await fetch(`${apiUrl}/api/admin/vendors/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ listingType: selectedListingType }),
        });

        toast({
          title: 'Success',
          description: 'Listing charge updated successfully',
        });
        
        setVendor((prev: any) => ({
          ...prev,
          listingType: selectedListingType,
          listingCharge: listingCharge,
        }));
      } else {
        throw new Error(data.message || 'Failed to update');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update listing charge',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingListing(false);
    }
  };

  // Calculate estimated payment based on selected options
  const getEstimatedPayment = () => {
    if (!paymentConfig || !paymentConfig.categories || !selectedCategory || !selectedVisitStatus) return null;
    
    const category = selectedCategory as 'A' | 'B' | 'C' | 'D';
    if (!['A', 'B', 'C', 'D'].includes(category)) return null;
    
    const rates = paymentConfig.categories[category];
    if (!rates) return null;

    const isOnboarded = selectedVisitStatus.includes('onboarded');
    
    if (isOnboarded) {
      return { type: 'Onboarding', amount: rates.onboarding };
    }
    
    if (selectedVisitStatus === 'visited-followup-scheduled') {
      return { type: 'Visit', amount: rates.visit };
    }
    
    if (selectedVisitStatus === 'followup-2nd-scheduled') {
      return { type: 'Follow-up', amount: rates.followup };
    }
    
    return null;
  };

  const estimatedPayment = paymentConfig ? getEstimatedPayment() : null;

  // Get vendor type name (capitalize first letter)
  const getVendorTypeName = () => {
    if (!vendor?.vendorType) return 'Restaurant';
    return vendor.vendorType.charAt(0).toUpperCase() + vendor.vendorType.slice(1);
  };

  const vendorTypeName = vendor ? getVendorTypeName() : 'Restaurant';

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
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

  return (
    <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{vendor.restaurantName}</h1>
          <p className="text-muted-foreground">Vendor Details</p>
        </div>
        <StatusBadge status={vendor.restaurantStatus} />
        <Button onClick={() => navigate(`/vendor/${id}/edit`)}>Edit Vendor</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor Information */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">{vendorTypeName} Information</h2>
            <div className="flex gap-6">
              <img
                src={vendor.restaurantImage}
                alt={vendor.restaurantName}
                className="w-32 h-32 rounded-xl object-cover"
              />
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{vendorTypeName} Name</p>
                  <p className="font-medium">{vendor.restaurantName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="font-medium flex items-center gap-1">
                    <Star className="w-4 h-4 text-secondary fill-secondary" />
                    {vendor.rating}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Certificate Code</p>
                  <p className="font-medium">{vendor.certificateCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Time</p>
                  <p className="font-medium">{vendor.approxDeliveryTime}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{vendor.shortDescription}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pure Veg</p>
                  <p className="font-medium">{vendor.isPureVeg ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Popular</p>
                  <p className="font-medium">{vendor.isPopular ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {vendor.categories && vendor.categories.length > 0 ? (
                  vendor.categories.map((cat: string) => (
                    <span key={cat} className="px-3 py-1 text-sm bg-muted rounded-full">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No categories</span>
                )}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Services</p>
              <div className="flex flex-wrap gap-2">
                {vendor.services && vendor.services.length > 0 ? (
                  vendor.services.map((service: string) => (
                    <span key={service} className="px-3 py-1 text-sm bg-accent text-accent-foreground rounded-full">
                      {service}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No services</span>
                )}
              </div>
            </div>
          </div>

          {/* Delivery & Pricing */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Delivery & Pricing</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Price for Two</p>
                <p className="font-medium">₹{vendor.approxPriceForTwo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Minimum Order</p>
                <p className="font-medium">₹{vendor.minimumOrderPrice}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Radius</p>
                <p className="font-medium">{vendor.deliveryRadius} km</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Charge Type</p>
                <p className="font-medium capitalize">{vendor.deliveryChargeType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {vendor.deliveryChargeType === 'fixed' ? 'Fixed Charge' : 'Dynamic Charge'}
                </p>
                <p className="font-medium">
                  ₹{vendor.deliveryChargeType === 'fixed' ? vendor.fixedCharge : vendor.dynamicCharge}/km
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Store Charge</p>
                <p className="font-medium">₹{vendor.storeCharge}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commission Rate</p>
                <p className="font-medium">{vendor.commissionRate}%</p>
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Location Details</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Full Address</p>
                <p className="font-medium flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  {vendor.fullAddress}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">{vendor.city}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">State</p>
                <p className="font-medium">{vendor.state}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pincode</p>
                <p className="font-medium">{vendor.pincode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Landmark</p>
                <p className="font-medium">{vendor.landmark}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Latitude</p>
                <p className="font-medium">{vendor.latitude}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Longitude</p>
                <p className="font-medium">{vendor.longitude}</p>
              </div>
            </div>
            {/* Map Preview */}
            <MapPreview 
              latitude={vendor.latitude} 
              longitude={vendor.longitude} 
              title={vendor.restaurantName}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Contact</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{vendor.mobileNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{vendor.loginEmail}</span>
              </div>
            </div>
          </div>

          {/* Bank & Payment Details */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Bank & Payment</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Bank Name</p>
                <p className="font-medium">{vendor.bankName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Bank Code</p>
                <p className="font-medium">{vendor.bankCode || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Recipient Name</p>
                <p className="font-medium">{vendor.recipientName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Number</p>
                <p className="font-medium">
                  {vendor.accountNumber ? `****${vendor.accountNumber.slice(-4)}` : 'Not provided'}
                </p>
              </div>
              {vendor.upiId && (
                <div>
                  <p className="text-muted-foreground">UPI ID</p>
                  <p className="font-medium">{vendor.upiId}</p>
                </div>
              )}
              {vendor.paypalId && (
                <div>
                  <p className="text-muted-foreground">PayPal ID</p>
                  <p className="font-medium">{vendor.paypalId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Account Credentials */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Account Credentials</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Login Email</p>
                <p className="font-medium">{vendor.loginEmail}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Login Password</p>
                <p className="font-medium">••••••••</p>
              </div>
            </div>
          </div>

          {/* Agent/Employee Information */}
          {(vendor.createdByName || vendor.agentName) && (
            <div className="bg-card rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">
                {vendor.createdByRole === 'employee' ? 'Employee' : 'Agent'} Information
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{vendor.createdByName || vendor.agentName}</p>
                </div>
                {vendor.createdByUsername && (
                  <div>
                    <p className="text-muted-foreground">Username</p>
                    <p className="font-medium">{vendor.createdByUsername}</p>
                  </div>
                )}
                {vendor.createdByRole && (
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">{vendor.createdByRole}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submitted Info */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Submission Info</h2>
            <div className="text-sm">
              <p className="text-muted-foreground">Submitted Date</p>
              <p className="font-medium">
                {vendor.createdAt 
                  ? new Date(vendor.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : 'Not available'}
              </p>
            </div>
          </div>

          {/* Payment & Category Section */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <IndianRupee className="w-5 h-5" />
                Payment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Category */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Payment Category
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Category A (₹70/₹70/₹700)</SelectItem>
                    <SelectItem value="B">Category B (₹50/₹50/₹500)</SelectItem>
                    <SelectItem value="C">Category C (₹35/₹35/₹350)</SelectItem>
                    <SelectItem value="D">Category D (₹20/₹20/₹200)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Step-based Visit Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Current Stage
                </label>
                <Select 
                  value={
                    selectedVisitStatus === 'pending-visit' ? 'pending' :
                    selectedVisitStatus.startsWith('visited') ? 'visited' :
                    selectedVisitStatus.startsWith('followup') ? 'followup' :
                    selectedVisitStatus.startsWith('2nd') ? '2nd-followup' : 'pending'
                  } 
                  onValueChange={(stage) => {
                    // Set default status for each stage
                    if (stage === 'pending') setSelectedVisitStatus('pending-visit');
                    else if (stage === 'visited') setSelectedVisitStatus('visited-onboarded');
                    else if (stage === 'followup') setSelectedVisitStatus('followup-onboarded');
                    else if (stage === '2nd-followup') setSelectedVisitStatus('2nd-followup-onboarded');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">🕐 Pending Visit</SelectItem>
                    <SelectItem value="visited">📍 Visited</SelectItem>
                    <SelectItem value="followup">🔄 Follow-up Done</SelectItem>
                    <SelectItem value="2nd-followup">🔄 2nd Follow-up Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visited Options */}
              {selectedVisitStatus.startsWith('visited') && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Visit Outcome
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVisitStatus('visited-onboarded')}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedVisitStatus === 'visited-onboarded' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">✓ Onboarded</span>
                      <p className="text-xs text-muted-foreground">Vendor successfully onboarded</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVisitStatus('visited-rejected')}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedVisitStatus === 'visited-rejected' 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">✗ Rejected</span>
                      <p className="text-xs text-muted-foreground">Vendor declined</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVisitStatus('visited-followup-scheduled')}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedVisitStatus === 'visited-followup-scheduled' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">📅 Follow-up Scheduled</span>
                      <p className="text-xs text-muted-foreground">Agent will visit again (Visit payment credited)</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Follow-up Options */}
              {selectedVisitStatus.startsWith('followup') && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Follow-up Outcome
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVisitStatus('followup-onboarded')}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedVisitStatus === 'followup-onboarded' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">✓ Onboarded</span>
                      <p className="text-xs text-muted-foreground">Vendor successfully onboarded after follow-up</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVisitStatus('followup-rejected')}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedVisitStatus === 'followup-rejected' 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">✗ Rejected</span>
                      <p className="text-xs text-muted-foreground">Vendor declined after follow-up</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVisitStatus('followup-2nd-scheduled')}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedVisitStatus === 'followup-2nd-scheduled' 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">📅 2nd Follow-up Scheduled</span>
                      <p className="text-xs text-muted-foreground">Visit + Follow-up payment credited</p>
                    </button>
                  </div>
                </div>
              )}

              {/* 2nd Follow-up Options */}
              {selectedVisitStatus.startsWith('2nd') && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    2nd Follow-up Outcome
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVisitStatus('2nd-followup-onboarded')}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedVisitStatus === '2nd-followup-onboarded' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">✓ Onboarded</span>
                      <p className="text-xs text-muted-foreground">Vendor successfully onboarded</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVisitStatus('2nd-followup-rejected')}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedVisitStatus === '2nd-followup-rejected' 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">✗ Rejected</span>
                      <p className="text-xs text-muted-foreground">Vendor declined after 2nd follow-up</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Current Status Display */}
              {vendor.paymentCategory && (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-muted-foreground">Current Category</p>
                  <Badge className="mt-1 bg-green-100 text-green-800">
                    Category {vendor.paymentCategory}
                  </Badge>
                  {vendor.visitStatus && (
                    <>
                      <p className="text-xs text-muted-foreground mt-2">Current Status</p>
                      <Badge variant="outline" className="mt-1">
                        {vendor.visitStatus.replace(/-/g, ' ')}
                      </Badge>
                    </>
                  )}
                </div>
              )}

              {/* Estimated Payment */}
              {estimatedPayment && (
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs text-muted-foreground">Estimated Payment for this action</p>
                  <p className="text-lg font-bold text-yellow-700">
                    ₹{estimatedPayment.amount} ({estimatedPayment.type})
                  </p>
                </div>
              )}

              {/* Payment Due/Paid - Always show */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200 text-center">
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="font-bold text-yellow-700">₹{vendor.totalPaymentDue || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 border border-green-200 text-center">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="font-bold text-green-700">₹{vendor.totalPaymentPaid || 0}</p>
                </div>
              </div>

              {/* Update Button */}
              <Button 
                className="w-full" 
                onClick={handlePaymentStatusUpdate}
                disabled={isUpdatingPayment || !selectedCategory}
              >
                {isUpdatingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update Payment Status
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Vendor Listing Charge Section */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <IndianRupee className="w-5 h-5" />
                Vendor Listing Charge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Listing Type Selection */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Listing Type
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {/* Launching */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedListingType('launching');
                      setListingCharge(0);
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedListingType === 'launching' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🚀</span>
                      <div className="flex-1">
                        <span className="font-medium block">Launching</span>
                        <p className="text-xs text-muted-foreground">Perfect for new vendors - FREE</p>
                      </div>
                      <span className="font-bold text-green-600">₹0</span>
                    </div>
                  </button>

                  {/* VIP */}
                  <button
                    type="button"
                    onClick={() => setSelectedListingType('vip')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedListingType === 'vip' 
                        ? 'border-yellow-500 bg-yellow-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⭐</span>
                      <div className="flex-1">
                        <span className="font-medium block">VIP</span>
                        <p className="text-xs text-muted-foreground">Premium visibility</p>
                      </div>
                    </div>
                  </button>

                  {/* Normal */}
                  <button
                    type="button"
                    onClick={() => setSelectedListingType('normal')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedListingType === 'normal' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      <div className="flex-1">
                        <span className="font-medium block">Normal</span>
                        <p className="text-xs text-muted-foreground">Standard listing</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Charge Input (only for VIP and Normal) */}
              {selectedListingType !== 'launching' && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Listing Charge Amount
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={listingCharge}
                      onChange={(e) => setListingCharge(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter charge amount"
                    />
                  </div>
                </div>
              )}

              {/* Current Listing Info */}
              {vendor.listingType && (
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-muted-foreground">Current Listing Type</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${
                      vendor.listingType === 'launching' ? 'bg-green-100 text-green-800' :
                      vendor.listingType === 'vip' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {vendor.listingType === 'launching' && '🚀 Launching'}
                      {vendor.listingType === 'vip' && '⭐ VIP'}
                      {vendor.listingType === 'normal' && '📋 Normal'}
                    </Badge>
                    <span className="text-sm font-medium">₹{vendor.listingCharge || 0}</span>
                  </div>
                </div>
              )}

              {/* Update Button */}
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                onClick={handleListingChargeUpdate}
                disabled={isUpdatingListing}
              >
                {isUpdatingListing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update Listing Charge
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Review Section */}
          {vendor.review && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Review Details
              </h2>
              <div className="space-y-4">
                {/* Follow-up Date */}
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4" />
                    Follow-Up Date
                  </p>
                  <p className="font-semibold text-blue-700">
                    {new Date(vendor.review.followUpDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Convincing Status */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Convincing Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    vendor.review.convincingStatus === 'convenience' 
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : vendor.review.convincingStatus === 'convertible'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                    {vendor.review.convincingStatus === 'convenience' && '✓ Convenience'}
                    {vendor.review.convincingStatus === 'convertible' && '↻ Convertible'}
                    {vendor.review.convincingStatus === 'not_convertible' && '✗ Not Convertible'}
                  </span>
                </div>

                {/* Behavior */}
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                    <Smile className="w-4 h-4" />
                    Way of Behavior
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    vendor.review.behavior === 'excellent' 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : vendor.review.behavior === 'good'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-orange-100 text-orange-700 border border-orange-300'
                  }`}>
                    {vendor.review.behavior === 'excellent' && '⭐ Excellent'}
                    {vendor.review.behavior === 'good' && '👍 Good'}
                    {vendor.review.behavior === 'rude' && '⚠️ Rude'}
                  </span>
                </div>

                {/* Voice Note */}
                {vendor.review.audioUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Voice Note</p>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <audio 
                        controls 
                        src={vendor.review.audioUrl} 
                        className="w-full"
                        style={{ height: '40px' }}
                      >
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Form Data Section - Hidden */}
          {/* {vendor.formData && Object.keys(vendor.formData).length > 0 && (
            <div className="bg-card rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Additional Form Data</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(vendor.formData).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <p className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="font-medium">
                      {Array.isArray(value) 
                        ? value.join(', ') 
                        : typeof value === 'boolean' 
                        ? value ? 'Yes' : 'No'
                        : value?.toString() || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
