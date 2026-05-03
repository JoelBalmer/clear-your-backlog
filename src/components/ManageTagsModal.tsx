import { useEffect, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { closeOutline, trashOutline } from 'ionicons/icons';
import { ApiError, useApi } from '../lib/api';
import type { Tag } from '../types/models';

type TagsResp = { items: Tag[] };
type CreateResp = { tag: Tag };

const ManageTagsModal: React.FC<{ isOpen: boolean; onDismiss: () => void }> = ({
  isOpen,
  onDismiss,
}) => {
  const api = useApi();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tag | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api<TagsResp>('/api/tags')
      .then((r) => setTags(r.items))
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  }, [isOpen, api]);

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
      setTags((prev) => [...prev, r.tag]);
      setNewName('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError('Tag already exists');
      else if (err instanceof ApiError && err.status === 400)
        setError('1-30 chars: letters, numbers, space, _, -');
      else setError('Failed to create tag');
    } finally {
      setCreating(false);
    }
  };

  const remove = async (tag: Tag) => {
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
    try {
      await api(`/api/tags?id=${tag.id}`, { method: 'DELETE' });
    } catch {
      setTags((prev) => [...prev, tag]);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Manage tags</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
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
              style={{
                '--padding-start': '12px',
                border: '1px solid var(--ion-color-step-150)',
                borderRadius: 8,
              }}
            />
            <IonButton onClick={create} disabled={creating || !newName.trim()}>
              {creating ? <IonSpinner name="dots" /> : 'Add'}
            </IonButton>
          </div>
          {error && (
            <IonText color="danger">
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>{error}</p>
            </IonText>
          )}
        </div>

        {loading ? (
          <div style={{ padding: 32, display: 'grid', placeItems: 'center' }}>
            <IonSpinner />
          </div>
        ) : tags.length === 0 ? (
          <div style={{ padding: '16px 24px', textAlign: 'center' }}>
            <IonNote color="medium">
              No tags yet. Use them to group your library — e.g. "co-op", "Steam Deck", "weekend".
            </IonNote>
          </div>
        ) : (
          <IonList lines="full">
            {tags.map((t) => (
              <IonItem key={t.id}>
                <IonLabel>
                  <h3 style={{ fontWeight: 600 }}>{t.name}</h3>
                </IonLabel>
                <IonButton
                  slot="end"
                  fill="clear"
                  color="danger"
                  onClick={() => setConfirmDelete(t)}
                >
                  <IonIcon icon={trashOutline} slot="icon-only" />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonAlert
          isOpen={!!confirmDelete}
          onDidDismiss={() => setConfirmDelete(null)}
          header={`Delete "${confirmDelete?.name}"?`}
          message="This removes the tag from all games it was applied to."
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            {
              text: 'Delete',
              role: 'destructive',
              handler: () => {
                if (confirmDelete) remove(confirmDelete);
              },
            },
          ]}
        />
      </IonContent>
    </IonModal>
  );
};

export default ManageTagsModal;
