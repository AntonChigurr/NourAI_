import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Clock,
  Truck,
  Star,
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

export default function AdminPharmacies() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    branch_name: '',
    address: '',
    emirate: '',
    phone: '',
    delivery_available: true,
    delivery_fee: 10,
    is_24_hours: false,
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: pharmacies = [], isLoading } = useQuery({
    queryKey: ['adminPharmacies'],
    queryFn: () => base44.entities.Pharmacy.filter({}),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Pharmacy.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPharmacies']);
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pharmacy.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPharmacies']);
      setShowDialog(false);
      setEditingPharmacy(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      branch_name: '',
      address: '',
      emirate: '',
      phone: '',
      delivery_available: true,
      delivery_fee: 10,
      is_24_hours: false,
      is_active: true
    });
  };

  const handleEdit = (pharmacy) => {
    setEditingPharmacy(pharmacy);
    setFormData(pharmacy);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingPharmacy) {
      updateMutation.mutate({ id: editingPharmacy.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredPharmacies = pharmacies.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.emirate?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pharmacies</h1>
            <p className="text-slate-500 mt-1">Manage pharmacy network</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setEditingPharmacy(null);
              setShowDialog(true);
            }}
            className="bg-[#1464F4]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Pharmacy
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pharmacies..."
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading pharmacies..." />
        ) : filteredPharmacies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No pharmacies"
            description="Add pharmacies to the network"
            action={() => setShowDialog(true)}
            actionLabel="Add Pharmacy"
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredPharmacies.map((pharmacy) => (
              <HealthCard key={pharmacy.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{pharmacy.name}</h3>
                    {pharmacy.branch_name && (
                      <p className="text-sm text-slate-500">{pharmacy.branch_name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      {pharmacy.emirate}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {pharmacy.is_24_hours && (
                        <Badge className="bg-emerald-100 text-emerald-700">24/7</Badge>
                      )}
                      {pharmacy.delivery_available && (
                        <Badge variant="outline">
                          <Truck className="w-3 h-3 mr-1" />
                          Delivery
                        </Badge>
                      )}
                      {!pharmacy.is_active && (
                        <Badge className="bg-red-100 text-red-700">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(pharmacy)}
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
            <DialogTitle>{editingPharmacy ? 'Edit' : 'Add'} Pharmacy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Pharmacy Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Life Pharmacy"
                />
              </div>
              <div>
                <Label className="mb-2 block">Branch Name</Label>
                <Input
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  placeholder="e.g., Dubai Mall"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Address *</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Emirate *</Label>
                <Input
                  value={formData.emirate}
                  onChange={(e) => setFormData({ ...formData, emirate: e.target.value })}
                  placeholder="e.g., Dubai"
                />
              </div>
              <div>
                <Label className="mb-2 block">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+971 4 XXX XXXX"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label>24/7 Operation</Label>
              <Switch
                checked={formData.is_24_hours}
                onCheckedChange={(checked) => setFormData({ ...formData, is_24_hours: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label>Delivery Available</Label>
              <Switch
                checked={formData.delivery_available}
                onCheckedChange={(checked) => setFormData({ ...formData, delivery_available: checked })}
              />
            </div>
            {formData.delivery_available && (
              <div>
                <Label className="mb-2 block">Delivery Fee (AED)</Label>
                <Input
                  type="number"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData({ ...formData, delivery_fee: parseFloat(e.target.value) })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.address || createMutation.isPending || updateMutation.isPending}
              className="bg-[#1464F4]"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingPharmacy ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}