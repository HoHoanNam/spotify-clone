import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminStats, AdminUser, AlbumSummary, ArtistSummary, Page, Role, Track } from '../models';
import { toFormData } from '../util/form-data';

export interface ArtistForm {
  name: string;
  bio?: string | null;
  image?: File | null;
  /** Update only: drop the current image. */
  removeImage?: boolean;
}

export interface AlbumForm {
  title: string;
  artistId: number;
  releaseDate?: string | null;
  cover?: File | null;
  /** Update only: drop the current cover. */
  removeCover?: boolean;
}

export interface TrackForm {
  title: string;
  artistIds: number[];
  albumId?: number | null;
  trackNumber?: number | null;
  audio: File;
  cover?: File | null;
}

/** PUT replaces the metadata; files are only replaced when sent. */
export interface UpdateTrackForm {
  title: string;
  artistIds: number[];
  albumId?: number | null;
  trackNumber?: number | null;
  audio?: File | null;
  cover?: File | null;
  /** Drop the track's own cover so it falls back to the album cover. */
  removeCover?: boolean;
}

/** Admin writes are multipart/form-data so files and fields travel in one request. */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin`;

  createArtist(form: ArtistForm): Observable<HttpEvent<ArtistSummary>> {
    return this.upload<ArtistSummary>('artists', toFormData(form));
  }

  updateArtist(id: number, form: ArtistForm): Observable<HttpEvent<ArtistSummary>> {
    return this.upload<ArtistSummary>(`artists/${id}`, toFormData(form), 'PUT');
  }

  createAlbum(form: AlbumForm): Observable<HttpEvent<AlbumSummary>> {
    return this.upload<AlbumSummary>('albums', toFormData(form));
  }

  updateAlbum(id: number, form: AlbumForm): Observable<HttpEvent<AlbumSummary>> {
    return this.upload<AlbumSummary>(`albums/${id}`, toFormData(form), 'PUT');
  }

  createTrack(form: TrackForm): Observable<HttpEvent<Track>> {
    return this.upload<Track>('tracks', toFormData(form));
  }

  updateTrack(id: number, form: UpdateTrackForm): Observable<HttpEvent<Track>> {
    return this.upload<Track>(`tracks/${id}`, toFormData(form), 'PUT');
  }

  delete(kind: 'artists' | 'albums' | 'tracks', id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${kind}/${id}`);
  }

  stats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.api}/stats`);
  }

  users(page = 0, q = ''): Observable<Page<AdminUser>> {
    let params = new HttpParams().set('page', page).set('size', 20);
    if (q.trim()) params = params.set('q', q.trim());
    return this.http.get<Page<AdminUser>>(`${this.api}/users`, { params });
  }

  updateUser(id: number, change: { role?: Role; enabled?: boolean }): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.api}/users/${id}`, change);
  }

  private upload<T>(path: string, body: FormData, method: 'POST' | 'PUT' = 'POST'): Observable<HttpEvent<T>> {
    return this.http.request<T>(method, `${this.api}/${path}`, { body, reportProgress: true, observe: 'events' });
  }
}
