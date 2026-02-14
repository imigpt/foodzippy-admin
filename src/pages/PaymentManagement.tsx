import { useState, useEffect } from 'react';
import { RefreshCw, IndianRupee, Users, CheckCircle, Clock, Filter, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { api, Payment, AgentPaymentSummary } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function PaymentManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('by-agent');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Data
  const [agentSummaries, setAgentSummaries] = useState<AgentPaymentSummary[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({ pending: 0, paid: 0, pendingCount: 0, paidCount: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  // Dialog
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentPaymentSummary | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter, selectedMonth, selectedYear]);

  const getDateRange = () => {
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { startDate, endDate } = getDateRange();

      if (activeTab === 'by-agent') {
        const response = await api.getPaymentsByAgent({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          startDate,
          endDate,
        });
        if (response.success) {
          setAgentSummaries(response.agents);
        }
      } else {
        const response = await api.getPayments({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          startDate,
          endDate,
          page: pagination.page,
          limit: 50,
        });
        if (response.success) {
          setPayments(response.payments);
          setStats(response.stats);
          setPagination(response.pagination);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load payments',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedAgent) return;

    try {
      setIsPaying(true);
      const response = await api.markPaymentsAsPaid({ agentId: selectedAgent._id });
      if (response.success) {
        toast({
          title: 'Success',
          description: `${response.modifiedCount} payment(s) marked as paid`,
        });
        setIsPayDialogOpen(false);
        setSelectedAgent(null);
        loadData();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark payments as paid',
        variant: 'destructive',
      });
    } finally {
      setIsPaying(false);
    }
  };

  const openPayDialog = (agent: AgentPaymentSummary) => {
    setSelectedAgent(agent);
    setIsPayDialogOpen(true);
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      A: 'bg-yellow-100 text-yellow-800',
      B: 'bg-blue-100 text-blue-800',
      C: 'bg-green-100 text-green-800',
      D: 'bg-orange-100 text-orange-800',
    };
    return <Badge className={colors[category] || 'bg-gray-100 text-gray-800'}>{category}</Badge>;
  };

  const getPaymentTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      visit: 'Visit',
      followup: 'Follow-up',
      'visit-followup': 'Visit + Follow-up',
      onboarding: 'Onboarding',
      balance: 'Balance',
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals for by-agent view
  const totalPending = agentSummaries.reduce((sum, a) => sum + a.pendingAmount, 0);
  const totalPaid = agentSummaries.reduce((sum, a) => sum + a.paidAmount, 0);

  return (
    <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage agent/employee payments
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/payment-settings')}>
          <IndianRupee className="w-4 h-4 mr-2" />
          Payment Settings
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-yellow-100">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(activeTab === 'by-agent' ? totalPending : stats.pending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(activeTab === 'by-agent' ? totalPaid : stats.paid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-blue-100">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Agents</p>
                <p className="text-2xl font-bold">{agentSummaries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-purple-100">
                <IndianRupee className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(activeTab === 'by-agent' ? totalPending + totalPaid : stats.pending + stats.paid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>
                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2025, 2026, 2027].map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="by-agent">By Agent</TabsTrigger>
          <TabsTrigger value="all-payments">All Payments</TabsTrigger>
        </TabsList>

        {/* By Agent Tab */}
        <TabsContent value="by-agent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : agentSummaries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payment records found for this period
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead className="text-center">Vendors</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentSummaries.map((agent) => (
                      <TableRow key={agent._id}>
                        <TableCell className="font-medium">{agent.agentName}</TableCell>
                        <TableCell className="text-center">{agent.vendorCount}</TableCell>
                        <TableCell className="text-right text-yellow-600 font-medium">
                          {formatCurrency(agent.pendingAmount)}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(agent.paidAmount)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(agent.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/agent-payments/${agent._id}`)}
                              title="View payment details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {agent.pendingAmount > 0 && (
                              <Button
                                size="sm"
                                onClick={() => openPayDialog(agent)}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Payments Tab */}
        <TabsContent value="all-payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Payment Records</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payment records found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>{formatDate(payment.createdAt)}</TableCell>
                        <TableCell className="font-medium">{payment.agentName}</TableCell>
                        <TableCell>{payment.vendorName}</TableCell>
                        <TableCell>{getCategoryBadge(payment.category)}</TableCell>
                        <TableCell>{getPaymentTypeBadge(payment.paymentType)}</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.paymentStatus)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mark as Paid Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payments as Paid</DialogTitle>
            <DialogDescription>
              This will mark all pending payments for this agent as paid.
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="py-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p><strong>Agent:</strong> {selectedAgent.agentName}</p>
                <p><strong>Pending Amount:</strong> <span className="text-yellow-600 font-bold">{formatCurrency(selectedAgent.pendingAmount)}</span></p>
                <p><strong>Total Vendors:</strong> {selectedAgent.vendorCount}</p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Are you sure you want to mark all pending payments as paid?
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)} disabled={isPaying}>
              Cancel
            </Button>
            <Button onClick={handleMarkAsPaid} disabled={isPaying}>
              {isPaying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
