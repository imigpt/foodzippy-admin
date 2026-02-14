import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  User, 
  Phone, 
  Mail, 
  IndianRupee, 
  CheckCircle, 
  Clock, 
  Store, 
  TrendingUp, 
  Calendar,
  FileText,
  Filter,
  Pencil,
  Trash2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, Payment, PaymentConfig } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AgentInfo {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  isActive: boolean;
  agentType?: string;
}

interface PaymentStats {
  total: number;
  pending: number;
  paid: number;
  totalVendors: number;
  paymentCounts: {
    visit: number;
    followup: number;
    onboarding: number;
    balance: number;
  };
  vendorCounts: {
    visited: number;
    onboarded: number;
    rejected: number;
    followup: number;
  };
}

export default function AgentPaymentDetails() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [editForm, setEditForm] = useState({
    category: '',
    paymentType: '',
    amount: 0,
    paymentStatus: 'pending'
  });

  useEffect(() => {
    if (agentId) {
      loadAgentPaymentDetails();
    }
  }, [agentId]);

  const loadAgentPaymentDetails = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAgentPaymentDetails(agentId!);
      if (data.success) {
        setAgent(data.agent);
        setPayments(data.payments);
        setStats(data.stats);
        setPaymentConfig(data.paymentConfig);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load agent payment details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllPaid = async () => {
    try {
      setIsProcessing(true);
      const result = await api.markPaymentsAsPaid({ agentId: agentId! });
      if (result.success) {
        toast({
          title: 'Success',
          description: `${result.modifiedCount} payment(s) marked as paid`,
        });
        setIsPayDialogOpen(false);
        loadAgentPaymentDetails();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark payments as paid',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditPayment = async () => {
    if (!selectedPayment) return;

    try {
      setIsProcessing(true);
      const result = await api.updatePayment(selectedPayment._id, editForm);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Payment record updated successfully',
        });
        setIsEditDialogOpen(false);
        setSelectedPayment(null);
        loadAgentPaymentDetails();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment record',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    try {
      setIsProcessing(true);
      const result = await api.deletePayment(selectedPayment._id);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Payment record deleted successfully',
        });
        setIsDeleteDialogOpen(false);
        setSelectedPayment(null);
        loadAgentPaymentDetails();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete payment record',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    if (statusFilter === 'all') return true;
    return p.paymentStatus === statusFilter;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPaymentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      visit: 'bg-blue-100 text-blue-800',
      followup: 'bg-purple-100 text-purple-800',
      onboarding: 'bg-green-100 text-green-800',
      balance: 'bg-yellow-100 text-yellow-800',
    };
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-gray-300 p-6 lg:p-8 min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12 bg-gray-300 p-6 lg:p-8 min-h-screen">
        <p className="text-muted-foreground">Agent not found</p>
        <Button variant="outline" onClick={() => navigate('/payments')} className="mt-4">
          Back to Payments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/payments')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Employee Payment Details</h1>
          <p className="text-muted-foreground">View and manage payment information</p>
        </div>
      </div>

      {/* Agent Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={agent.profileImage} alt={agent.name} />
              <AvatarFallback className="text-2xl">
                {agent.name?.charAt(0)?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{agent.name}</h2>
                <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                  {agent.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {agent.agentType && (
                  <Badge variant="outline">{agent.agentType}</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {agent.email || 'No email'}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {agent.phone || 'No phone'}
                </span>
              </div>
            </div>
            {stats && stats.pending > 0 && (
              <Button onClick={() => setIsPayDialogOpen(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Pay All Pending (₹{stats.pending.toLocaleString()})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-6 bg-blue-100 rounded-lg">
                  <IndianRupee className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                  <p className="text-2xl font-bold">₹{stats.total.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-yellow-100 rounded-lg">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">₹{stats.pending.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-green-100 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Paid</p>
                  <p className="text-2xl font-bold text-green-600">₹{stats.paid.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-100 rounded-lg">
                  <Store className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vendors</p>
                  <p className="text-2xl font-bold">{stats.totalVendors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Rate Card (Reference) */}
      {paymentConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Task Salary Rates
            </CardTitle>
            <CardDescription>
              Current payment rates for vendor tasks. <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/payment-settings')}>Edit rates</Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['A', 'B', 'C', 'D'].map((cat) => {
                const rates = paymentConfig.categories?.[cat as 'A' | 'B' | 'C' | 'D'];
                if (!rates) return null;
                return (
                  <div key={cat} className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Category {cat}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Visit:</span>
                        <span>₹{rates.visit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Follow-up:</span>
                        <span>₹{rates.followup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Onboarding:</span>
                        <span>₹{rates.onboarding}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-8 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{stats.paymentCounts.visit}</p>
                <p className="text-sm text-muted-foreground mt-2">Visits Paid</p>
              </div>
              <div className="text-center p-8 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{stats.paymentCounts.followup}</p>
                <p className="text-sm text-muted-foreground mt-2">Follow-ups Paid</p>
              </div>
              <div className="text-center p-8 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{stats.paymentCounts.onboarding}</p>
                <p className="text-sm text-muted-foreground mt-2">Onboardings</p>
              </div>
              <div className="text-center p-8 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">{stats.vendorCounts.onboarded}</p>
                <p className="text-sm text-muted-foreground mt-2">Vendors Onboarded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>All payment records for this employee</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment records found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.vendorName}</p>
                        <p className="text-xs text-muted-foreground">{payment.visitStatus}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.category}</Badge>
                    </TableCell>
                    <TableCell>{getPaymentTypeBadge(payment.paymentType)}</TableCell>
                    <TableCell className="font-medium">₹{payment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div>
                        {getStatusBadge(payment.paymentStatus)}
                        {payment.paidDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Paid on {formatDate(payment.paidDate)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setEditForm({
                              category: payment.category,
                              paymentType: payment.paymentType,
                              amount: payment.amount,
                              paymentStatus: payment.paymentStatus
                            });
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pay Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark all pending payments as paid for {agent.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-muted-foreground">Total Pending Amount:</span>
              <span className="text-2xl font-bold text-green-600">₹{stats?.pending.toLocaleString()}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkAllPaid} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment Record</DialogTitle>
            <DialogDescription>
              Update payment details for {selectedPayment?.vendorName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm({ ...editForm, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Category A</SelectItem>
                  <SelectItem value="B">Category B</SelectItem>
                  <SelectItem value="C">Category C</SelectItem>
                  <SelectItem value="D">Category D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select
                value={editForm.paymentType}
                onValueChange={(value) => setEditForm({ ...editForm, paymentType: value })}
              >
                <SelectTrigger id="paymentType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visit">Visit</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="visit-followup">Visit + Follow-up</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="balance">Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                value={editForm.paymentStatus}
                onValueChange={(value) => setEditForm({ ...editForm, paymentStatus: value })}
              >
                <SelectTrigger id="paymentStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditPayment} disabled={isProcessing}>
              {isProcessing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-red-50 rounded-lg space-y-2">
              <p><strong>Vendor:</strong> {selectedPayment?.vendorName}</p>
              <p><strong>Amount:</strong> ₹{selectedPayment?.amount.toLocaleString()}</p>
              <p><strong>Type:</strong> {selectedPayment?.paymentType}</p>
              <p><strong>Status:</strong> {selectedPayment?.paymentStatus}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePayment} disabled={isProcessing}>
              {isProcessing ? 'Deleting...' : 'Delete Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
