import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pill,
  Search,
  MapPin,
  Clock,
  Star,
  Truck,
  ShoppingCart,
  Plus,
  Minus,
  X,
  FileText,
  Building2,
  Phone,
  Upload,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import HealthCard from '@/components/ui/HealthCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

const sampleMedicines = [
  { id: '1', name: 'Panadol Extra', generic: 'Paracetamol + Caffeine', price: 15, category: 'Pain Relief', prescription_required: false, stock: 150 },
  { id: '2', name: 'Augmentin 625mg', generic: 'Amoxicillin + Clavulanate', price: 45, category: 'Antibiotics', prescription_required: true, stock: 80 },
  { id: '3', name: 'Nexium 40mg', generic: 'Esomeprazole', price: 85, category: 'Digestive', prescription_required: true, stock: 45 },
  { id: '4', name: 'Ventolin Inhaler', generic: 'Salbutamol', price: 35, category: 'Respiratory', prescription_required: true, stock: 60 },
  { id: '5', name: 'Voltaren Gel', generic: 'Diclofenac', price: 28, category: 'Pain Relief', prescription_required: false, stock: 120 },
  { id: '6', name: 'Centrum Multivitamin', generic: 'Multivitamin', price: 55, category: 'Vitamins', prescription_required: false, stock: 200 },
  { id: '7', name: 'Lipitor 20mg', generic: 'Atorvastatin', price: 95, category: 'Cardiovascular', prescription_required: true, stock: 70 },
  { id: '8', name: 'Omeprazole 20mg', generic: 'Omeprazole', price: 35, category: 'Digestive', prescription_required: false, stock: 100 },
  { id: '9', name: 'Claritin', generic: 'Loratadine', price: 25, category: 'Allergy', prescription_required: false, stock: 140 },
  { id: '10', name: 'Aspirin 100mg', generic: 'Acetylsalicylic Acid', price: 12, category: 'Cardiovascular', prescription_required: false, stock: 250 },
];

