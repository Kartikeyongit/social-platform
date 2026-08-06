import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { Icons } from '@/components/icons';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
}

export const TextField: React.FC<TextFieldProps> = ({ label, icon, error, hint, className, ...rest }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-ink">{label}</label>
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted">
          {icon}
        </span>
      )}
      <input
        className={cn('input-premium', icon && 'pl-11', error && 'border-red-400/70 focus:border-red-400/70', className)}
        {...rest}
      />
    </div>
    {error ? (
      <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
    ) : hint ? (
      <p className="mt-1.5 text-xs text-muted">{hint}</p>
    ) : null}
  </div>
);

interface PasswordFieldProps extends Omit<TextFieldProps, 'type'> {
  placeholder?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({ label, icon, error, hint, className, ...rest }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-ink">{label}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          type={visible ? 'text' : 'password'}
          className={cn('input-premium pr-12', icon && 'pl-11', error && 'border-red-400/70', className)}
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          {visible ? <Icons.EyeOff className="h-4 w-4" /> : <Icons.Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
};