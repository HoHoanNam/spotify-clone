CREATE TABLE artists (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    bio         TEXT,
    image_path  VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE albums (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    artist_id    BIGINT NOT NULL REFERENCES artists(id),            -- one main artist per album
    cover_path   VARCHAR(255),
    release_date DATE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tracks (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    album_id     BIGINT REFERENCES albums(id) ON DELETE SET NULL,   -- NULL = single
    track_number INT,
    duration_sec INT    NOT NULL CHECK (duration_sec >= 0),
    audio_path   VARCHAR(255) NOT NULL,
    cover_path   VARCHAR(255),                                      -- optional, falls back to album cover
    play_count   BIGINT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Many-to-many with display order (position 0 = main artist).
-- PK matches how Hibernate manages @OrderColumn; UNIQUE stops the same artist being added twice.
-- UNIQUE is DEFERRABLE: when the order changes, Hibernate rewrites artist_id row by row, so a duplicate
-- exists briefly mid-transaction; the check runs at commit instead.
CREATE TABLE track_artists (
    track_id  BIGINT   NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    artist_id BIGINT   NOT NULL REFERENCES artists(id),             -- RESTRICT: cannot delete an artist that still has tracks
    position  INT      NOT NULL,
    PRIMARY KEY (track_id, position),
    CONSTRAINT uk_track_artists UNIQUE (track_id, artist_id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_albums_artist        ON albums(artist_id);
CREATE INDEX idx_tracks_album         ON tracks(album_id);
CREATE INDEX idx_track_artists_artist ON track_artists(artist_id);
