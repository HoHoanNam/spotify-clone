import { DestroyRef, Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { CatalogService } from '../core/api/catalog.service';
import { Track } from '../core/models';

export type RepeatMode = 'off' | 'all' | 'one';

/** Lets tests swap the real <audio> element for a fake. */
export const AUDIO_FACTORY = new InjectionToken<() => HTMLAudioElement>('AUDIO_FACTORY', {
  providedIn: 'root',
  factory: () => () => new Audio(),
});

const VOLUME_KEY = 'spotify-clone.volume';
/** A listen counts once the track has played this long (or ended, for shorter tracks). */
const COUNT_PLAY_AFTER_SEC = 30;
/** "Previous" restarts the current track if we are past this point, like Spotify. */
const RESTART_THRESHOLD_SEC = 3;

/**
 * Single app-wide player around one HTMLAudioElement. Lives for the whole app so music keeps playing
 * while the user navigates. The audio URL is /api/media/audio/{id}; the browser handles seeking via
 * HTTP Range requests on its own.
 */
@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly catalog = inject(CatalogService);
  private readonly audio = inject(AUDIO_FACTORY)();

  private readonly _queue = signal<Track[]>([]);
  /** Indexes into the queue in playback order (shuffled or not). */
  private readonly _order = signal<number[]>([]);
  private readonly _position = signal(-1);
  private readonly _isPlaying = signal(false);
  private readonly _currentTime = signal(0);
  private readonly _duration = signal(0);
  private readonly _volume = signal(readVolume());
  private readonly _muted = signal(false);
  private readonly _shuffle = signal(false);
  private readonly _repeat = signal<RepeatMode>('off');
  private playCounted = false;

  readonly queue = this._queue.asReadonly();
  readonly isPlaying = this._isPlaying.asReadonly();
  readonly currentTime = this._currentTime.asReadonly();
  readonly volume = this._volume.asReadonly();
  readonly muted = this._muted.asReadonly();
  readonly shuffle = this._shuffle.asReadonly();
  readonly repeat = this._repeat.asReadonly();

  readonly current = computed<Track | null>(() => {
    const index = this._order()[this._position()];
    return index === undefined ? null : (this._queue()[index] ?? null);
  });
  /** Prefer the real duration from the file; fall back to the catalog value while metadata loads. */
  readonly duration = computed(() => this._duration() || this.current()?.durationSec || 0);
  readonly progress = computed(() => (this.duration() ? this._currentTime() / this.duration() : 0));
  readonly hasNext = computed(() => this._position() < this._order().length - 1 || this._repeat() === 'all');
  readonly hasPrevious = computed(() => this.current() !== null);

  constructor() {
    const a = this.audio;
    a.preload = 'auto';
    a.volume = this._volume();
    const on = (event: string, handler: () => void) => a.addEventListener(event, handler);
    on('play', () => this._isPlaying.set(true));
    on('pause', () => this._isPlaying.set(false));
    on('durationchange', () => this._duration.set(Number.isFinite(a.duration) ? a.duration : 0));
    on('timeupdate', () => {
      this._currentTime.set(a.currentTime);
      if (a.currentTime >= COUNT_PLAY_AFTER_SEC) this.countPlay();
    });
    on('ended', () => this.onEnded());
    on('error', () => this._isPlaying.set(false));

    inject(DestroyRef).onDestroy(() => a.pause());
  }

  /** Replace the queue with `tracks` and start at `startIndex` (Spotify: clicking a row in a list). */
  playTracks(tracks: Track[], startIndex = 0): void {
    if (!tracks.length) return;
    this._queue.set([...tracks]);
    const order = tracks.map((_, i) => i);
    if (this._shuffle()) {
      const rest = shuffled(order.filter((i) => i !== startIndex));
      this._order.set([startIndex, ...rest]);
      this.load(0);
    } else {
      this._order.set(order);
      this.load(startIndex);
    }
  }

  /** Play/pause the given list: resumes if it is already the current one. */
  toggleTracks(tracks: Track[], startIndex = 0): void {
    if (this.isCurrentList(tracks)) {
      this.toggle();
    } else {
      this.playTracks(tracks, startIndex);
    }
  }

  toggle(): void {
    if (!this.current()) return;
    if (this.audio.paused) {
      this.startPlayback();
    } else {
      this.audio.pause();
    }
  }

  next(): void {
    const position = this._position();
    if (position < this._order().length - 1) {
      this.load(position + 1);
    } else if (this._repeat() === 'all' && this._order().length) {
      this.load(0);
    }
  }

  previous(): void {
    const position = this._position();
    if (this.audio.currentTime > RESTART_THRESHOLD_SEC || position <= 0) {
      this.seek(0);
    } else {
      this.load(position - 1);
    }
  }

  seek(seconds: number): void {
    if (!this.current()) return;
    this.audio.currentTime = Math.max(0, Math.min(seconds, this.duration()));
    this._currentTime.set(this.audio.currentTime);
  }

  setVolume(volume: number): void {
    const v = Math.max(0, Math.min(1, volume));
    this.audio.volume = v;
    this._volume.set(v);
    if (v > 0 && this._muted()) this.toggleMute();
    try {
      localStorage.setItem(VOLUME_KEY, String(v));
    } catch {
      // ignore
    }
  }

  toggleMute(): void {
    const muted = !this._muted();
    this.audio.muted = muted;
    this._muted.set(muted);
  }

  toggleShuffle(): void {
    const enable = !this._shuffle();
    this._shuffle.set(enable);
    const order = this._order();
    if (!order.length) return;
    const currentIndex = order[this._position()];
    const all = this._queue().map((_, i) => i);
    if (enable) {
      // keep the current track playing, shuffle the rest after it
      this._order.set([currentIndex, ...shuffled(all.filter((i) => i !== currentIndex))]);
      this._position.set(0);
    } else {
      this._order.set(all);
      this._position.set(currentIndex);
    }
  }

  cycleRepeat(): void {
    const nextMode: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' };
    this._repeat.update((mode) => nextMode[mode]);
  }

  isCurrent(trackId: number): boolean {
    return this.current()?.id === trackId;
  }

  /** True when the queue is exactly this list (same ids, same order) — used by big "play" buttons. */
  isCurrentList(tracks: Track[]): boolean {
    const queue = this._queue();
    return queue.length === tracks.length && queue.every((t, i) => t.id === tracks[i].id) && this.current() !== null;
  }

  private load(position: number): void {
    this._position.set(position);
    const track = this.current();
    if (!track) return;
    this.playCounted = false;
    this._duration.set(0);
    this._currentTime.set(0);
    this.audio.src = track.audioUrl;
    this.startPlayback();
    this.updateMediaSession(track);
  }

  private startPlayback(): void {
    // play() rejects if the browser blocks autoplay or the source fails; state follows the media events.
    this.audio.play()?.catch(() => this._isPlaying.set(false));
  }

  private onEnded(): void {
    this.countPlay();
    if (this._repeat() === 'one') {
      this.playCounted = false;
      this.seek(0);
      this.startPlayback();
    } else if (this.hasNext()) {
      this.next();
    } else {
      this._isPlaying.set(false);
    }
  }

  private countPlay(): void {
    const track = this.current();
    if (this.playCounted || !track) return;
    this.playCounted = true;
    this.catalog.recordPlay(track.id).subscribe({ error: () => undefined });
  }

  /** OS media keys / lock screen controls. */
  private updateMediaSession(track: Track): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artists.map((a) => a.name).join(', '),
      album: track.album?.title ?? '',
      artwork: track.coverUrl ? [{ src: track.coverUrl, sizes: '512x512' }] : [],
    });
    navigator.mediaSession.setActionHandler('play', () => this.toggle());
    navigator.mediaSession.setActionHandler('pause', () => this.toggle());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
  }
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function readVolume(): number {
  try {
    const stored = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(stored) && stored > 0 && stored <= 1 ? stored : 0.7;
  } catch {
    return 0.7;
  }
}
