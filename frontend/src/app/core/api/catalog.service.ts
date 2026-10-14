import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlbumDetail,
  AlbumSummary,
  ArtistDetail,
  ArtistSummary,
  Page,
  PlaylistSummary,
  SearchResult,
  Track,
  UserProfile,
} from '../models';

/** Paging + optional name filter + optional sort ("playCount,desc"), shared by every list endpoint. */
export interface ListQuery {
  page?: number;
  size?: number;
  q?: string;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  tracks(query: ListQuery = {}): Observable<Page<Track>> {
    return this.http.get<Page<Track>>(`${this.api}/tracks`, { params: listParams(query) });
  }

  albums(query: ListQuery = {}): Observable<Page<AlbumSummary>> {
    return this.http.get<Page<AlbumSummary>>(`${this.api}/albums`, { params: listParams(query) });
  }

  album(id: number): Observable<AlbumDetail> {
    return this.http.get<AlbumDetail>(`${this.api}/albums/${id}`);
  }

  artists(query: ListQuery = {}): Observable<Page<ArtistSummary>> {
    return this.http.get<Page<ArtistSummary>>(`${this.api}/artists`, { params: listParams(query) });
  }

  artist(id: number): Observable<ArtistDetail> {
    return this.http.get<ArtistDetail>(`${this.api}/artists/${id}`);
  }

  /** Public playlists of every user. */
  playlists(query: ListQuery = {}): Observable<Page<PlaylistSummary>> {
    return this.http.get<Page<PlaylistSummary>>(`${this.api}/playlists`, { params: listParams(query) });
  }

  user(id: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.api}/users/${id}`);
  }

  search(q: string): Observable<SearchResult> {
    return this.http.get<SearchResult>(`${this.api}/search`, { params: { q } });
  }

  /** Counts one play and adds it to "Recently played"; the player calls this once per listen. */
  recordPlay(trackId: number): Observable<void> {
    return this.http.post<void>(`${this.api}/tracks/${trackId}/play`, null);
  }
}

function listParams({ page = 0, size = 20, q, sort }: ListQuery): HttpParams {
  let params = new HttpParams().set('page', page).set('size', size);
  if (q?.trim()) params = params.set('q', q.trim());
  if (sort) params = params.set('sort', sort);
  return params;
}
