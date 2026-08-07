import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useLazyQuery, gql } from '@apollo/client';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/router';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChangePasswordSchema, UsernameSchema } from '@social/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) { id username displayName bio avatarUrl }
  }
`;

const USERNAME_AVAILABLE = gql`
  query UsernameAvailable($username: String!) {
    usernameAvailable(username: $username)
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($password: String) {
    deleteAccount(password: $password)
  }
`;

export default function EditProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const prevUsername = useRef(user?.username || '');

  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [deletePassword, setDeletePassword] = useState('');
  const [confirmUsername, setConfirmUsername] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE, {
    onCompleted: async (data) => {
      await refreshUser();
      const newUsername = data?.updateProfile?.username;
      if (newUsername && newUsername !== prevUsername.current) {
        router.replace(`/profile/${newUsername}`);
      } else {
        handleBack();
      }
      toast.success('Profile updated!');
    },
    onError: (error) => toast.error(error.message),
  });

  const [checkUsername, { data: availData, loading: availLoading }] = useLazyQuery(USERNAME_AVAILABLE, {
    fetchPolicy: 'network-only',
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploading(true); const fd = new FormData(); fd.append('image', file);
    try {
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (data.url) { setAvatarUrl(data.url); toast.success('Image uploaded!'); }
    } catch (error: any) { toast.error(error.message || 'Upload failed'); }
    finally { setIsUploading(false); }
  };

  const usernameIsCurrent = username.trim().toLowerCase() === (user?.username || '').toLowerCase();
  const usernameFormatValid = UsernameSchema.safeParse(username).success;
  const usernameError = usernameFormatValid ? undefined : 'Use 3-20 letters, numbers or underscores';

  useEffect(() => {
    if (usernameIsCurrent || !usernameFormatValid) return;
    const timer = setTimeout(() => {
      checkUsername({ variables: { username: username.trim() } });
    }, 400);
    return () => clearTimeout(timer);
  }, [username, usernameIsCurrent, usernameFormatValid, checkUsername]);

  const availability = usernameIsCurrent ? null : availData?.usernameAvailable;

  const handleBack = () => {
    router.replace(user?.username ? `/profile/${user.username}` : '/home');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameFormatValid) { toast.error('Use 3-20 letters, numbers or underscores'); return; }
    if (availability === false) { toast.error('Username is already taken'); return; }
    await updateProfile({ variables: { input: { username: username.trim(), displayName, bio, avatarUrl } } });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ChangePasswordSchema.safeParse({ currentPassword: oldPassword, newPassword });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message || 'Invalid password'); return; }
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    try {
      const res = await fetch(`${API_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: `mutation CP($currentPassword: String!, $newPassword: String!) { changePassword(currentPassword: $currentPassword, newPassword: $newPassword) }`,
          variables: { currentPassword: oldPassword, newPassword },
        }),
      });
      const json = await res.json();
      if (json.errors) { toast.error(json.errors[0].message); return; }
      toast.success('Password changed!');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch {
      toast.error('Failed to change password');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!user.hasPassword && confirmUsername.trim() !== `@${user.username}`) {
      toast.error(`Type @${user.username} to confirm`);
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: `mutation DA($password: String) { deleteAccount(password: $password) }`,
          variables: { password: user.hasPassword ? deletePassword : null },
        }),
      });
      const json = await res.json();
      if (json.errors) { toast.error(json.errors[0].message); return; }
      toast.success('Your account has been deleted');
      setTimeout(() => { localStorage.removeItem('token'); window.location.href = '/register'; }, 800);
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <PageHeader
        back
        onBack={handleBack}
        title="Edit Profile"
        subtitle="Update your profile information"
      />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-6 p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                name={displayName || user?.displayName || 'U'}
                username={user?.username}
                src={avatarUrl}
                size="lg"
                className="shadow-card"
              />
              <button
                type="button"
                aria-label="Upload avatar"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-card transition-colors hover:bg-brand-700"
                disabled={isUploading}
              >
                <Icons.CreatePost className="h-4 w-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{displayName || user?.displayName}</p>
              <p className="text-sm text-muted">@{username}</p>
              {isUploading && <p className="mt-1 text-xs text-brand-600">Uploading...</p>}
            </div>
          </div>

          <div>
            <label htmlFor="settings-username" className="mb-2 block text-sm font-medium text-ink">
              Username
            </label>
            <input
              id="settings-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-premium"
              placeholder="Your unique handle"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="mt-1.5 text-xs">
              {usernameError ? (
                <span className="font-medium text-red-500">{usernameError}</span>
              ) : usernameIsCurrent ? (
                <span className="text-muted">This is your current username</span>
              ) : availLoading ? (
                <span className="text-muted">Checking availability...</span>
              ) : availability === false ? (
                <span className="font-medium text-red-500">Not available — someone already has this username</span>
              ) : availability === true ? (
                <span className="font-medium text-emerald-600">Available — this username is free</span>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="settings-displayName" className="mb-2 block text-sm font-medium text-ink">
              Display Name
            </label>
            <input
              id="settings-displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-premium"
              placeholder="Your display name"
            />
          </div>

          <div>
            <label htmlFor="settings-bio" className="mb-2 block text-sm font-medium text-ink">
              Bio
            </label>
            <textarea
              id="settings-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input-premium resize-none"
              rows={3}
              placeholder="Tell us about yourself..."
              maxLength={160}
            />
            <p className="mt-1 text-right text-xs text-muted">{bio.length}/160</p>
          </div>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button type="submit" loading={loading} size="lg" className="w-full">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </motion.div>
        </Card>
      </form>

      {user?.hasPassword && (
        <Card className="space-y-5 p-6">
          <div className="flex items-center gap-3">
            <Icons.Lock className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Change Password</h2>
              <p className="text-sm text-muted">Use a strong password you don&apos;t use anywhere else</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="settings-currentPassword" className="mb-2 block text-sm font-medium text-ink">
                Current Password
              </label>
              <input
                id="settings-currentPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="input-premium"
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-newPassword" className="mb-2 block text-sm font-medium text-ink">
                  New Password
                </label>
                <input
                  id="settings-newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-premium"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label htmlFor="settings-confirmPassword" className="mb-2 block text-sm font-medium text-ink">
                  Confirm New Password
                </label>
                <input
                  id="settings-confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-premium"
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                />
              </div>
            </div>
            <Button type="submit" variant="secondary" className="w-full">
              Update Password
            </Button>
          </form>
        </Card>
      )}

      <Card className="space-y-5 border-red-500/30 p-6">
        <div className="flex items-center gap-3">
          <Icons.Alert className="h-5 w-5 text-red-500" />
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Delete Account</h2>
            <p className="text-sm text-muted">
              This permanently deletes your account, posts, messages and data. This cannot be undone.
            </p>
          </div>
        </div>
        {!user?.hasPassword && (
          <p className="text-xs text-muted">Sign in with your OAuth provider if you need to restore access.</p>
        )}
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          {user?.hasPassword ? (
            <div>
              <label htmlFor="settings-deletePassword" className="mb-2 block text-sm font-medium text-ink">
                Enter your password to confirm
              </label>
              <input
                id="settings-deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input-premium"
                autoComplete="off"
                placeholder="••••••••"
                required
              />
            </div>
          ) : (
            <div>
              <label htmlFor="settings-confirmUsername" className="mb-2 block text-sm font-medium text-ink">
                Type <span className="font-semibold text-ink">@{user?.username}</span> to confirm
              </label>
              <input
                id="settings-confirmUsername"
                type="text"
                value={confirmUsername}
                onChange={(e) => setConfirmUsername(e.target.value)}
                className="input-premium"
                autoComplete="off"
                placeholder={`@${user?.username}`}
                required
              />
            </div>
          )}
          <Button type="submit" variant="danger" loading={deleteLoading} className="w-full">
            {deleteLoading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </form>
      </Card>
    </div>
  );
}