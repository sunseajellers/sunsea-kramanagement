'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyResult } from '@/types';
import { updateKeyResultProgress } from '@/lib/okrService';
import { Loader2, Target } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    keyResult: KeyResult | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function KeyResultUpdate({ keyResult, isOpen, onClose, onSuccess }: Props) {
    const [newValue, setNewValue] = useState<string>('');
    const [updating, setUpdating] = useState(false);

    const handleSubmit = async () => {
        if (!keyResult || !newValue) return;

        setUpdating(true);
        try {
            await updateKeyResultProgress(keyResult.id, Number(newValue));
            toast.success('Key Result updated');
            onSuccess();
            onClose();
            setNewValue('');
        } catch (error) {
            toast.error('Failed to update progress');
        } finally {
            setUpdating(false);
        }
    };

    if (!keyResult) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Key Result</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-start gap-3">
                            <Target className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">{keyResult.title}</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    Current: <span className="font-bold text-slate-700">{keyResult.currentValue} / {keyResult.targetValue}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">New Value</label>
                        <Input
                            type="number"
                            placeholder={`Enter value (Target: ${keyResult.targetValue})`}
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={updating}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={updating} className="btn-primary">
                        {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Update Progress
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
