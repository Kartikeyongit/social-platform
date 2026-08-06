import { Icons } from '@/components/icons';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: (props: any) => React.ReactElement;
  notifications?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { id: 'home', label: 'Home', href: '/home', icon: Icons.Home },
      { id: 'explore', label: 'Explore', href: '/explore', icon: Icons.Explore },
      { id: 'messages', label: 'Messages', href: '/messages', icon: Icons.Messages },
    ],
  },
  {
    label: 'Discover',
    items: [
      { id: 'trending', label: 'Trending', href: '/trending', icon: Icons.Trending },
      { id: 'recommendations', label: 'For You', href: '/recommendations', icon: Icons.ForYou },
    ],
  },
  {
    label: 'Inbox',
    items: [
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/notifications',
        icon: Icons.Notifications,
        notifications: true,
      },
    ],
  },
];
