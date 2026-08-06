import React, { useEffect, useState } from 'react';
import { SiGoogle, SiGithub } from 'react-icons/si';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface OAuthConfig {
  google: boolean;
  github: boolean;
}

export const SocialAuthButtons: React.FC = () => {
  const [config, setConfig] = useState<OAuthConfig | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/auth/config`)
      .then((r) => r.json())
      .then((data: OAuthConfig) => {
        if (active) setConfig(data);
      })
      .catch(() => {
        if (active) setConfig({ google: false, github: false });
      });
    return () => {
      active = false;
    };
  }, []);

  if (!config || (!config.google && !config.github)) return null;

  const allProviders = [
    { key: 'google' as const, label: 'Google', icon: <SiGoogle className="h-[18px] w-[18px]" />, href: `${API_URL}/auth/google` },
    { key: 'github' as const, label: 'GitHub', icon: <SiGithub className="h-[18px] w-[18px]" />, href: `${API_URL}/auth/github` },
  ];
  const providers = allProviders.filter((p) => config[p.key]);

  return (
    <div>
      <div className="mb-6 space-y-3">
        {providers.map((p) => (
          <a
            key={p.key}
            href={p.href}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-surface-2"
          >
            {p.icon}
            <span>Continue with {p.label}</span>
          </a>
        ))}
      </div>
      <div className="mb-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted">or continue with email</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
};