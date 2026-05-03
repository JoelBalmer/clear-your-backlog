import { useEffect, useState } from 'react';
import { IonButton, IonIcon, IonInput, IonSpinner, IonText } from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import TagChip from './TagChip';
import { ApiError, useApi } from '../lib/api';
import type { Tag } from '../types/models';

type TagsResp = { items: Tag[] };
type CreateResp = { tag: Tag };

type Props = {
  selectedIds: string[];
  onToggle: (tagId: string) => void;
  onTagsChanged?: (tags: Tag[]) => void;
};

const TagPicker: React.FC<Props> = ({ selectedIds, onToggle, onTagsChanged }) => {
  const api = useApi();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<TagsResp>('/api/tags')
      .then((r) => {
        if (cancelled) return;
        setTags(r.items);
        onTagsChanged?.(r.items);
      })
      .catch(() => !cancelled && setTags([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const r = await api<CreateResp>('/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      const next = [...tags, r.tag];
      setTags(next);
      onTagsChanged?.(next);
      onToggle(r.tag.id);
      setNewName('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError('Tag already exists');
      else if (err instanceof ApiError && err.status === 400) setError('1-30 chars: letters, numbers, space, _, -');
      else setError('Failed to create tag');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <IonSpinner name="dots" />;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, minHeight: 24 }}>
        {tags.length === 0 && (
          <IonText color="medium">
            <span style={{ fontSize: 13 }}>No tags yet — create one below.</span>
          </IonText>
        )}
        {tags.map((t) => (
          <TagChip
            key={t.id}
            name={t.name}
            color={t.color}
            selected={selectedIds.includes(t.id)}
            onClick={() => onToggle(t.id)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <IonInput
          placeholder="New tag (e.g. co-op)"
          value={newName}
          onIonInput={(e) => setNewName(String(e.detail.value ?? ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              create();
            }
          }}
          maxlength={30}
          style={{ '--padding-start': '8px', border: '1px solid var(--ion-color-step-150)', borderRadius: 8 }}
        />
        <IonButton size="small" onClick={create} disabled={creating || !newName.trim()}>
          <IonIcon icon={addOutline} slot="icon-only" />
        </IonButton>
      </div>
      {error && (
        <IonText color="danger">
          <p style={{ fontSize: 12, margin: '6px 0 0' }}>{error}</p>
        </IonText>
      )}
    </div>
  );
};

export default TagPicker;
