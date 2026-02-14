import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { api, normalizeVendors } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ITEMS_PER_PAGE = 10;

export default function VendorRequests() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  const vendorId = searchParams.get('id'); // Get vendor ID from notification
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  // Auto-navigate to vendor detail if coming from notification
  useEffect(() => {
    if (vendorId && typeof vendorId === 'string') {
      // Use replace to avoid adding to history stack
      navigate(`/vendor/${vendorId}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  useEffect(() => {
    if (!vendorId) { // Only load vendors if not redirecting
      loadVendors();
    }
  }, [currentPage, statusFilter, search, vendorId]);

  const loadVendors = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (search) {
        params.search = search;
      }

      const response = await api.getVendors(params);
      setVendors(normalizeVendors(response.data));
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      setVendors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (id: string) => {
    navigate(`/vendor/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/vendor/${id}/edit`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vendor Requests</h1>
        <p className="text-muted-foreground">Manage vendor registration requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by vendor name, city, mobile, or agent name..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-40 h-12">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="publish">Published</SelectItem>
            <SelectItem value="reject">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Follow-Up Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="animate-pulse text-muted-foreground">Loading...</div>
                </TableCell>
              </TableRow>
            ) : vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No vendor requests found
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.restaurantName}</TableCell>
                  <TableCell>{vendor.city}</TableCell>
                  <TableCell>{vendor.mobileNumber}</TableCell>
                  <TableCell>
                    {vendor.createdByName || vendor.agentName ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {vendor.createdByName || vendor.agentName}
                        </span>
                        {vendor.createdByRole && (
                          <span className="text-xs text-muted-foreground capitalize">
                            ({vendor.createdByRole})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No agent</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {vendor.review?.followUpDate ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-blue-700">
                          {new Date(vendor.review.followUpDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className={`text-xs ${
                          vendor.review.convincingStatus === 'convenience' 
                            ? 'text-green-600'
                            : vendor.review.convincingStatus === 'convertible'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {vendor.review.convincingStatus === 'convenience' && '✓ Convenience'}
                          {vendor.review.convincingStatus === 'convertible' && '↻ Convertible'}
                          {vendor.review.convincingStatus === 'not_convertible' && '✗ Not Conv.'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={vendor.restaurantStatus} />
                  </TableCell>
                  <TableCell>
                    {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(vendor.id)}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(vendor.id)}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={currentPage === pagination.pages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
