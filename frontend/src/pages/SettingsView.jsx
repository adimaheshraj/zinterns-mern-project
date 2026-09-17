import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, KeyRound, MapPin, User, Upload, CheckCircle, Camera } from 'lucide-react';
import Avatar3DViewer from '../components/3d/Avatar3DViewer';

export default function SettingsView() {
  const { user, token, API_URL, updateUserProfile } = useApp();

  // Profile update states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileGender, setProfileGender] = useState(user?.gender || 'male');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [profileStatus, setProfileStatus] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null);

  // Office location settings states (HR only)
  const [officeLat, setOfficeLat] = useState('12.9716');
  const [officeLng, setOfficeLng] = useState('77.5946');
  const [radiusMeters, setRadiusMeters] = useState('100');
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [graceMinutes, setGraceMinutes] = useState('15');
  const [mandatoryHours, setMandatoryHours] = useState('9');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      setProfileGender(user.gender || 'male');
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  useEffect(() => {
    async function loadSettings() {
      if (user?.role !== 'HR') return;
      try {
        const res = await fetch(`${API_URL}/auth/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setOfficeLat(String(data.officeLat));
          setOfficeLng(String(data.officeLng));
          setRadiusMeters(String(data.radiusMeters));
          setCheckInTime(data.officeCheckInTime);
          setGraceMinutes(String(data.officeGraceMinutes));
          setMandatoryHours(String(data.mandatoryHours));
          setGoogleMapsApiKey(data.googleMapsApiKey || '');
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadSettings();
  }, [user, token, API_URL]);

  // Handle Profile Picture File Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileStatus('🔴 Error: Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileStatus(null);
    setSavingProfile(true);

    try {
      await updateUserProfile({
        name: profileName,
        phone: profilePhone,
        gender: profileGender,
        avatar: avatarPreview
      });
      setProfileStatus('🟢 Profile details and avatar updated successfully!');
    } catch (err) {
      setProfileStatus('🔴 Error: ' + (err.message || 'Failed to update profile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordStatus('🟢 Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
      } else {
        setPasswordStatus('🔴 Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsStatus(null);

    const radius = parseInt(radiusMeters);
    if (isNaN(radius) || radius <= 0) {
      setSettingsStatus('🔴 Error: Please enter a valid radius.');
      return;
    }
    if (radius > 1000) {
      setSettingsStatus('🔴 Error: Allowed radius cannot exceed 1000 meters (1 km)');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          officeLat: parseFloat(officeLat),
          officeLng: parseFloat(officeLng),
          radiusMeters: radius,
          officeCheckInTime: checkInTime,
          officeGraceMinutes: parseInt(graceMinutes),
          mandatoryHours: parseInt(mandatoryHours),
          googleMapsApiKey
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsStatus('🟢 Office geofencing parameters updated successfully!');
      } else {
        setSettingsStatus('🔴 Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-500" />
          Settings & Profile Management
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Update profile picture, gender preferences, credentials and corporate geofence tolerances.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile & Avatar Card */}
        <div className="p-6 rounded-2xl glass-card border shadow-sm space-y-5 bg-white dark:bg-slate-900/60">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b dark:border-slate-800 pb-3">
            <User className="w-5 h-5 text-indigo-500" />
            User Profile & 3D Avatar Photo
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {/* 3D Avatar Preview & Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
              <Avatar3DViewer
                avatarUrl={avatarPreview || user?.avatar}
                name={profileName}
                gender={profileGender}
                size="w-24 h-24"
              />

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Profile Picture Photo
                </label>
                <p className="text-[11px] text-slate-400">
                  Upload custom avatar photo (PNG/JPG max 5MB).
                </p>

                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <label className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Camera className="w-4 h-4" />
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => setAvatarPreview('')}
                      className="px-3 py-2 border rounded-xl font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Gender Selection Option */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400 uppercase block">Gender Preference</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProfileGender('male')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                    profileGender === 'male'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className="text-base">♂️</span>
                  <span>Male</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileGender('female')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                    profileGender === 'female'
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className="text-base">♀️</span>
                  <span>Female</span>
                </button>
              </div>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase">Display Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase">Phone Number</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+1 555-0100"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-xs shadow hover:opacity-95 transition-opacity"
            >
              {savingProfile ? 'Updating Profile...' : 'Save Profile Changes'}
            </button>

            {profileStatus && <p className="text-center font-bold text-xs mt-2">{profileStatus}</p>}
          </form>
        </div>

        {/* Change password */}
        <div className="p-6 rounded-2xl glass-card border shadow-sm space-y-4 bg-white dark:bg-slate-900/60">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b dark:border-slate-800 pb-3">
            <KeyRound className="w-5 h-5 text-indigo-500" />
            Modify Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-400 uppercase">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-400 uppercase">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none"
              />
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow hover:bg-indigo-700">
              Update Password
            </button>
            {passwordStatus && <p className="text-center font-semibold mt-2">{passwordStatus}</p>}
          </form>
        </div>

        {/* HR-Only Geofencing settings */}
        {user?.role === 'HR' && (
          <div className="col-span-full p-6 rounded-2xl glass-card border shadow-sm space-y-4 bg-white dark:bg-slate-900/60">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b dark:border-slate-800 pb-3">
              <MapPin className="w-5 h-5 text-indigo-500" />
              Office Coordinates & Geofence Parameters (HR Head)
            </h3>
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={officeLat}
                    onChange={(e) => setOfficeLat(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={officeLng}
                    onChange={(e) => setOfficeLng(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Allowed Radius (m)</label>
                  <input
                    type="number"
                    required
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Shift Check-in Time</label>
                  <input
                    type="text"
                    required
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Grace Time (mins)</label>
                  <input
                    type="number"
                    required
                    value={graceMinutes}
                    onChange={(e) => setGraceMinutes(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Mandatory Hours</label>
                  <input
                    type="number"
                    required
                    value={mandatoryHours}
                    onChange={(e) => setMandatoryHours(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase">Google Maps API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={googleMapsApiKey}
                    onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                    placeholder="Enter your Google Maps API key (AIzaSy...)"
                    className="w-full p-2.5 pr-16 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-indigo-500 hover:text-indigo-700 font-bold uppercase tracking-wider"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow hover:bg-indigo-700">
                Save Office Parameters
              </button>
              {settingsStatus && <p className="text-center font-semibold mt-2">{settingsStatus}</p>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
