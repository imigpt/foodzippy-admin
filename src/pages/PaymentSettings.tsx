import { useState, useEffect } from 'react';
import { Save, RefreshCw, IndianRupee, Building2, Star, Home, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api, PaymentConfig } from '@/lib/api';

interface CategoryRates {
  visit: number;
  followup: number;
  onboarding: number;
}

const categoryInfo = {
  A: {
    title: 'Category A',
    description: '5/4/3 Star Hotels, Top Restaurants, Top DineIns, Top Bakers, Top Sweet Shops, Top Confectioneries',
    icon: Star,
    color: 'bg-yellow-500',
  },
  B: {
    title: 'Category B',
    description: 'Premium Hotels (non 5-4-3-star), Top B-class DineIns, Confectioneries, Sweet Shops, Restaurants, Cloud Kitchens',
    icon: Building2,
    color: 'bg-blue-500',
  },
  C: {
    title: 'Category C',
    description: 'All vendors except A & B class, Local Cloud Kitchens',
    icon: Home,
    color: 'bg-green-500',
  },
  D: {
    title: 'Category D',
    description: 'All Local Street Vendors and Small Vendors',
    icon: Store,
    color: 'bg-orange-500',
  },
};

export default function PaymentSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<PaymentConfig>({
    categoryA: { visit: 70, followup: 70, onboarding: 700 },
    categoryB: { visit: 50, followup: 50, onboarding: 500 },
    categoryC: { visit: 35, followup: 35, onboarding: 350 },
    categoryD: { visit: 20, followup: 20, onboarding: 200 },
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPaymentConfig();
      if (response.success && response.config) {
        setConfig(response.config);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load payment config',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await api.updatePaymentConfig(config);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Payment settings saved successfully',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payment config',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateCategoryRate = (
    category: 'categoryA' | 'categoryB' | 'categoryC' | 'categoryD',
    field: keyof CategoryRates,
    value: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const renderCategoryCard = (
    categoryKey: 'A' | 'B' | 'C' | 'D',
    configKey: 'categoryA' | 'categoryB' | 'categoryC' | 'categoryD'
  ) => {
    const info = categoryInfo[categoryKey];
    const rates = config[configKey];
    const Icon = info.icon;

    return (
      <Card key={categoryKey} className="relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${info.color}`} />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${info.color} text-white`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{info.title}</CardTitle>
              <CardDescription className="text-xs mt-1">{info.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${categoryKey}-visit`} className="text-sm">
                Visit Charge
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id={`${categoryKey}-visit`}
                  type="number"
                  value={rates.visit}
                  onChange={(e) => updateCategoryRate(configKey, 'visit', Number(e.target.value))}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${categoryKey}-followup`} className="text-sm">
                Follow-up Charge
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id={`${categoryKey}-followup`}
                  type="number"
                  value={rates.followup}
                  onChange={(e) => updateCategoryRate(configKey, 'followup', Number(e.target.value))}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${categoryKey}-onboarding`} className="text-sm">
                Onboarding (Max)
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id={`${categoryKey}-onboarding`}
                  type="number"
                  value={rates.onboarding}
                  onChange={(e) => updateCategoryRate(configKey, 'onboarding', Number(e.target.value))}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Payment Logic:</strong> Visit + Follow-up = ₹{rates.visit + rates.followup} | 
              If Onboarded = ₹{rates.onboarding} (total, includes visit & follow-up)
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-gray-300 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Payment Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure payment rates for agent/employee vendor visits
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Payment Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">Payment Calculation Rules:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>First Visit Only (Rejected):</strong> Agent receives Visit charge</li>
          <li>• <strong>Visit + Follow-up Scheduled:</strong> Agent receives Visit + Follow-up charges immediately</li>
          <li>• <strong>Successful Onboarding:</strong> Agent receives Onboarding amount (maximum payment, includes visit & follow-up)</li>
          <li>• <strong>2nd Follow-up:</strong> No additional payment</li>
        </ul>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderCategoryCard('A', 'categoryA')}
        {renderCategoryCard('B', 'categoryB')}
        {renderCategoryCard('C', 'categoryC')}
        {renderCategoryCard('D', 'categoryD')}
      </div>

      {/* Last Updated */}
      {config.updatedAt && (
        <div className="mt-6 text-sm text-muted-foreground text-right">
          Last updated: {new Date(config.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
