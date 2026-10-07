import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Edit3,
  Save,
  Download,
  Trash2,
  Lock,
  Search,
  Filter,
  Activity,
  Database
} from 'lucide-react';
import { User as UserType, SecurityAuditLog } from '../types/auth';
import { dbService, hashPassword } from '../services/db';

interface UserDashboardProps {
  currentUser: UserType;
  onLogout: () => void;
  onUserUpdated: (updated: UserType) => void;
  onOpenMysqlStudio: () => void;
  onOpenJavaStudio: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  onLogout,
  onUserUpdated,
  onOpenMysqlStudio,
  onOpenJavaStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'directory' | 'logs'>('profile');
  
  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    phone: currentUser.phone,
    department: currentUser.department,
    bio: currentUser.bio || '',
  });
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password change state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(currentUser.twoFactorEnabled);

  // Directory filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const allUsers = dbService.getUsers();
  const auditLogs = dbService.getLogs();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = dbService.updateUser(currentUser.id, {
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      phone: profileForm.phone.trim(),
      department: profileForm.department.trim(),
      bio: profileForm.bio.trim(),
    });

    if (updated) {
      dbService.logAction('PROFILE_UPDATED', updated.email, 'SUCCESS', 'User profile details updated in MySQL.', updated.id);
      onUserUpdated(updated);
      setIsEditingProfile(false);
      setProfileSuccessMsg('Profile information updated in MySQL successfully.');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    }
  };

  const handleToggle2FA = () => {
    const nextState = !twoFactorEnabled;
    setTwoFactorEnabled(nextState);
    const updated = dbService.updateUser(currentUser.id, { twoFactorEnabled: nextState });
    if (updated) {
      dbService.logAction(
        'TWO_FACTOR_TOGGLED',
        updated.email,
        'SUCCESS',
        `Two-factor authentication via Email OTP ${nextState ? 'enabled' : 'disabled'}.`,
        updated.id
      );
      onUserUpdated(updated);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });

    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }

    if (newPwd.length < 8) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    // Verify current password
    const checkHash = await hashPassword(currentPwd, currentUser.salt);
    if (checkHash !== currentUser.passwordHash) {
      setPwdMsg({ type: 'error', text: 'Current password is incorrect.' });
      return;
    }

    // Hash new password
    const newHash = await hashPassword(newPwd, currentUser.salt);
    const updated = dbService.updateUser(currentUser.id, { passwordHash: newHash });

    if (updated) {
      dbService.logAction('PASSWORD_CHANGED', updated.email, 'SUCCESS', 'Password updated and re-hashed in MySQL.', updated.id);
      onUserUpdated(updated);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setPwdMsg({ type: 'success', text: 'Password changed successfully in MySQL database.' });
    }
  };

  const handleExportUsers = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allUsers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `secureauth_users_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Profile Summary Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
              {currentUser.firstName[0]}
              {currentUser.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  {currentUser.firstName} {currentUser.lastName}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                  {currentUser.role}
                </span>
                {currentUser.isVerified ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Pending OTP
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400 font-mono">
                <span>@{currentUser.username}</span>
                <span>•</span>
                <span>{currentUser.email}</span>
                <span>•</span>
                <span>ID: #{currentUser.id}</span>
                <span>•</span>
                <span>Dept: {currentUser.department}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenMysqlStudio}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inspect in MySQL</span>
            </button>
            <button
              onClick={onLogout}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Data</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security &amp; 2FA</span>
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Registered Users ({allUsers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {profileSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{profileSuccessMsg}</span>
        </div>
      )}

      {/* Tab 1: Profile Data */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>User Record Registered in Software</span>
              </h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                    <input
                      type="text"
                      value={profileForm.department}
                      onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Professional Bio</label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-lg text-white"
                    placeholder="Enter brief description..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to MySQL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Full Name</span>
                  <span className="font-semibold text-white">{currentUser.firstName} {currentUser.lastName}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Email Address</span>
                  <span className="font-mono text-indigo-300">{currentUser.email}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Username</span>
                  <span className="font-mono text-slate-200">@{currentUser.username}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Contact Phone</span>
                  <span className="text-slate-200">{currentUser.phone || 'Not specified'}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Department / Division</span>
                  <span className="text-slate-200">{currentUser.department || 'General'}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Access Tier</span>
                  <span className="font-mono text-indigo-400">{currentUser.role}</span>
                </div>
                <div className="col-span-1 sm:col-span-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Account Bio</span>
                  <p className="text-slate-300 leading-relaxed">{currentUser.bio || 'Enterprise software user.'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Database Identity Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>MySQL Metadata</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Database Engine</span>
                <span className="font-mono text-slate-200">MySQL 8.0 (InnoDB)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Target Table</span>
                <span className="font-mono text-indigo-300">auth_db.users</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Primary Key ID</span>
                <span className="font-mono text-slate-200">#{currentUser.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Account Created</span>
                <span className="font-mono text-slate-300 text-[11px]">
                  {new Date(currentUser.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Last Authentication</span>
                <span className="font-mono text-slate-300 text-[11px]">
                  {currentUser.lastLoginAt ? new Date(currentUser.lastLoginAt).toLocaleString() : 'Just now'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Hash Algorithm</span>
                <span className="font-mono text-slate-200">SHA-256 + Salt</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenJavaStudio}
                className="w-full py-2 px-3 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Java Spring JPA Entity</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security & 2FA */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 2FA Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Two-Factor Authentication (2FA)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Requires a 6-digit OTP code dispatched to your registered email on every sign-in attempt.
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-mono ${
                twoFactorEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Email OTP 2FA</span>
                  <span className="text-slate-400 text-[11px]">Dispatches code to: {currentUser.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggle2FA}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    twoFactorEnabled
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Change Password</span>
            </h3>

            {pwdMsg.text && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                pwdMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {pwdMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password (Min 8 chars)</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Update &amp; Re-hash in MySQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Registered Users Directory */}
      {activeTab === 'directory' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>MySQL Registered Users Directory (`users` table)</span>
              </h2>
              <p className="text-xs text-slate-400">
                View all user records registered and persisted in the MySQL engine.
              </p>
            </div>

            <button
              onClick={handleExportUsers}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export JSON</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="DEVELOPER">DEVELOPER</option>
                <option value="MANAGER">MANAGER</option>
                <option value="USER">USER</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="px-3.5 py-2.5">ID</th>
                  <th className="px-3.5 py-2.5">User Details</th>
                  <th className="px-3.5 py-2.5">Role</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5">2FA</th>
                  <th className="px-3.5 py-2.5">Created At</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3.5 py-3 font-mono text-slate-400">#{user.id}</td>
                    <td className="px-3.5 py-3">
                      <div>
                        <span className="font-semibold text-white block">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="font-mono text-slate-400 text-[11px] block">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      {user.isVerified ? (
                        <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                          <AlertTriangle className="w-3 h-3" />
                          Pending OTP
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-slate-400 text-[11px]">
                      {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete user ${user.email} from MySQL database?`)) {
                              dbService.deleteUser(user.id);
                              // Force re-render
                              setSearchQuery(q => q + ' ');
                              setTimeout(() => setSearchQuery(q => q.trim()), 10);
                            }
                          }}
                          className="p-1 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Trail */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>Security Audit Log (`security_audit_logs` table)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Immutable event stream for registration, login, and OTP transactions.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">{auditLogs.length} events logged</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="px-3.5 py-2.5">Time</th>
                  <th className="px-3.5 py-2.5">Action</th>
                  <th className="px-3.5 py-2.5">Target Email</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {auditLogs.slice(0, 30).map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3.5 py-2.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-xs text-indigo-300 font-medium whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-300 text-[11px]">
                      {log.email}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : log.status === 'WARNING'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-400 text-xs">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
