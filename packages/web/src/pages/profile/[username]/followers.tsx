import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'react-hot-toast';
import { Icons } from '@/components/icons';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserRow } from '@/components/ui/UserRow';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, buttonClass } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';

const GET_FOLLOW_DATA = gql`
  query GetFollowData($username: String!) {
    user(username: $username) {
      id
      isFollowing
      followsViewer
    }
    followers(username: $username) {
      id
      username
      displayName
      avatarUrl
      bio
    }
    following(username: $username) {
      id
      username
      displayName
      avatarUrl
      bio
    }
  }
`;

const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId) { id }
  }
`;

const REMOVE_FOLLOWER = gql`
  mutation RemoveFollower($followerId: ID!) {
    removeFollower(followerId: $followerId) { id }
  }
`;

export default function FollowersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { username, tab } = router.query;
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');

  const isOwnPage = !!currentUser && !!username && currentUser.username === username;

  useEffect(() => {
    setActiveTab(tab === 'following' ? 'following' : 'followers');
  }, [tab]);

  const switchTab = (next: 'followers' | 'following') => {
    setActiveTab(next);
    router.replace(`/profile/${username}/followers${next === 'following' ? '?tab=following' : ''}`, undefined, { shallow: true });
  };

  const { data, loading, error, refetch } = useQuery(GET_FOLLOW_DATA, {
    variables: { username },
    skip: !username,
  });

  const [unfollowUser] = useMutation(UNFOLLOW_USER, {
    onCompleted: () => { toast.success('Unfollowed'); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const [removeFollower] = useMutation(REMOVE_FOLLOWER, {
    onCompleted: () => { toast.success('Follower removed'); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const followers = data?.followers || [];
  const following = data?.following || [];
  const currentList = activeTab === 'followers' ? followers : following;
  const canView = isOwnPage || (Boolean(data?.user?.isFollowing) && Boolean(data?.user?.followsViewer));

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <PageHeader
        back
        onBack={() => router.back()}
        title={`@${username}`}
        subtitle="Connections"
      />

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Connections">
        {(['followers', 'following'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={activeTab === t}
            disabled={!canView}
            onClick={() => switchTab(t)}
            className={
              (activeTab === t ? buttonClass('primary', 'md') : buttonClass('secondary', 'md')) +
              ' disabled:cursor-not-allowed disabled:opacity-50'
            }
          >
            {t === 'followers' ? 'Followers' : 'Following'}
          </button>
        ))}
      </div>

      {/* List */}
      {error && !loading && (
        <ErrorState
          title="Couldn't load connections"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {!canView ? (
        <EmptyState
          icon={<Icons.Alert className="h-8 w-8" />}
          title="Connections are private"
          description="Only mutual connections can view followers and following"
        />
      ) : loading ? (
        <Card className="p-2">
          <ListSkeleton rows={5} />
        </Card>
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={<Icons.Profile className="h-8 w-8" />}
          title={activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          description={activeTab === 'followers' ? 'People who follow you will show up here' : 'People you follow will show up here'}
        />
      ) : (
        <Card className="p-2">
          <div className="space-y-0.5">
            {currentList.map((person: any) => (
              <UserRow
                key={person.id}
                user={{
                  id: person.id,
                  username: person.username,
                  displayName: person.displayName,
                  avatarUrl: person.avatarUrl,
                  bio: person.bio,
                }}
                action={
                  isOwnPage ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (activeTab === 'followers') {
                          removeFollower({ variables: { followerId: person.id } });
                        } else {
                          unfollowUser({ variables: { userId: person.id } });
                        }
                      }}
                    >
                      {activeTab === 'followers' ? 'Remove' : 'Unfollow'}
                    </Button>
                  ) : (
                    null
                  )
                }
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}