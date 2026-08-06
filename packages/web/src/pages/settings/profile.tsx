import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, gql } from '@apollo/client';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/router';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fadeUp } from '@/utils/motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) { id displayName bio avatarUrl }
  }
`;

export default function EditProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE, {
    onCompleted: async () => {
      await refreshUser();
      toast.success('Profile updated!');
      router.back();
    },
    onError: (error) => toast.error(error.message),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ variables: { input: { displayName, bio, avatarUrl } } });
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Edit Profile</h1>
        <p className="mt-1 text-muted">Update your profile information</p>
      </motion.div>
      <form onSubmit={handleSubmit}>
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
              <p className="text-sm text-muted">@{user?.username}</p>
              {isUploading && <p className="mt-1 text-xs text-brand-600">Uploading...</p>}
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
    </div>
  );
}