import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlbumSummary, ArtistSummary, LibraryIds, Page, Track, TrackItem } from '../models';

/** HTTP calls for "Your Library" (/api/me/...). State lives in LibraryStore. */
@Injectable({ providedIn: 'root' })
export class LibraryApi {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/me`;

  ids(): Observable<LibraryIds> {
    return this.http.get<LibraryIds>(`${this.api}/library`);
  }

  likedTracks(page = 0, size = 50): Observable<Page<TrackItem>> {
    return this.http.get<Page<TrackItem>>(`${this.api}/tracks`, {
      params: new HttpParams().set('page', page).set('size', size),
    });
  }

  setLiked(trackId: number, liked: boolean): Observable<void> {
    const url = `${this.api}/tracks/${trackId}`;
    return liked ? this.http.put<void>(url, null) : this.http.delete<void>(url);
  }

  savedAlbums(): Observable<AlbumSummary[]> {
    return this.http.get<AlbumSummary[]>(`${this.api}/albums`);
  }

  setAlbumSaved(albumId: number, saved: boolean): Observable<void> {
    const url = `${this.api}/albums/${albumId}`;
    return saved ? this.http.put<void>(url, null) : this.http.delete<void>(url);
  }

  followedArtists(): Observable<ArtistSummary[]> {
    return this.http.get<ArtistSummary[]>(`${this.api}/following`);
  }

  setFollowing(artistId: number, following: boolean): Observable<void> {
    const url = `${this.api}/following/${artistId}`;
    return following ? this.http.put<void>(url, null) : this.http.delete<void>(url);
  }

  recentlyPlayed(limit = 20): Observable<Track[]> {
    return this.http.get<Track[]>(`${this.api}/recently-played`, { params: { limit } });
  }
}
