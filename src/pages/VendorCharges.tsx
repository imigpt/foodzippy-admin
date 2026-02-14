import { useState, useEffect } from 'react';
import { Wallet, Search, TrendingUp, Check, IndianRupee } from 'lucide-react';

interface Vendor {
  _id: string;
  restaurantName: string;
  restaurantImage: any;
  fullAddress: string;
  city: string;
  state: string;
  listingType: 'launching' | 'vip' | 'normal';
  listingCharge: number;
  restaurantStatus: string;
  createdAt: string;
  createdByName: string;
}

type ListingTab = 'launching' | 'vip' | 'normal';

export default function VendorCharges() {
  const [activeTab, setActiveTab] = useState<ListingTab>('launching');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCharge, setEditingCharge] = useState<Record<string, number>>({});
  const [savingVendor, setSavingVendor] = useState<string | null>(null);
  const [tabCounts, setTabCounts] = useState<Record<ListingTab, number>>({
    launching: 0,
    vip: 0,
    normal: 0,
  });

  useEffect(() => {
    loadVendors(activeTab);
    loadAllCounts();
  }, [activeTab]);

  const loadAllCounts = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Load counts for all tabs
      const [launchingRes, vipRes, normalRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/vendors/listing/launching?limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/admin/vendors/listing/vip?limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/admin/vendors/listing/normal?limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const [launchingData, vipData, normalData] = await Promise.all([
        launchingRes.json(),
        vipRes.json(),
        normalRes.json(),
      ]);

      setTabCounts({
        launching: launchingData.pagination?.total || 0,
        vip: vipData.pagination?.total || 0,
        normal: normalData.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Failed to load counts:', error);
    }
  };

  const loadVendors = async (type: ListingTab) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/admin/vendors/listing/${type}?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateListingCharge = async (vendorId: string, charge: number) => {
    try {
      setSavingVendor(vendorId);
      const token = localStorage.getItem('admin_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/admin/vendors/${vendorId}/listing-charge`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingCharge: charge }),
      });

      if (response.ok) {
        // Update local state
        setVendors(vendors.map(v => 
          v._id === vendorId ? { ...v, listingCharge: charge } : v
        ));
        // Clear editing state
        setEditingCharge(prev => {
          const newState = { ...prev };
          delete newState[vendorId];
          return newState;
        });
      }
    } catch (error) {
      console.error('Failed to update charge:', error);
    } finally {
      setSavingVendor(null);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabConfig = {
    launching: {
      label: 'Launching',
      icon: '🚀',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-700',
    },
    vip: {
      label: 'VIP',
      icon: '⭐',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-700',
    },
    normal: {
      label: 'Normal',
      icon: '📋',
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700',
    },
  };

  const getImageUrl = (image: any) => {
    if (!image) return '/placeholder-restaurant.jpg';
    if (typeof image === 'string') return image;
    if (image.url) return image.url;
    if (image.secure_url) return image.secure_url;
    return '/placeholder-restaurant.jpg';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Vendor Listing Charges</h1>
          </div>
          <p className="text-gray-600">Manage vendor listing types and charges</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {(Object.keys(tabConfig) as ListingTab[]).map((tab) => {
              const config = tabConfig[tab];
              
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors relative ${
                    activeTab === tab
                      ? `${config.textColor} bg-${config.color}-50`
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    <span>{config.label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activeTab === tab ? 'bg-white' : 'bg-gray-200'
                    }`}>
                      {tabCounts[tab]}
                    </span>
                  </div>
                  {activeTab === tab && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-${config.color}-500`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by restaurant name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto" />
                <p className="mt-4 text-gray-600">Loading vendors...</p>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{tabConfig[activeTab].icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No {tabConfig[activeTab].label} Vendors
                </h3>
                <p className="text-gray-600">
                  No vendors found with {tabConfig[activeTab].label.toLowerCase()} listing type
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVendors.map((vendor) => (
                  <div
                    key={vendor._id}
                    className={`border-2 ${tabConfig[activeTab].borderColor} rounded-lg p-4 ${tabConfig[activeTab].bgColor} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Image */}
                      <img
                        src={getImageUrl(vendor.restaurantImage)}
                        alt={vendor.restaurantName}
                        className="w-20 h-20 rounded-lg object-cover"
                      />

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {vendor.restaurantName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {vendor.fullAddress}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {vendor.city}, {vendor.state}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Created by: {vendor.createdByName} • {new Date(vendor.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Charge Section */}
                          <div className="text-right">
                            {activeTab === 'launching' ? (
                              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold">
                                FREE
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <IndianRupee className="w-5 h-5 text-gray-600" />
                                  <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={editingCharge[vendor._id] ?? vendor.listingCharge}
                                    onChange={(e) => setEditingCharge(prev => ({
                                      ...prev,
                                      [vendor._id]: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    placeholder="0"
                                  />
                                </div>
                                {(editingCharge[vendor._id] !== undefined && 
                                  editingCharge[vendor._id] !== vendor.listingCharge) && (
                                  <button
                                    onClick={() => updateListingCharge(vendor._id, editingCharge[vendor._id])}
                                    disabled={savingVendor === vendor._id}
                                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                  >
                                    {savingVendor === vendor._id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4" />
                                        Save
                                      </>
                                    )}
                                  </button>
                                )}
                                {vendor.listingCharge > 0 && editingCharge[vendor._id] === undefined && (
                                  <p className="text-sm text-gray-600">
                                    Current: ₹{vendor.listingCharge}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
