-- User-owned data: playlists, liked tracks, saved albums, followed artists, listening history.
-- Everything here belongs to a user and disappears with the user (ON DELETE CASCADE).

CREATE TABLE playlists (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(300),
    cover_path  VARCHAR(255),
    is_public   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- One row per track in a playlist; position is rewritten 0..n-1 on every change (see ADR-0010).
-- A track can be in a playlist only once.
CREATE TABLE playlist_tracks (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    playlist_id BIGINT      NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id    BIGINT      NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position    INT         NOT NULL,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_playlist_tracks UNIQUE (playlist_id, track_id)
);

CREATE TABLE liked_tracks (
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id   BIGINT      NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, track_id)
);

CREATE TABLE saved_albums (
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    album_id   BIGINT      NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, album_id)
);

CREATE TABLE followed_artists (
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_id  BIGINT      NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, artist_id)
);

-- One row per counted listen (POST /api/tracks/{id}/play). Feeds "Recently played".
CREATE TABLE play_history (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id   BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id  BIGINT      NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_playlists_owner         ON playlists(owner_id);
CREATE INDEX idx_playlist_tracks_order   ON playlist_tracks(playlist_id, position);
CREATE INDEX idx_playlist_tracks_track   ON playlist_tracks(track_id);
CREATE INDEX idx_liked_tracks_track      ON liked_tracks(track_id);
CREATE INDEX idx_saved_albums_album      ON saved_albums(album_id);
CREATE INDEX idx_followed_artists_artist ON followed_artists(artist_id);
CREATE INDEX idx_play_history_user_time  ON play_history(user_id, played_at DESC);
