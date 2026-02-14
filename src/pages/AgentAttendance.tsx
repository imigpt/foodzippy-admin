import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Download, Filter, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    username: string;
    email?: string;
    role: string;
  };
  userName: string;
  role: string;
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

export default function AgentAttendance() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState('all');
  const [statistics, setStatistics] = useState<any>({});

  useEffect(() => {
    loadAttendance();
  }, [selectedMonth, selectedYear, statusFilter]);

  const loadAttendance = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        role: 'agent',
        month: selectedMonth,
        year: selectedYear,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await api.getUserAttendance(params);
      setAttendance(response.attendance);
      setStatistics(response.summary || response.statistics);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load attendance',
        variant: 'destructive',
      });
      setAttendance([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'Half-Day':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'Absent':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'Leave':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const filteredAttendance = attendance.filter((record) =>
    record.userName.toLowerCase().includes(search.toLowerCase()) ||
    record.userId?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Agent Attendance</h1>
        <p className="text-muted-foreground">
          Monitor and manage agent attendance records
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{statistics.totalRecords || 0}</p>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Unique Agents</p>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{statistics.uniqueUsers || statistics.uniqueAgents || 0}</p>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Present</p>
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{statistics.presentCount || 0}</p>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Half Days</p>
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">{statistics.halfDayCount || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block">Search Agent</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by name or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12"
              />
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
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
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
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

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Half-Day">Half-Day</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Leave">Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-card rounded-xl border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Attendance Records</h2>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAttendance.length > 0 ? (
                filteredAttendance.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          @{record.userId?.username}
                        </p>
                        {record.userId?.role && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {record.userId.role}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(record.date)}</TableCell>
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
                    <TableCell>
                      {record.checkOut ? formatTime(record.checkOut) : '-'}
                    </TableCell>
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
                    <TableCell>
                      {record.duration > 0 ? formatDuration(record.duration) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {record.remark || '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <p className="text-muted-foreground">No attendance records found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
