import crypto from 'crypto';
import type { Request, Response } from 'express';
import { prisma } from './db';
import { config } from './config';
import { signToken } from './auth';

const STATE_COOKIE = 'oauth_state';

type Provider = 'google' | 'github';

interface OAuthProfile {
  provider: Provider;
  providerId: string;
  email?: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
}

const PROVIDER_URLS: Record<Provider, { authorize: string; token: string }> = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
  },
  github: {
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
  },
};

function clientCredentials(provider: Provider): { clientId: string; clientSecret: string } {
  const creds =
    provider === 'google'
      ? { clientId: config.oauth.googleClientId, clientSecret: config.oauth.googleClientSecret }
      : { clientId: config.oauth.githubClientId, clientSecret: config.oauth.githubClientSecret };
  if (!creds.clientId || !creds.clientSecret) throw new Error(`OAuth ${provider} is not configured`);
  return creds;
}

// The API's own callback URL (registered with the OAuth provider)
function callbackUrl(provider: Provider, req: Request): string {
  const host = req.get('host') || 'localhost:4000';
  const proto = req.protocol === 'http' && req.get('x-forwarded-proto') ? req.get('x-forwarded-proto') : req.protocol;
  return `${proto}://${host}/auth/${provider}/callback`;
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

function getCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export function startOAuth(provider: Provider, req: Request, res: Response) {
  const state = crypto.randomBytes(32).toString('hex');
  res.cookie(STATE_COOKIE, state, cookieOptions());

  const { clientId } = clientCredentials(provider);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(provider, req),
    state,
    response_type: 'code',
  });

  if (provider === 'google') {
    params.set('scope', 'openid email profile');
    params.set('access_type', 'online');
  } else {
    params.set('scope', 'read:user user:email');
  }

  res.redirect(`${PROVIDER_URLS[provider].authorize}?${params.toString()}`);
}

export async function handleOAuthCallback(provider: Provider, req: Request, res: Response) {
  const fail = (message: string) =>
    res.redirect(`${config.oauth.webRedirect}/auth/callback?error=${encodeURIComponent(message)}`);

  const state = String(req.query.state || '');
  if (!state || state !== getCookie(req, STATE_COOKIE)) {
    return fail('Invalid state parameter. Please try again.');
  }
  res.clearCookie(STATE_COOKIE, cookieOptions());

  const code = req.query.code;
  if (!code) return fail('Missing authorization code');

  try {
    const profile = await exchangeCode(provider, String(code), req);
    const { userId, isNewUser } = await upsertOAuthUser(profile);
    const token = signToken(userId);
    return res.redirect(
      `${config.oauth.webRedirect}/auth/callback?token=${encodeURIComponent(token)}${isNewUser ? '&new=1' : ''}`,
    );
  } catch (error) {
    console.error(`OAuth ${provider} callback error:`, (error as Error).message);
    return fail((error as Error).message || 'OAuth sign-in failed');
  }
}

async function exchangeCode(provider: Provider, code: string, req: Request): Promise<OAuthProfile> {
  const { clientId, clientSecret } = clientCredentials(provider);

  if (provider === 'google') {
    const res = await fetch(PROVIDER_URLS.google.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl('google', req),
        grant_type: 'authorization_code',
      }).toString(),
    });
    const token = (await res.json()) as any;
    if (!token.access_token) throw new Error(token.error_description || token.error || 'Google token exchange failed');

    const info = (await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }).then((r) => r.json())) as any;
    if (!info.sub) throw new Error('Could not fetch Google profile');
    return {
      provider: 'google',
      providerId: info.sub,
      email: info.email,
      displayName: info.name || '',
      username: info.name ? slugify(info.name) : undefined,
      avatarUrl: info.picture,
    };
  }

  // GitHub
  const res = await fetch(PROVIDER_URLS.github.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const token = (await res.json()) as any;
  if (!token.access_token) throw new Error(token.error_description || token.error || 'GitHub token exchange failed');

  const [rawInfo, rawEmails] = await Promise.all([
    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token.access_token}`, 'User-Agent': 'SocialApp' },
    }).then((r) => r.json()),
    fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${token.access_token}`, 'User-Agent': 'SocialApp' },
    }).then((r) => r.json()),
  ]);
  const info = rawInfo as any;
  const emails = rawEmails as any[];
  const primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
  if (!info.id) throw new Error('Could not fetch GitHub profile');
  return {
    provider: 'github',
    providerId: String(info.id),
    email: info.email || primaryEmail,
    displayName: info.name || info.login || '',
    username: info.login,
    avatarUrl: info.avatar_url,
  };
}

async function upsertOAuthUser(profile: OAuthProfile): Promise<{ userId: string; isNewUser: boolean }> {
  const providerField = profile.provider === 'google' ? 'googleId' : 'githubId';

  const existing = await prisma.user.findUnique({
    where: { [providerField]: profile.providerId } as any,
  });
  if (existing) return { userId: existing.id, isNewUser: false };

  let baseUsername = slugify(profile.username || profile.displayName || 'user');
  let username = baseUsername;
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username } })) {
    suffix += 1;
    username = `${baseUsername}${suffix}`;
  }

  const email = profile.email?.trim().toLowerCase();

  // If the email is already used by a password account, refuse to silently merge.
  if (email) {
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash) {
      throw new Error(`An account with the email ${email} already exists. Sign in with your password instead.`);
    }
  }

  const created = await prisma.user.create({
    data: {
      username,
      email: email || `${username}@${profile.provider}.social`,
      passwordHash: null,
      displayName: profile.displayName || username,
      avatarUrl: profile.avatarUrl || null,
      [providerField]: profile.providerId,
    },
  });
  return { userId: created.id, isNewUser: true };
}

function slugify(value: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
  return cleaned || 'user';
}