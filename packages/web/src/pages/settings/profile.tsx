import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, gql } from '@apollo/client';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) { id displayName bio avatarUrl }
  }
`;

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE, {
    onCompleted: async () => {
      await refreshUser(); // Refresh the user data in context
      toast.success('Profile updated!');
      router.back();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploading(true); const fd = new FormData(); fd.append('image', file);
    try {
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: fd });
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
    <div className="max-w-xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
        <Icons.Explore className="w-5 h-5 rotate-180" /><span className="text-sm font-medium">Back</span>
      </button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display">Edit Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Update your profile information</p>
      </motion.div>
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover shadow-md" /> :
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">{displayName?.charAt(0)?.toUpperCase() || user?.displayName?.charAt(0)?.toUpperCase() || 'U'}</div>}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-600 hover:bg-brand-700 rounded-full flex items-center justify-center text-white shadow-md transition-colors" disabled={isUploading}><Icons.CreatePost className="w-4 h-4"/></button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div><p className="font-medium text-slate-900 dark:text-white">{displayName || user?.displayName}</p><p className="text-sm text-slate-500 dark:text-slate-400">@{user?.username}</p>{isUploading && <p className="text-xs text-brand-600 mt-1">Uploading...</p>}</div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Display Name</label><input type="text" value={displayName} onChange={e=>setDisplayName(e.target.value)} className="input-premium" placeholder="Your display name" /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bio</label><textarea value={bio} onChange={e=>setBio(e.target.value)} className="input-premium resize-none" rows={3} placeholder="Tell us about yourself..." maxLength={160} /><p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">{bio.length}/160</p></div>
          <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} type="submit" disabled={loading} className="btn-primary-premium w-full py-3">{loading ? <span className="flex items-center space-x-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span><span>Saving...</span></span> : 'Save Changes'}</motion.button>
        </div>
      </form>
    </div>
  );
}
