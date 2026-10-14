import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlbumSummary, ArtistSummary, Track } from '../models';

export interface ArtistForm {
  name: string;
  bio?: string | null;
  image?: File | null;
}

export interface AlbumForm {
  title: string;
  artistId: number;
  releaseDate?: string | null;
  cover?: File | null;
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

  createAlbum(form: AlbumForm): Observable<HttpEvent<AlbumSummary>> {
    return this.upload<AlbumSummary>('albums', toFormData(form));
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

  private upload<T>(path: string, body: FormData, method: 'POST' | 'PUT' = 'POST'): Observable<HttpEvent<T>> {
    return this.http.request<T>(method, `${this.api}/${path}`, { body, reportProgress: true, observe: 'events' });
  }
}

/** Arrays become repeated fields (artistIds=1&artistIds=2), which Spring binds to List<Long>. */
function toFormData(form: object): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(form)) {
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => data.append(key, String(v)));
    } else if (value instanceof File) {
      data.append(key, value, value.name);
    } else {
      data.append(key, String(value));
    }
  }
  return data;
}
