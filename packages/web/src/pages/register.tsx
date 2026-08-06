import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { RegisterSchema } from '@social/shared';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { TextField, PasswordField } from '@/components/auth/Field';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/icons';
import { cn } from '@/utils/cn';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const FEATURES = [
  {
    icon: <Icons.Layers className="h-4 w-4" />,
    title: 'Unified experience',
    description: 'One account for posts, messaging and more',
  },
  {
    icon: <Icons.Zap className="h-4 w-4" />,
    title: 'Smart recommendations',
    description: 'RL-powered posts and people picked for you',
  },
  {
    icon: <Icons.Check className="h-4 w-4" />,
    title: 'Free forever',
    description: 'No paywalls. Your voice, your space',
  },
];

function passwordScore(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-emerald-500',
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', displayName: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const score = passwordScore(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    const parsed = RegisterSchema.safeParse(formData);
    if (!parsed.success) {
      setLoading(false);
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation Register($username:String!,$email:String!,$password:String!,$displayName:String!){register(username:$username,email:$email,password:$password,displayName:$displayName){token user{id username displayName email avatarUrl}}}`,
          variables: formData,
        }),
      });
      const { data, errors } = await response.json();
      if (errors) toast.error(errors[0]?.message || 'Registration failed');
      else if (data?.register) {
        login(data.register.token, data.register.user);
        toast.success('Account created!');
      }
    } catch {
      toast.error('Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the community in under a minute"
      heroTitle="Join the social revolution"
      heroSubtitle="One account for a real-time feed, trending topics, private messaging and smarter recommendations."
      features={FEATURES}
      footer={
        <p className="text-center text-xs text-muted">
          By signing up you agree to be awesome. No spam, ever.
        </p>
      }
    >
      <SocialAuthButtons />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            required
            icon={<Icons.AtSign className="h-4 w-4" />}
            placeholder="johndoe"
            value={formData.username}
            onChange={handleChange}
            error={fieldErrors.username}
            hint="3-20 chars: letters, numbers, underscores"
          />
          <TextField
            id="displayName"
            label="Display name"
            name="displayName"
            autoComplete="name"
            required
            placeholder="John Doe"
            value={formData.displayName}
            onChange={handleChange}
            error={fieldErrors.displayName}
          />
        </div>

        <TextField
          id="register-email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          icon={<Icons.Mail className="h-4 w-4" />}
          placeholder="john@example.com"
          value={formData.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />

        <PasswordField
          id="register-password"
          label="Password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          icon={<Icons.Lock className="h-4 w-4" />}
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors.password}
          hint="At least 8 characters"
        />

        {formData.password.length > 0 && (
          <div className="-mt-2 space-y-1.5">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors duration-300',
                    i < score ? STRENGTH_COLORS[score - 1] : 'bg-surface-2',
                  )}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-muted">
              Strength: <span className={score > 0 ? 'text-ink' : ''}>{STRENGTH_LABELS[score - 1] ?? STRENGTH_LABELS[0]}</span>
            </p>
          </div>
        )}

        <Button type="submit" loading={loading} size="lg" className="w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}