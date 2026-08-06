import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { cn } from '@/utils/cn';

export interface AuthFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  heroTitle: string;
  heroSubtitle: string;
  features: AuthFeature[];
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function Orbs() {
  const reduce = useReducedMotion();
  return (
    <>
      {[
        { className: 'left-[8%] top-[18%] h-64 w-64 bg-violet-400/40', delay: 0, duration: 9 },
        { className: 'right-[10%] top-[30%] h-72 w-72 bg-brand-300/30', delay: 1.6, duration: 11 },
        { className: 'bottom-[12%] left-[24%] h-56 w-56 bg-fuchsia-400/30', delay: 3, duration: 10 },
      ].map((orb) => (
        <motion.div
          key={orb.delay}
          aria-hidden
          initial={{ opacity: 0, y: 0 }}
          animate={reduce ? { opacity: 0.9, y: 0 } : { opacity: 0.9, y: [0, -28, 0] }}
          transition={
            reduce
              ? { opacity: { duration: 1.5 } }
              : { y: { repeat: Infinity, duration: orb.duration, delay: orb.delay, ease: 'easeInOut' }, duration: 1 }
          }
          className={cn('absolute rounded-full blur-3xl', orb.className)}
        />
      ))}
    </>
  );
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  heroTitle,
  heroSubtitle,
  features,
  children,
  footer,
}) => {
  return (
    <div className="flex min-h-screen bg-app-bg">
      {/* Brand panel */}
      <div className="relative hidden w-[46%] items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-violet-900 lg:flex">
        <Orbs />
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,white_2px,transparent_2px)] [background-size:40px_40px]"
        />
        <div className="relative z-10 w-full max-w-md px-12">
          <motion.div
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
            className="mb-10 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-white/20 bg-white/15 shadow-2xl backdrop-blur-md"
          >
            <Icons.ForYou className="h-10 w-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 font-display text-[2.75rem] font-bold leading-tight tracking-tight text-white"
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-10 text-lg text-white/80"
          >
            {heroSubtitle}
          </motion.p>

          <div className="space-y-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                  {feature.icon}
                </div>
                <div>
                  <p className="font-semibold text-white">{feature.title}</p>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-xs text-white/50"
          >
            Trusted by creators, teams & communities
          </motion.p>
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.10),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.10),transparent_55%)]"
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-glow">
              <Icons.ForYou className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
              Social<span className="text-gradient">App</span>
            </h1>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-10">
            <h2 className="mb-1.5 font-display text-2xl font-bold tracking-tight text-ink">{title}</h2>
            <p className="mb-8 text-muted">{subtitle}</p>
            {children}
          </div>

          {footer && <div className="mt-6">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
};