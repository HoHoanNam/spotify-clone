import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, forkJoin, tap } from 'rxjs';
import { LibraryApi } from '../api/library-api.service';
import { CreatePlaylist, PlaylistService } from '../api/playlist.service';
import { AuthService } from '../auth/auth.service';
import { AlbumSummary, ArtistSummary, PlaylistSummary, Track } from '../models';
import { errorMessage } from '../util/loadable';
import { ToastService } from '../../shared/toast.service';

/**
 * Client-side copy of "Your Library": liked track ids, saved albums, followed artists and own playlists.
 * Loaded once per login; every toggle updates the UI first and rolls back if the request fails
 * (optimistic update), so hearts and Follow buttons react instantly. See ADR-0011.
 */
@Injectable({ providedIn: 'root' })
export class LibraryStore {
  private readonly api = inject(LibraryApi);
  private readonly playlistApi = inject(PlaylistService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  private readonly likedIds = signal<ReadonlySet<number>>(new Set());
  private readonly _albums = signal<AlbumSummary[]>([]);
  private readonly _artists = signal<ArtistSummary[]>([]);
  private readonly _playlists = signal<PlaylistSummary[]>([]);
  private readonly _loaded = signal(false);

  readonly albums = this._albums.asReadonly();
  readonly artists = this._artists.asReadonly();
  readonly playlists = this._playlists.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly likedCount = computed(() => this.likedIds().size);
  /** Playlists the user can add tracks to (all own playlists). */
  readonly ownPlaylists = this._playlists.asReadonly();

  private readonly albumIds = computed(() => new Set(this._albums().map((a) => a.id)));
  private readonly artistIds = computed(() => new Set(this._artists().map((a) => a.id)));

  constructor() {
    // computed() only notifies when the id really changes (renaming the user keeps the same id)
    const userId = computed(() => this.auth.user()?.id ?? null);
    effect(() => {
      const id = userId();
      untracked(() => (id === null ? this.reset() : this.load()));
    });
  }

  load(): void {
    forkJoin({
      ids: this.api.ids(),
      albums: this.api.savedAlbums(),
      artists: this.api.followedArtists(),
      playlists: this.playlistApi.mine(),
    }).subscribe({
      next: ({ ids, albums, artists, playlists }) => {
        this.likedIds.set(new Set(ids.likedTrackIds));
        this._albums.set(albums);
        this._artists.set(artists);
        this._playlists.set(playlists);
        this._loaded.set(true);
      },
      error: () => this._loaded.set(true),
    });
  }

  // ---- Liked Songs

  isLiked(trackId: number): boolean {
    return this.likedIds().has(trackId);
  }

  toggleLike(track: Track): void {
    const liked = !this.isLiked(track.id);
    this.setLikedLocally(track.id, liked);
    this.toast.show(liked ? 'Added to Liked Songs' : 'Removed from Liked Songs');
    this.api.setLiked(track.id, liked).subscribe({
      error: (err) => {
        this.setLikedLocally(track.id, !liked);
        this.toast.error(errorMessage(err));
      },
    });
  }

  /** Tracks dropped on "Liked Songs" in the sidebar. */
  likeAll(trackIds: number[]): void {
    const toLike = trackIds.filter((id) => !this.isLiked(id));
    if (!toLike.length) {
      this.toast.show('Already in Liked Songs');
      return;
    }
    toLike.forEach((id) => {
      this.setLikedLocally(id, true);
      this.api.setLiked(id, true).subscribe({ error: () => this.setLikedLocally(id, false) });
    });
    this.toast.show('Added to Liked Songs');
  }

  private setLikedLocally(trackId: number, liked: boolean): void {
    this.likedIds.update((ids) => {
      const next = new Set(ids);
      if (liked) next.add(trackId);
      else next.delete(trackId);
      return next;
    });
  }

  // ---- Saved albums

  isSaved(albumId: number): boolean {
    return this.albumIds().has(albumId);
  }

  toggleSaveAlbum(album: AlbumSummary): void {
    const save = !this.isSaved(album.id);
    const before = this._albums();
    this._albums.set(save ? [album, ...before] : before.filter((a) => a.id !== album.id));
    this.toast.show(save ? 'Saved to Your Library' : 'Removed from Your Library');
    this.api.setAlbumSaved(album.id, save).subscribe({
      error: (err) => {
        this._albums.set(before);
        this.toast.error(errorMessage(err));
      },
    });
  }

  // ---- Followed artists

  isFollowing(artistId: number): boolean {
    return this.artistIds().has(artistId);
  }

  toggleFollow(artist: ArtistSummary): void {
    const follow = !this.isFollowing(artist.id);
    const before = this._artists();
    this._artists.set(follow ? [artist, ...before] : before.filter((a) => a.id !== artist.id));
    this.api.setFollowing(artist.id, follow).subscribe({
      error: (err) => {
        this._artists.set(before);
        this.toast.error(errorMessage(err));
      },
    });
  }

  // ---- Playlists

  isOwnPlaylist(playlistId: number): boolean {
    return this._playlists().some((p) => p.id === playlistId);
  }

  createPlaylist(body: CreatePlaylist = {}): Observable<PlaylistSummary> {
    return this.playlistApi.create(body).pipe(tap((created) => this._playlists.update((list) => [created, ...list])));
  }

  /** "Add to playlist": toast tells whether anything was added. */
  addToPlaylist(playlist: PlaylistSummary, trackIds: number[]): void {
    this.playlistApi.addTracks(playlist.id, trackIds).subscribe({
      next: ({ added, playlist: updated }) => {
        this.upsertPlaylist(updated);
        this.toast.show(added ? `Added to ${updated.name}` : `Already in ${updated.name}`);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  /** Creates "My Playlist #n" containing the tracks (context menu → "New playlist"). */
  addToNewPlaylist(trackIds: number[]): Observable<PlaylistSummary> {
    return this.createPlaylist({ trackIds }).pipe(tap((created) => this.toast.show(`Added to ${created.name}`)));
  }

  upsertPlaylist(summary: PlaylistSummary): void {
    this._playlists.update((list) =>
      list.some((p) => p.id === summary.id) ? list.map((p) => (p.id === summary.id ? summary : p)) : [summary, ...list],
    );
  }

  removePlaylist(id: number): void {
    this._playlists.update((list) => list.filter((p) => p.id !== id));
  }

  refreshPlaylists(): void {
    this.playlistApi.mine().subscribe({ next: (list) => this._playlists.set(list), error: () => undefined });
  }

  private reset(): void {
    this.likedIds.set(new Set());
    this._albums.set([]);
    this._artists.set([]);
    this._playlists.set([]);
    this._loaded.set(false);
  }
}
