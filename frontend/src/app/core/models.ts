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
  followers: number;
  albums: AlbumSummary[];
  topTracks: Track[];
  /** Tracks where the artist is featured (not the main artist). */
  appearsOn: Track[];
}

/** Public view of a user: playlist owner, profile header. */
export interface UserRef {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export interface PlaylistSummary {
  id: number;
  name: string;
  description: string | null;
  /** 1 URL = own cover, 4 = mosaic of track covers, 0 = placeholder. */
  images: string[];
  owner: UserRef;
  isPublic: boolean;
  trackCount: number;
}

/** A track plus when it was added to a playlist / Liked Songs. */
export interface TrackItem {
  track: Track;
  addedAt: string;
}

export interface PlaylistDetail extends Omit<PlaylistSummary, 'trackCount'> {
  hasCover: boolean;
  totalDurationSec: number;
  createdAt: string;
  items: TrackItem[];
}

export interface AddTracksResponse {
  added: number;
  playlist: PlaylistSummary;
}

export interface LibraryIds {
  likedTrackIds: number[];
  savedAlbumIds: number[];
  followedArtistIds: number[];
}

export interface UserProfile extends UserRef {
  playlists: PlaylistSummary[];
}

export interface SearchResult {
  tracks: Track[];
  albums: AlbumSummary[];
  artists: ArtistSummary[];
  playlists: PlaylistSummary[];
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  enabled: boolean;
  createdAt: string;
}

export interface AdminStats {
  users: number;
  artists: number;
  albums: number;
  tracks: number;
  playlists: number;
  totalPlays: number;
  topTracks: Track[];
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
