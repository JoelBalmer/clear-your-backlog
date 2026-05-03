import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { peopleOutline, searchOutline } from 'ionicons/icons';
import { ApiError, useApi } from '../lib/api';
import { useMe } from '../contexts/MeContext';
import UserListItem from '../components/UserListItem';
import ThemeButton from '../components/ThemeButton';
import { tap as hapticTap } from '../lib/haptics';
import type { FollowItem, Profile } from '../types/models';

type Tab = 'search' | 'following' | 'followers';
type SearchResp = { items: Profile[] };
type FollowsResp = { items: FollowItem[] };

const Friends: React.FC = () => {
  const api = useApi();
  const { profile: me } = useMe();
  const [tab, setTab] = useState<Tab>('search');

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [following, setFollowing] = useState<FollowItem[] | null>(null);
  const [followers, setFollowers] = useState<FollowItem[] | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const loadFollowing = useCallback(async () => {
    if (!me) return;
    try {
      const r = await api<FollowsResp>(`/api/follows?role=following&userId=${me.id}`);
      setFollowing(r.items);
      setFollowingIds(new Set(r.items.map((it) => it.profile.id)));
    } catch (err) {
      console.error('[friends] following load failed:', err);
      setFollowing([]);
    }
  }, [api, me]);

  const loadFollowers = useCallback(async () => {
    if (!me) return;
    try {
      const r = await api<FollowsResp>(`/api/follows?role=followers&userId=${me.id}`);
      setFollowers(r.items);
    } catch (err) {
      console.error('[friends] followers load failed:', err);
      setFollowers([]);
    }
  }, [api, me]);

  useEffect(() => {
    loadFollowing();
  }, [loadFollowing]);
  useEffect(() => {
    if (tab === 'followers') loadFollowers();
  }, [tab, loadFollowers]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (tab !== 'search') return;
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearching(true);
    setSearchError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await api<SearchResp>(`/api/users?q=${encodeURIComponent(q)}`);
        setSearchResults(r.items);
      } catch (err) {
        if (err instanceof ApiError) setSearchError(`HTTP ${err.status}`);
        else setSearchError('Network error');
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, tab, api]);

  const toggleFollow = async (target: Profile) => {
    if (!me || target.id === me.id) return;
    hapticTap();
    const isFollowing = followingIds.has(target.id);
    const next = new Set(followingIds);
    if (isFollowing) next.delete(target.id);
    else next.add(target.id);
    setFollowingIds(next);
    try {
      if (isFollowing) {
        await api(`/api/follows?followingId=${target.id}`, { method: 'DELETE' });
      } else {
        await api(`/api/follows`, {
          method: 'POST',
          body: JSON.stringify({ followingId: target.id }),
        });
      }
      loadFollowing();
    } catch (err) {
      // revert optimistic update
      setFollowingIds(followingIds);
      console.error('[friends] toggle failed:', err);
    }
  };

  const FollowButton: React.FC<{ p: Profile }> = ({ p }) => {
    if (me && p.id === me.id) return null;
    const isF = followingIds.has(p.id);
    return (
      <IonButton
        size="small"
        fill={isF ? 'outline' : 'solid'}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          toggleFollow(p);
        }}
      >
        {isF ? 'Following' : 'Follow'}
      </IonButton>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Friends</IonTitle>
          <IonButtons slot="end">
            <ThemeButton />
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={tab} onIonChange={(e) => setTab((e.detail.value as Tab) ?? 'search')}>
            <IonSegmentButton value="search">
              <IonLabel>Search</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="following">
              <IonLabel>Following</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="followers">
              <IonLabel>Followers</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {tab === 'search' && (
          <>
            <div style={{ padding: '12px 16px 0' }}>
              <IonItem lines="full">
                <IonIcon slot="start" icon={searchOutline} color="medium" />
                <IonInput
                  placeholder="Find users by username"
                  value={query}
                  onIonInput={(e) =>
                    setQuery(String(e.detail.value ?? '').toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  autocapitalize="off"
                  autocorrect="off"
                  clearInput
                />
                {searching && <IonSpinner name="dots" slot="end" />}
              </IonItem>
            </div>
            {searchError && (
              <IonText color="danger">
                <p style={{ padding: '8px 16px', margin: 0 }}>{searchError}</p>
              </IonText>
            )}
            {!query && (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <IonNote>Type at least 2 characters to search.</IonNote>
              </div>
            )}
            {query && !searching && searchResults.length === 0 && !searchError && (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <IonNote>No matches.</IonNote>
              </div>
            )}
            <IonList lines="full">
              {searchResults.map((p) => (
                <UserListItem key={p.id} profile={p} trailing={<FollowButton p={p} />} />
              ))}
            </IonList>
          </>
        )}

        {tab === 'following' && (
          <>
            {following === null && (
              <div style={{ padding: 48, display: 'grid', placeItems: 'center' }}>
                <IonSpinner />
              </div>
            )}
            {following && following.length === 0 && (
              <div className="empty-state">
                <div className="empty-state__icon">
                  <IonIcon icon={peopleOutline} />
                </div>
                <h2>You aren't following anyone yet</h2>
                <IonNote color="medium">
                  <p>Search for friends by username to start following them.</p>
                </IonNote>
              </div>
            )}
            {following && following.length > 0 && (
              <IonList lines="full">
                {following.map((it) => (
                  <UserListItem
                    key={it.profile.id}
                    profile={it.profile}
                    trailing={<FollowButton p={it.profile} />}
                  />
                ))}
              </IonList>
            )}
          </>
        )}

        {tab === 'followers' && (
          <>
            {followers === null && (
              <div style={{ padding: 48, display: 'grid', placeItems: 'center' }}>
                <IonSpinner />
              </div>
            )}
            {followers && followers.length === 0 && (
              <div className="empty-state">
                <div className="empty-state__icon">
                  <IonIcon icon={peopleOutline} />
                </div>
                <h2>No followers yet</h2>
                <IonNote color="medium">
                  <p>Share your username so people can find you.</p>
                </IonNote>
              </div>
            )}
            {followers && followers.length > 0 && (
              <IonList lines="full">
                {followers.map((it) => (
                  <UserListItem
                    key={it.profile.id}
                    profile={it.profile}
                    trailing={<FollowButton p={it.profile} />}
                  />
                ))}
              </IonList>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Friends;
