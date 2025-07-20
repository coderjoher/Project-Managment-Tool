import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Globe,
  Camera,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Key,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from '@/components/theme/ThemeProvider';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: 'MANAGER' | 'FREELANCER';
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
  company?: string;
  website?: string;
  skills?: string[];
  experience?: string;
  createdAt?: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  projectUpdates: boolean;
  messageAlerts: boolean;
  language: string;
  timezone: string;
}

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    projectUpdates: true,
    messageAlerts: true,
    language: 'en',
    timezone: 'UTC'
  });
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    location: '',
    company: '',
    website: '',
    skills: '',
    experience: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setUserProfile(data);
      setProfileForm({
        name: data.name || '',
        phone: data.phone || '',
        location: data.location || '',
        company: data.company || '',
        website: data.website || '',
        skills: data.skills ? data.skills.join(', ') : '',
        experience: data.experience || ''
      });
      
      // Set theme from preferences
      if (data.theme) {
        setPreferences(prev => ({ ...prev, theme: data.theme }));
      }
      
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const skills = profileForm.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const { error } = await supabase
        .from('User')
        .update({
          name: profileForm.name || null,
          phone: profileForm.phone || null,
          location: profileForm.location || null,
          company: profileForm.company || null,
          website: profileForm.website || null,
          skills: skills.length > 0 ? skills : null,
          experience: profileForm.experience || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      fetchUserProfile();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('User')
        .update({
          theme: preferences.theme,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Apply theme change immediately
      setTheme(preferences.theme);

      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving preferences",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-lg">Loading settings...</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <MainLayout userProfile={userProfile}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="hover:bg-white/80 dark:hover:bg-slate-800/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-purple-700 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-slate-600 dark:text-slate-400">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Tabs */}
          <Card className="lg:col-span-1 h-fit bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <>
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal information and professional details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={userProfile?.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xl">
                          {userProfile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                           userProfile?.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" className="mb-2">
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          JPG, PNG or GIF (max. 5MB)
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          value={userProfile?.email || ''}
                          disabled
                          className="bg-slate-50 dark:bg-slate-800 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileForm.location}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Professional Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            value={profileForm.company}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, company: e.target.value }))}
                            placeholder="Company name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={profileForm.website}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>


                      <div>
                        <Label htmlFor="skills">Skills</Label>
                        <Input
                          id="skills"
                          value={profileForm.skills}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, skills: e.target.value }))}
                          placeholder="React, Node.js, Python, Design..."
                        />
                        <p className="text-xs text-slate-500 mt-1">Separate skills with commas</p>
                      </div>

                      <div>
                        <Label htmlFor="experience">Experience</Label>
                        <Textarea
                          id="experience"
                          value={profileForm.experience}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, experience: e.target.value }))}
                          placeholder="Brief overview of your work experience..."
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Account Info */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h3 className="font-medium mb-3">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant={userProfile?.role === 'MANAGER' ? 'default' : 'secondary'}>
                            {userProfile?.role === 'MANAGER' ? 'Manager' : 'Freelancer'}
                          </Badge>
                          <span className="text-slate-600 dark:text-slate-400">Account Type</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400">
                            Joined {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleProfileSave} disabled={saving} className="w-full md:w-auto">
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your password and account security preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Change Password */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Change Password</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showCurrentPassword ? 'text' : 'password'}
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                              placeholder="Enter current password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="Enter new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="Confirm new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <Button onClick={handlePasswordChange} disabled={saving}>
                          <Key className="w-4 h-4 mr-2" />
                          {saving ? 'Updating...' : 'Update Password'}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Security Information */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h3 className="font-medium mb-3">Security Tips</h3>
                      <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                        <li>• Use a strong password with at least 8 characters</li>
                        <li>• Include uppercase and lowercase letters, numbers, and symbols</li>
                        <li>• Don't reuse passwords from other accounts</li>
                        <li>• Enable two-factor authentication when available</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <>
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Choose how you want to be notified about important events.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Email Notifications */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Email Notifications</h3>
                      
                      <div className="space-y-4">
                        {[
                          { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive important updates via email' },
                          { key: 'projectUpdates', label: 'Project Updates', description: 'Get notified when projects are updated' },
                          { key: 'messageAlerts', label: 'New Messages', description: 'Receive alerts for new messages' },
                          { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Get a weekly summary of your activities' },
                          { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive promotional content and news' }
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <Label className="font-medium">{item.label}</Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                            </div>
                            <Switch
                              checked={preferences[item.key as keyof UserPreferences] as boolean}
                              onCheckedChange={(checked) => 
                                setPreferences(prev => ({ ...prev, [item.key]: checked }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Push Notifications */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Push Notifications</h3>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="font-medium">Browser Notifications</Label>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Get instant notifications in your browser
                          </p>
                        </div>
                        <Switch
                          checked={preferences.pushNotifications}
                          onCheckedChange={(checked) => 
                            setPreferences(prev => ({ ...prev, pushNotifications: checked }))
                          }
                        />
                      </div>
                    </div>

                    <Button onClick={handlePreferenceSave} disabled={saving} className="w-full md:w-auto">
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <>
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Appearance Settings
                    </CardTitle>
                    <CardDescription>
                      Customize how the application looks and feels.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Theme Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Theme</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { value: 'light', label: 'Light', description: 'Clean and bright interface' },
                          { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
                          { value: 'system', label: 'System', description: 'Follows your device setting' }
                        ].map((themeOption) => (
                          <button
                            key={themeOption.value}
                            onClick={() => setPreferences(prev => ({ ...prev, theme: themeOption.value as any }))}
                            className={`p-4 border-2 rounded-lg text-left transition-colors ${
                              preferences.theme === themeOption.value
                                ? 'border-primary bg-primary/5'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="font-medium">{themeOption.label}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {themeOption.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Language & Region */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Language & Region</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="language">Language</Label>
                          <select
                            id="language"
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-background"
                            value={preferences.language}
                            onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                          >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="timezone">Timezone</Label>
                          <select
                            id="timezone"
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-background"
                            value={preferences.timezone}
                            onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="Europe/London">London</option>
                            <option value="Europe/Paris">Paris</option>
                            <option value="Asia/Tokyo">Tokyo</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handlePreferenceSave} disabled={saving} className="w-full md:w-auto">
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Appearance'}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
