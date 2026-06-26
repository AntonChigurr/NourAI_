import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Globe,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import HealthCard from '@/components/ui/HealthCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function AdminInsurance() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    phone: '',
    email: '',
    website: '',
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['adminInsurance'],
    queryFn: () => base44.entities.InsuranceProvider.filter({}),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InsuranceProvider.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminInsurance']);
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InsuranceProvider.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminInsurance']);
      setShowDialog(false);
      setEditingProvider(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      short_name: '',
      phone: '',
      email: '',
      website: '',
      is_active: true
    });
  };

  const handleEdit = (provider) => {
    setEditingProvider(provider);
    setFormData(provider);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredProviders = providers.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Insurance Providers</h1>
            <p className="text-slate-500 mt-1">Manage insurance network</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setEditingProvider(null);
              setShowDialog(true);
            }}
            className="bg-[#1464F4]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search providers..."
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading providers..." />
        ) : filteredProviders.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No insurance providers"
            description="Add insurance providers to the network"
            action={() => setShowDialog(true)}
            actionLabel="Add Provider"
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredProviders.map((provider) => (
              <HealthCard key={provider.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{provider.name}</h3>
                      {!provider.is_active && (
                        <Badge className="bg-red-100 text-red-700">Inactive</Badge>
                      )}
                    </div>
                    {provider.short_name && (
                      <p className="text-sm text-slate-500 mt-1">{provider.short_name}</p>
                    )}
                    <div className="space-y-1 mt-3 text-sm">
                      {provider.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3.5 h-3.5" />
                          {provider.phone}
                        </div>
                      )}
                      {provider.website && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Globe className="w-3.5 h-3.5" />
                          <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#1464F4]">
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(provider)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </HealthCard>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProvider ? 'Edit' : 'Add'} Insurance Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Provider Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Daman"
              />
            </div>
            <div>
              <Label className="mb-2 block">Short Name</Label>
              <Input
                value={formData.short_name}
                onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                placeholder="e.g., DAMAN"
              />
            </div>
            <div>
              <Label className="mb-2 block">Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+971 800 XXXXX"
              />
            </div>
            <div>
              <Label className="mb-2 block">Website</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
              className="bg-[#1464F4]"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingProvider ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}