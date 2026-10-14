import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddTracksResponse, PlaylistDetail, PlaylistSummary } from '../models';
import { toFormData } from '../util/form-data';

export interface CreatePlaylist {
  name?: string;
  description?: string;
  trackIds?: number[];
}

/** "Edit details" dialog. The cover is replaced only when a file is sent. */
export interface UpdatePlaylist {
  name: string;
  description?: string | null;
  isPublic?: boolean;
  cover?: File | null;
  removeCover?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  mine(): Observable<PlaylistSummary[]> {
    return this.http.get<PlaylistSummary[]>(`${this.api}/me/playlists`);
  }

  get(id: number): Observable<PlaylistDetail> {
    return this.http.get<PlaylistDetail>(`${this.api}/playlists/${id}`);
  }

  create(body: CreatePlaylist = {}): Observable<PlaylistSummary> {
    return this.http.post<PlaylistSummary>(`${this.api}/playlists`, body);
  }

  update(id: number, form: UpdatePlaylist): Observable<PlaylistSummary> {
    return this.http.put<PlaylistSummary>(`${this.api}/playlists/${id}`, toFormData(form));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/playlists/${id}`);
  }

  addTracks(id: number, trackIds: number[]): Observable<AddTracksResponse> {
    return this.http.post<AddTracksResponse>(`${this.api}/playlists/${id}/tracks`, { trackIds });
  }

  removeTrack(id: number, trackId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/playlists/${id}/tracks/${trackId}`);
  }

  moveTrack(id: number, from: number, to: number): Observable<void> {
    return this.http.post<void>(`${this.api}/playlists/${id}/tracks/move`, { from, to });
  }
}
