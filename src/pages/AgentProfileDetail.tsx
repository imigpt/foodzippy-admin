import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Phone, Calendar, User, Briefcase, Clock, FileText, Eye, Edit, MapPin, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface AgentProfile {
  _id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dob: string | null;
  age: number | null;
  agentType: string;
  role?: string;
  profileImage: string;
  isActive: boolean;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  duration: number;
  status: string;
  remark: string;
  location?: {
    checkInLocation?: LocationData;
    checkOutLocation?: LocationData;
  };
}

interface Vendor {
  _id: string;
  restaurantName: string;
  mobileNumber: string;
  fullAddress: string;
  city: string;
  state: string;
  restaurantStatus: string;
  editRequested: boolean;
  editApproved: boolean;
  createdAt: string;
}

export default function AgentProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isNewSystem, setIsNewSystem] = useState<boolean | null>(null); // Track if it's User or Agent
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    email: '',
    phone: '',
    alternatePhone: '',
    dob: '',
    agentType: '',
    isActive: true,
  });
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadAgentProfile();
      loadAgentVendors();
    }
  }, [id]);

  useEffect(() => {
    if (id && isNewSystem !== null) {
      loadAgentAttendance();
    }
  }, [id, selectedMonth, selectedYear, isNewSystem]);

  const loadAgentProfile = async () => {
    try {
      // Try User API first (new system)
      try {
        const response = await api.getUserByIdAdmin(id!);
        setProfile(response.user);
        setIsNewSystem(true);
        return;
      } catch {
        // Fall back to Agent API (old system)
        const response = await api.getAgentById(id!);
        setProfile(response.agent);
        setIsNewSystem(false);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAgentAttendance = async () => {
    if (isNewSystem === null) return; // Wait until we know which system
    
    try {
      if (isNewSystem) {
        // Use User attendance API
        const response = await api.getUserAttendanceById(id!, {
          month: selectedMonth,
          year: selectedYear,
        });
        setAttendance(response.attendance);
        setAttendanceStats(response.statistics);
      } else {
        // Use Agent attendance API
        const response = await api.getAgentAttendanceById(id!, {
          month: selectedMonth,
          year: selectedYear,
        });
        setAttendance(response.attendance);
        setAttendanceStats(response.statistics);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load attendance',
        variant: 'destructive',
      });
    }
  };

  const loadAgentVendors = async () => {
    try {
      const response = await api.getVendorsByAgent(id!);
      setVendors(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load vendors',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditDialog = () => {
    if (profile) {
      // Set default agentType based on role if not already set
      const defaultAgentType = profile.agentType || (profile.role === 'employee' ? 'Junior-Employee' : 'Junior-Agent');
      
      setEditFormData({
        email: profile.email || '',
        phone: profile.phone || '',
        alternatePhone: profile.alternatePhone || '',
        dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
        agentType: defaultAgentType,
        isActive: profile.isActive,
      });
      setSelectedProfileImage(null);
      setProfileImagePreview('');
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    try {
      setIsSubmitting(true);
      const updateData: any = {
        email: editFormData.email,
        phone: editFormData.phone,
        alternatePhone: editFormData.alternatePhone,
        isActive: editFormData.isActive,
      };

      if (editFormData.dob) {
        updateData.dob = editFormData.dob;
      }

      // Use appropriate API based on system type
      if (isNewSystem) {
        // New User system - don't send agentType, it's stored as role
        await api.updateUserById(profile._id, updateData, selectedProfileImage || undefined);
      } else {
        // Old Agent system
        updateData.agentType = editFormData.agentType;
        await api.updateAgent(profile._id, updateData);
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      setIsEditDialogOpen(false);
      loadAgentProfile();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      publish: 'bg-green-100 text-green-800 hover:bg-green-100',
      reject: 'bg-red-100 text-red-800 hover:bg-red-100',
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || styles.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'Half-Day':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-300">
        <p className="text-muted-foreground">Agent not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/agents')}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Agents
        </Button>
        <h1 className="text-3xl font-bold mb-2">Agent Profile</h1>
        <p className="text-muted-foreground">
          View detailed information about the agent
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border mb-8 bg-[#E2333F]">
        <div className="bg-gradient-to-r  h-32 rounded-t-xl"></div>
        
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row gap-6 -mt-16">
            {/* Profile Image */}
            <div className="w-32 h-32 rounded-full border-4 border-background shadow-lg overflow-hidden bg-muted">
              {profile.profileImage ? (
                <img 
                  src={profile.profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">{profile.name}</h2>
                  <p className="text-white mt-1">@{profile.username}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={profile.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                      {profile.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="secondary">{profile.agentType}</Badge>
                  </div>
                </div>
                <Button onClick={openEditDialog} className="mt-2 bg-white text-black">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white">Email</p>
                <p className="font-medium text-white">{profile.email || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white">Phone</p>
                <p className="font-medium text-white">{profile.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white">Alternate Phone</p>
                <p className="font-medium text-white">{profile.alternatePhone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white">Date of Birth</p>
                <p className="font-medium text-white">
                  {profile.dob 
                    ? new Date(profile.dob).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Not provided'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white">Age</p>
                <p className="font-medium text-white">{profile.age ? `${profile.age} years` : 'Not calculated'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white">Agent Type</p>
                <p className="font-medium text-white">{profile.agentType}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Requests and Attendance */}
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className={`grid w-full max-w-md ${profile?.role === 'employee' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <TabsTrigger value="requests">
            <FileText className="w-4 h-4 mr-2" />
            Vendor Requests
          </TabsTrigger>
          {profile?.role === 'employee' && (
            <TabsTrigger value="attendance">
              <Clock className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
          )}
        </TabsList>

        {/* Vendor Requests Tab */}
        <TabsContent value="requests" className="mt-6">
          <div className="bg-card rounded-xl border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Vendor Requests</h3>
                <Badge variant="secondary">{vendors.length} Total</Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.length > 0 ? (
                    vendors.map((vendor) => (
                      <TableRow key={vendor._id}>
                        <TableCell className="font-medium">{vendor.restaurantName}</TableCell>
                        <TableCell>{vendor.mobileNumber}</TableCell>
                        <TableCell>{vendor.city}, {vendor.state}</TableCell>
                        <TableCell>{getStatusBadge(vendor.restaurantStatus)}</TableCell>
                        <TableCell>{formatDate(vendor.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/vendor/${vendor._id}`)}
                              title="View Full Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/vendor/${vendor._id}/edit`)}
                              title="Edit Vendor"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No vendor requests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Attendance Tab - Only for Employees */}
        {profile?.role === 'employee' && (
          <TabsContent value="attendance" className="mt-6">
          {/* Attendance Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border p-6">
              <p className="text-sm text-muted-foreground">Total Days</p>
              <p className="text-3xl font-bold mt-2">{attendanceStats.totalDays || 0}</p>
            </div>
            <div className="bg-card rounded-xl border p-6">
              <p className="text-sm text-muted-foreground">Present</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{attendanceStats.presentDays || 0}</p>
            </div>
            <div className="bg-card rounded-xl border p-6">
              <p className="text-sm text-muted-foreground">Half Days</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{attendanceStats.halfDays || 0}</p>
            </div>
            <div className="bg-card rounded-xl border p-6">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{attendanceStats.totalHours || 0}</p>
            </div>
          </div>

          {/* Month/Year Filter */}
          <div className="bg-card rounded-xl border p-4 mb-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-card rounded-xl border">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Attendance History</h3>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check In Location</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Check Out Location</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length > 0 ? (
                    attendance.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                        <TableCell>{formatTime(record.checkIn)}</TableCell>
                        <TableCell>
                          {record.location?.checkInLocation ? (
                            <a
                              href={`https://www.google.com/maps?q=${record.location.checkInLocation.latitude},${record.location.checkInLocation.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                              title={record.location.checkInLocation.address || 'View on map'}
                            >
                              <MapPin className="w-4 h-4" />
                              <span className="max-w-[120px] truncate text-xs">
                                {record.location.checkInLocation.address || 
                                 `${record.location.checkInLocation.latitude.toFixed(4)}, ${record.location.checkInLocation.longitude.toFixed(4)}`}
                              </span>
                            </a>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{record.checkOut ? formatTime(record.checkOut) : '-'}</TableCell>
                        <TableCell>
                          {record.location?.checkOutLocation ? (
                            <a
                              href={`https://www.google.com/maps?q=${record.location.checkOutLocation.latitude},${record.location.checkOutLocation.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                              title={record.location.checkOutLocation.address || 'View on map'}
                            >
                              <MapPin className="w-4 h-4" />
                              <span className="max-w-[120px] truncate text-xs">
                                {record.location.checkOutLocation.address || 
                                 `${record.location.checkOutLocation.latitude.toFixed(4)}, ${record.location.checkOutLocation.longitude.toFixed(4)}`}
                              </span>
                            </a>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{record.duration > 0 ? formatDuration(record.duration) : '-'}</TableCell>
                        <TableCell>
                          <Badge className={getAttendanceStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.remark || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No attendance records found for this month
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
        )}
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Agent Profile</DialogTitle>
            <DialogDescription>
              Update agent's profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-profileImage">Profile Image</Label>
              <div className="flex items-center gap-4">
                {(profileImagePreview || profile?.profileImage) && (
                  <img
                    src={profileImagePreview || profile?.profileImage}
                    alt="Profile preview"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <Input
                  id="edit-profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="agent@example.com"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="+1234567890"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-alternatePhone">Alternate Phone</Label>
              <Input
                id="edit-alternatePhone"
                type="tel"
                placeholder="+0987654321 (Optional)"
                value={editFormData.alternatePhone}
                onChange={(e) => setEditFormData({ ...editFormData, alternatePhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                type="date"
                value={editFormData.dob}
                onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-agentType">Agent Type</Label>
              <Select
                value={editFormData.agentType}
                onValueChange={(value) => setEditFormData({ ...editFormData, agentType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profile?.role === 'employee' ? (
                    // Options for Employees
                    <>
                      <SelectItem value="Junior-Employee">Junior-Employee</SelectItem>
                      <SelectItem value="Assistant-Manager">Assistant-Manager</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                    </>
                  ) : (
                    // Options for Agents (or legacy Agent model)
                    <>
                      <SelectItem value="Junior-Agent">Junior-Agent</SelectItem>
                      <SelectItem value="Senior-Agent">Senior-Agent</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Active Status</Label>
              <Switch
                id="edit-active"
                checked={editFormData.isActive}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
