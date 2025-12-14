'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Shield, Calendar, Save, Edit3, Camera, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getInitials, getAvatarColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, userData, loading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        fullName: userData?.fullName || '',
        email: userData?.email || '',
        bio: '',
        phone: '',
        department: ''
    });

    useEffect(() => {
        if (userData) {
            setProfileData({
                fullName: userData.fullName || '',
                email: userData.email || '',
                bio: (userData as any).bio || '',
                phone: (userData as any).phone || '',
                department: (userData as any).department || ''
            });
        }
    }, [userData]);

    const handleSave = async () => {
        if (!user || !userData) return;

        setSaving(true);
        try {
            // Update Firebase Auth profile
            await updateProfile(user, {
                displayName: profileData.fullName
            });

            // Update Firestore document
            await updateDoc(doc(db, 'users', user.uid), {
                fullName: profileData.fullName,
                bio: profileData.bio,
                phone: profileData.phone,
                department: profileData.department,
                updatedAt: new Date()
            });

            toast.success('Profile updated successfully!');
            setIsEditing(false);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                </div>
                <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "outline" : "default"}
                >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="lg:col-span-1">
                    <CardHeader className="text-center">
                        <div className="relative inline-block">
                            <div className={`w-24 h-24 bg-gradient-to-br ${getAvatarColor(userData?.fullName || '')} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg`}>
                                {getInitials(userData?.fullName || '')}
                            </div>
                            {isEditing && (
                                <button className="absolute -bottom-1 -right-1 bg-primary-600 text-white rounded-full p-2 shadow-lg hover:bg-primary-700 transition-colors">
                                    <Camera className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="mt-4">
                            <h3 className="text-xl font-semibold text-gray-900">{userData?.fullName}</h3>
                            <p className="text-gray-500">{userData?.email}</p>
                            <div className="mt-2">
                                <Badge variant="secondary" className="capitalize">
                                    Admin
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Member since {new Date((userData as any)?.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Shield className="h-4 w-4" />
                            <span>Team Member</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Form */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                </label>
                                <Input
                                    value={profileData.fullName}
                                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <Input
                                    value={profileData.email}
                                    disabled
                                    className="w-full bg-gray-50"
                                />
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <Input
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    disabled={!isEditing}
                                    placeholder="+1 (555) 123-4567"
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department
                                </label>
                                <Input
                                    value={profileData.department}
                                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                                    disabled={!isEditing}
                                    placeholder="Engineering, Marketing, etc."
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bio
                            </label>
                            <textarea
                                value={profileData.bio}
                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                disabled={!isEditing}
                                placeholder="Tell us about yourself..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                            />
                        </div>

                        {isEditing && (
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="min-w-[100px]"
                                >
                                    {saving ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Saving...
                                        </div>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Security Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security & Privacy
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-900">Password</h4>
                            <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                        </div>
                        <Button variant="outline" size="sm">
                            Change Password
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                            <p className="text-sm text-gray-500">Add an extra layer of security</p>
                        </div>
                        <Badge variant="outline">Not Enabled</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}