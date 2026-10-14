// API contract. Mirrors the backend DTOs (Java records); keep both sides in sync.

export type Role = 'USER' | 'ADMIN';

export interface User {
  id: number;
  role: Role;
  email: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
}

export interface ArtistSummary {
  id: number;
  name: string;
  imageUrl: string | null;
}

export interface AlbumRef {
  id: number;
  title: string;
}

export interface AlbumSummary {
  id: number;
  title: string;
  coverUrl: string | null;
  artist: ArtistSummary;
  releaseDate: string | null;
}

export interface Track {
  id: number;
  title: string;
  durationSec: number;
  trackNumber: number | null;
  artists: ArtistSummary[];
  album: AlbumRef | null;
  coverUrl: string | null;
  audioUrl: string;
  playCount: number;
}

export interface AlbumDetail extends AlbumSummary {
  tracks: Track[];
}

export interface ArtistDetail extends ArtistSummary {
  bio: string | null;
  albums: AlbumSummary[];
  topTracks: Track[];
}

export interface SearchResult {
  tracks: Track[];
  albums: AlbumSummary[];
  artists: ArtistSummary[];
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** RFC 9457 Problem Details, as returned by GlobalExceptionHandler. */
export interface ProblemDetail {
  status: number;
  title: string;
  detail?: string;
  errors?: Record<string, string>;
}
