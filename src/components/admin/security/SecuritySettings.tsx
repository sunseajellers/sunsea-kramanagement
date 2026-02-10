'use client';

import { useState, useEffect } from 'react';
import { SecurityConfig } from '@/types';
import { getSecurityConfig, updateSecurityConfig } from '@/lib/securityService';
import { Button } from '@/components/ui/button';
import { Shield, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecuritySettings() {
    const [config, setConfig] = useState<SecurityConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newIp, setNewIp] = useState('');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        const data = await getSecurityConfig();
        if (data) {
            setConfig(data);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            await updateSecurityConfig(config);
            toast.success('Security settings updated');
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const addIp = () => {
        if (newIp && config) {
            setConfig({
                ...config,
                whitelistedIps: [...config.whitelistedIps, newIp]
            });
            setNewIp('');
        }
    };

    const removeIp = (ip: string) => {
        if (config) {
            setConfig({
                ...config,
                whitelistedIps: config.whitelistedIps.filter(i => i !== ip)
            });
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
    if (!config) return <div className="p-8">Failed to load settings</div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Security Configuration</h2>
                    <p className="text-slate-500">Manage access controls and system hardening policies</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="btn-primary">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* IP Whitelist Section */}
                <div className="glass-panel p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg">IP Whitelist</h3>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            checked={config.enforceIpWhitelist}
                            onChange={(e) => setConfig({ ...config, enforceIpWhitelist: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium">Enforce IP restrictions for Admin access</span>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newIp}
                            onChange={(e) => setNewIp(e.target.value)}
                            placeholder="Enter IP Address (e.g. 192.168.1.1)"
                            className="form-input flex-1"
                        />
                        <Button onClick={addIp} variant="outline" size="icon">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {config.whitelistedIps.length === 0 && (
                            <p className="text-sm text-slate-400 italic">No IPs whitelisted</p>
                        )}
                        {config.whitelistedIps.map(ip => (
                            <div key={ip} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                <span className="font-mono text-xs font-bold">{ip}</span>
                                <button onClick={() => removeIp(ip)} className="text-slate-400 hover:text-rose-500">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Password Policy Section */}
                <div className="glass-panel p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg">Password Policy</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">Minimum Length</label>
                            <input
                                type="number"
                                value={config.passwordPolicy.minLength}
                                onChange={(e) => setConfig({
                                    ...config,
                                    passwordPolicy: { ...config.passwordPolicy, minLength: parseInt(e.target.value) }
                                })}
                                className="form-input mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">Expiry (Days)</label>
                            <input
                                type="number"
                                value={config.passwordPolicy.expiryDays}
                                onChange={(e) => setConfig({
                                    ...config,
                                    passwordPolicy: { ...config.passwordPolicy, expiryDays: parseInt(e.target.value) }
                                })}
                                className="form-input mt-1"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                checked={config.passwordPolicy.requireSpecialChar}
                                onChange={(e) => setConfig({
                                    ...config,
                                    passwordPolicy: { ...config.passwordPolicy, requireSpecialChar: e.target.checked }
                                })}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">Require Special Characters</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