export default function PharmacyDetail() {
  const [searchParams] = useSearchParams();
  const pharmacyId = searchParams.get('id');
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const patients = await base44.entities.Patient.filter({ created_by: userData.email });
      if (patients[0]) {
        setPatient(patients[0]);
        setDeliveryAddress(patients[0].address || '');
      }
    } catch (e) {}
  };

  const { data: pharmacy, isLoading: pharmacyLoading } = useQuery({
    queryKey: ['pharmacy', pharmacyId],
    queryFn: async () => {
      const pharmacies = await base44.entities.Pharmacy.filter({ id: pharmacyId });
      return pharmacies[0];
    },
    enabled: !!pharmacyId,
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ['activePrescriptions', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.Prescription.filter(
        { patient_id: patient.id, status: 'active' },
        '-issue_date'
      );
    },
    enabled: !!patient?.id,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      return base44.entities.PharmacyOrder.create(orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pharmacyOrders']);
      setCart([]);
      setShowCheckoutDialog(false);
      toast.success('Order placed successfully!');
    },
  });

  const handlePrescriptionUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPrescription(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPrescriptionFile(file_url);
      toast.success('Prescription uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload prescription');
    }
    setUploadingPrescription(false);
  };

  const addToCart = (medicine) => {
    const existing = cart.find(item => item.id === medicine.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === medicine.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }
    toast.success(`${medicine.name} added to cart`);
  };

  const updateQuantity = (medicineId, delta) => {
    setCart(cart.map(item => {
      if (item.id === medicineId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter(item => item.id !== medicineId));
    toast.success('Item removed from cart');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = deliveryType === 'delivery' ? (pharmacy?.delivery_fee || 10) : 0;

  const handleCheckout = () => {
    if (cart.length === 0 || !patient || !pharmacy) return;

    const hasPrescriptionItems = cart.some(item => item.prescription_required);
    
    if (hasPrescriptionItems && !selectedPrescription && !prescriptionFile) {
      toast.error('Please provide a prescription for prescription items');
      return;
    }

    createOrderMutation.mutate({
      patient_id: patient.id,
      pharmacy_id: pharmacy.id,
      prescription_id: selectedPrescription?.id || null,
      order_number: `ORD-${Date.now()}`,
      status: 'pending',
      items: cart.map(item => ({
        medicine_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        is_prescription_required: item.prescription_required,
        availability_status: 'available'
      })),
      subtotal: cartTotal,
      delivery_fee: deliveryFee,
      total_amount: cartTotal + deliveryFee,
      delivery_type: deliveryType,
      delivery_address: deliveryType === 'delivery' ? deliveryAddress : null,
      payment_method: 'card',
      payment_status: 'pending',
      notes: prescriptionFile ? `Prescription uploaded: ${prescriptionFile}` : null
    });
  };

  const filteredMedicines = sampleMedicines.filter(med => {
    if (selectedCategory !== 'all' && med.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return med.name.toLowerCase().includes(query) || 
             med.generic.toLowerCase().includes(query);
    }
    return true;
  });

  const categories = [...new Set(sampleMedicines.map(m => m.category))];

  if (pharmacyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading pharmacy..." />
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Pharmacy not found</p>
          <Link to={createPageUrl('Pharmacy')}>
            <Button className="mt-4">Back to Pharmacies</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link to={createPageUrl('Pharmacy')}>
            <Button variant="ghost" size="sm" className="mb-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pharmacies
            </Button>
          </Link>
          
          <HealthCard className="mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900">{pharmacy.name}</h1>
                {pharmacy.branch_name && (
                  <p className="text-slate-500">{pharmacy.branch_name}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="flex items-center gap-1 text-sm text-slate-600">
                    <MapPin className="w-4 h-4" />
                    {pharmacy.address}
                  </span>
                  {pharmacy.is_24_hours && (
                    <Badge className="bg-emerald-100 text-emerald-700">24/7 Open</Badge>
                  )}
                  {pharmacy.delivery_available && (
                    <Badge variant="outline">
                      <Truck className="w-3 h-3 mr-1" />
                      Delivery Available
                    </Badge>
                  )}
                  {pharmacy.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium">{pharmacy.rating}</span>
                    </span>
                  )}
                </div>
                {pharmacy.phone && (
                  <a href={`tel:${pharmacy.phone}`} className="flex items-center gap-2 mt-3 text-sm text-[#1464F4]">
                    <Phone className="w-4 h-4" />
                    {pharmacy.phone}
                  </a>
                )}
              </div>
            </div>
          </HealthCard>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search available medicines..."
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Medicines Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredMedicines.map((medicine) => (
            <HealthCard key={medicine.id}>
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Pill className="w-8 h-8 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{medicine.name}</h3>
                  <p className="text-sm text-slate-500">{medicine.generic}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{medicine.category}</Badge>
                    {medicine.prescription_required && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs">Rx Required</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">In stock: {medicine.stock}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-bold text-lg text-slate-900">AED {medicine.price}</p>
                <Button
                  size="sm"
                  onClick={() => addToCart(medicine)}
                  className="bg-[#1464F4] hover:bg-[#0D4ED8]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </HealthCard>
          ))}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <HealthCard className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 shadow-xl z-40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Cart ({cart.length} items)</h3>
              <Button
                size="sm"
                onClick={() => setShowCheckoutDialog(true)}
                className="bg-[#1464F4] hover:bg-[#0D4ED8]"
              >
                Checkout • AED {cartTotal + deliveryFee}
              </Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="flex-1 truncate">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </HealthCard>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Prescription Options */}
            {cart.some(item => item.prescription_required) && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm font-medium text-amber-900 mb-3">
                  Prescription Required
                </p>
                
                {prescriptions.length > 0 && (
                  <div className="mb-3">
                    <Label className="text-sm mb-2 block">Use Existing Prescription</Label>
                    <Select
                      value={selectedPrescription?.id || ''}
                      onValueChange={(id) => setSelectedPrescription(prescriptions.find(p => p.id === id))}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select prescription" />
                      </SelectTrigger>
                      <SelectContent>
                        {prescriptions.map((rx) => (
                          <SelectItem key={rx.id} value={rx.id}>
                            {rx.prescription_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm mb-2 block">Or Upload New Prescription</Label>
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 text-center hover:bg-amber-100 transition">
                      {prescriptionFile ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-600">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm font-medium">Prescription Uploaded</span>
                        </div>
                      ) : uploadingPrescription ? (
                        <LoadingSpinner size="sm" text="Uploading..." />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                          <p className="text-sm text-amber-900">Click to upload prescription</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handlePrescriptionUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Delivery Options */}
            <div>
              <Label className="mb-2 block">Delivery Option</Label>
              <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex items-center gap-2 flex-1 cursor-pointer">
                    <Truck className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="font-medium">Home Delivery</p>
                      <p className="text-xs text-slate-500">AED {pharmacy?.delivery_fee || 10}</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex items-center gap-2 flex-1 cursor-pointer">
                    <Building2 className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="font-medium">Store Pickup</p>
                      <p className="text-xs text-slate-500">Free</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {deliveryType === 'delivery' && (
              <div>
                <Label className="mb-2 block">Delivery Address</Label>
                <Textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your delivery address..."
                  rows={3}
                />
              </div>
            )}

            {/* Order Summary */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-medium mb-3">Order Summary</h4>
              <div className="space-y-2 text-sm">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-slate-600">{item.name} x{item.quantity}</span>
                    <span className="font-medium">AED {item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <p className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span>AED {cartTotal}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Delivery</span>
                    <span>AED {deliveryFee}</span>
                  </p>
                  <p className="flex justify-between font-bold text-lg mt-2">
                    <span>Total</span>
                    <span>AED {cartTotal + deliveryFee}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={createOrderMutation.isPending || (deliveryType === 'delivery' && !deliveryAddress)}
              className="bg-[#1464F4] hover:bg-[#0D4ED8]"
            >
              {createOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}