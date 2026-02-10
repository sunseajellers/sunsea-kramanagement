'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SaleItem } from '@/types';
import { createQuote } from '@/lib/salesService';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function QuoteGenerator({ isOpen, onClose, onSuccess }: Props) {
    const [customerName, setCustomerName] = useState('');
    const [items, setItems] = useState<SaleItem[]>([
        { id: '1', description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
    ]);
    const [expiryDate, setExpiryDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const updateItem = (id: string, field: keyof SaleItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updated.totalPrice = Number(updated.quantity) * Number(updated.unitPrice);
                }
                return updated;
            }
            return item;
        }));
    };

    const addItem = () => {
        setItems([...items, {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0
        }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.totalPrice, 0);
    };

    const handleSubmit = async () => {
        if (!customerName || !expiryDate) {
            toast.error('Please fill in customer details and expiry date');
            return;
        }

        setSubmitting(true);
        try {
            const total = calculateTotal();
            await createQuote({
                customerName,
                // In a real app, this would link to an actual customer ID
                customerId: 'guest',
                items,
                subtotal: total,
                tax: total * 0.1, // Moving to % based later
                totalAmount: total * 1.1,
                status: 'draft',
                expiryDate: new Date(expiryDate),
                createdBy: 'current-user-id'
            } as any); // Type casting for expediency in this step

            toast.success('Quote created successfully');
            onSuccess();
            onClose();

            // Reset form
            setCustomerName('');
            setItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
        } catch (error) {
            toast.error('Failed to create quote');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Generate New Quote</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Customer Name</label>
                            <Input
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Enter customer or company name"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Valid Until</label>
                            <Input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Line Items</label>
                            <Button size="sm" variant="ghost" onClick={addItem} className="text-primary text-xs font-bold">
                                <Plus className="w-3 h-3 mr-1" /> Add Item
                            </Button>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex gap-2 items-start">
                                    <span className="text-slate-400 text-xs mt-3 w-4">{index + 1}.</span>
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Description"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-20">
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            placeholder="Price"
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="w-24 pt-2 text-right font-bold text-slate-700">
                                        ${item.totalPrice.toFixed(2)}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-rose-500"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <div className="w-48 space-y-2">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Subtotal:</span>
                                <span>${calculateTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Tax (10%):</span>
                                <span>${(calculateTotal() * 0.1).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
                                <span>Total:</span>
                                <span>${(calculateTotal() * 1.1).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Generate Quote
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
