import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Pill,
  Search,
  MapPin,
  Clock,
  Star,
  Truck,
  CreditCard,
  ShoppingCart,
  Plus,
  Minus,
  X,
  FileText,
  Package,
  CheckCircle2,
  Building2,
  Phone,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import HealthCard from '@/components/ui/HealthCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

// Sample medicines data (in production, this would come from a backend)
const sampleMedicines = [
  { id: '1', name: 'Panadol Extra', generic: 'Paracetamol + Caffeine', price: 15, image: '', category: 'Pain Relief', prescription_required: false },
  { id: '2', name: 'Augmentin 625mg', generic: 'Amoxicillin + Clavulanate', price: 45, image: '', category: 'Antibiotics', prescription_required: true },
  { id: '3', name: 'Nexium 40mg', generic: 'Esomeprazole', price: 85, image: '', category: 'Digestive', prescription_required: true },
  { id: '4', name: 'Ventolin Inhaler', generic: 'Salbutamol', price: 35, image: '', category: 'Respiratory', prescription_required: true },
  { id: '5', name: 'Voltaren Gel', generic: 'Diclofenac', price: 28, image: '', category: 'Pain Relief', prescription_required: false },
  { id: '6', name: 'Centrum Multivitamin', generic: 'Multivitamin', price: 55, image: '', category: 'Vitamins', prescription_required: false },
];

export default function Pharmacy() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
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

  const { data: pharmacies = [], isLoading: pharmaciesLoading } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: () => base44.entities.Pharmacy.filter({ is_active: true }),
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

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['pharmacyOrders', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.PharmacyOrder.filter(
        { patient_id: patient.id },
        '-created_date',
        10
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
    },
  });

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
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter(item => item.id !== medicineId));
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

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = deliveryType === 'delivery' ? (selectedPharmacy?.delivery_fee || 10) : 0;

  const handleCheckout = () => {
    if (!selectedPharmacy || cart.length === 0 || !patient) return;

    const hasPrescriptionItems = cart.some(item => item.prescription_required);
    
    createOrderMutation.mutate({
      patient_id: patient.id,
      pharmacy_id: selectedPharmacy.id,
      prescription_id: hasPrescriptionItems ? selectedPrescription?.id : null,
      order_number: `ORD-${Date.now()}`,
      status: 'pending',
      items: cart.map(item => ({
        medicine_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        is_prescription_required: item.prescription_required
      })),
      subtotal: cartTotal,
      delivery_fee: deliveryFee,
      total_amount: cartTotal + deliveryFee,
      delivery_type: deliveryType,
      delivery_address: deliveryType === 'delivery' ? deliveryAddress : null,
      payment_method: 'card',
      payment_status: 'pending'
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

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Smart Pharmacy</h1>
            <p className="text-slate-500 mt-1">Order medicines and health products</p>
          </div>
          <Button
            onClick={() => setIsCartOpen(true)}
            variant="outline"
            className="relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#1464F4] text-white text-xs rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Button>
        </div>

        {/* Active Prescriptions */}
        {prescriptions.length > 0 && (
          <HealthCard className="mb-6 bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-rose-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Active Prescriptions</h3>
                <p className="text-sm text-slate-600 mt-1">
                  You have {prescriptions.length} active prescription(s). Order your prescribed medicines easily.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {prescriptions.slice(0, 2).map((rx) => (
                    <Badge key={rx.id} variant="outline" className="text-rose-700 border-rose-200 bg-white">
                      {rx.prescription_number} • {rx.medications?.length || 0} items
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </HealthCard>
        )}

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            {/* Search & Filter */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search medicines..."
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          <Badge className="bg-amber-100 text-amber-700 text-xs">Rx</Badge>
                        )}
                      </div>
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
          </TabsContent>

          <TabsContent value="pharmacies">
            {pharmaciesLoading ? (
              <LoadingSpinner size="lg" text="Loading pharmacies..." />
            ) : pharmacies.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No pharmacies available"
                description="Pharmacies will appear here once added"
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {pharmacies.map((pharmacy) => (
                  <Link key={pharmacy.id} to={createPageUrl(`PharmacyDetail?id=${pharmacy.id}`)}>
                    <HealthCard className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{pharmacy.name}</h3>
                          {pharmacy.branch_name && (
                            <p className="text-sm text-slate-500">{pharmacy.branch_name}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {pharmacy.emirate}
                            </span>
                            {pharmacy.is_24_hours && (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">24/7</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            {pharmacy.delivery_available && (
                              <span className="flex items-center gap-1 text-sm text-slate-500">
                                <Truck className="w-4 h-4" />
                                AED {pharmacy.delivery_fee} delivery
                              </span>
                            )}
                            {pharmacy.rating && (
                              <span className="flex items-center gap-1 text-sm">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                {pharmacy.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </HealthCard>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            {ordersLoading ? (
              <LoadingSpinner size="lg" text="Loading orders..." />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No orders yet"
                description="Your order history will appear here"
              />
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <HealthCard key={order.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{order.order_number}</h3>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {format(new Date(order.created_date), 'MMM d, yyyy')} • {order.items?.length || 0} items
                        </p>
                      </div>
                      <p className="font-bold text-slate-900">AED {order.total_amount}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <Badge key={idx} variant="outline">{item.medicine_name}</Badge>
                      ))}
                      {order.items?.length > 3 && (
                        <Badge variant="outline">+{order.items.length - 3} more</Badge>
                      )}
                    </div>
                  </HealthCard>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Shopping Cart ({cart.length})</SheetTitle>
          </SheetHeader>
          
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <ShoppingCart className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-500">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto py-4 space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                      <Pill className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-sm text-slate-500">AED {item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-slate-400"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span>AED {cartTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Delivery</span>
                  <span>AED {deliveryFee}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>AED {cartTotal + deliveryFee}</span>
                </div>
                <Button
                  className="w-full bg-[#1464F4] hover:bg-[#0D4ED8]"
                  onClick={() => {
                    setIsCartOpen(false);
                    setShowCheckoutDialog(true);
                  }}
                  disabled={!selectedPharmacy}
                >
                  {selectedPharmacy ? 'Proceed to Checkout' : 'Select a Pharmacy First'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Delivery Option</Label>
              <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Home Delivery (AED {selectedPharmacy?.delivery_fee || 10})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Store Pickup (Free)
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

            {cart.some(item => item.prescription_required) && prescriptions.length > 0 && (
              <div>
                <Label className="mb-2 block">Link Prescription</Label>
                <Select
                  value={selectedPrescription?.id || ''}
                  onValueChange={(id) => setSelectedPrescription(prescriptions.find(p => p.id === id))}
                >
                  <SelectTrigger>
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

            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-medium mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <p className="flex justify-between">
                  <span className="text-slate-500">Items ({cart.length})</span>
                  <span>AED {cartTotal}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Delivery</span>
                  <span>AED {deliveryType === 'delivery' ? (selectedPharmacy?.delivery_fee || 10) : 0}</span>
                </p>
                <div className="border-t border-slate-200 mt-2 pt-2">
                  <p className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>AED {cartTotal + (deliveryType === 'delivery' ? (selectedPharmacy?.delivery_fee || 10) : 0)}</span>
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