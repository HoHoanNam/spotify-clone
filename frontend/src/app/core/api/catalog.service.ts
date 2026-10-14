import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlbumDetail, AlbumSummary, ArtistDetail, ArtistSummary, Page, SearchResult, Track } from '../models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  tracks(page = 0, size = 20): Observable<Page<Track>> {
    return this.http.get<Page<Track>>(`${this.api}/tracks`, { params: pageParams(page, size) });
  }

  albums(page = 0, size = 20): Observable<Page<AlbumSummary>> {
    return this.http.get<Page<AlbumSummary>>(`${this.api}/albums`, { params: pageParams(page, size) });
  }

  album(id: number): Observable<AlbumDetail> {
    return this.http.get<AlbumDetail>(`${this.api}/albums/${id}`);
  }

  artists(page = 0, size = 20): Observable<Page<ArtistSummary>> {
    return this.http.get<Page<ArtistSummary>>(`${this.api}/artists`, { params: pageParams(page, size) });
  }

  artist(id: number): Observable<ArtistDetail> {
    return this.http.get<ArtistDetail>(`${this.api}/artists/${id}`);
  }

  search(q: string): Observable<SearchResult> {
    return this.http.get<SearchResult>(`${this.api}/search`, { params: { q } });
  }

  /** Counts one play; the player calls this once per listen. */
  recordPlay(trackId: number): Observable<void> {
    return this.http.post<void>(`${this.api}/tracks/${trackId}/play`, null);
  }
}

function pageParams(page: number, size: number): HttpParams {
  return new HttpParams().set('page', page).set('size', size);
}
