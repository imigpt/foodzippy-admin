import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { api, normalizeVendors } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AllVendors() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, [search]);

  const loadVendors = async () => {
    try {
      setIsLoading(true);
      const params: any = { status: 'publish' };
      if (search) params.search = search;
      
      const response = await api.getVendors(params);
      setVendors(normalizeVendors(response.data));
    } catch (error) {
      console.error('Failed to load vendors:', error);
      setVendors([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Published Vendors</h1>
        <p className="text-muted-foreground">List of all published vendors</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Follow-Up Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="animate-pulse text-muted-foreground">Loading...</div>
                </TableCell>
              </TableRow>
            ) : vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No vendors found
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={vendor.restaurantImage}
                        alt={vendor.restaurantName}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <span className="font-medium">{vendor.restaurantName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{vendor.city}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <span className="text-secondary">★</span>
                      {vendor.rating}
                    </span>
                  </TableCell>
                  <TableCell>
                    {vendor.review?.followUpDate ? (
                      <span className="text-sm font-medium text-slate-700">
                        {new Date(vendor.review.followUpDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={vendor.restaurantStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/vendor/${vendor.id}`)}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/vendor/${vendor.id}/edit`)}
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
    </div>
  );
}
