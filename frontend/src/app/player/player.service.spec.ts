import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CatalogService } from '../core/api/catalog.service';
import { Track } from '../core/models';
import { AUDIO_FACTORY, PlayerService } from './player.service';

/** Minimal stand-in for HTMLAudioElement: jsdom cannot play media. */
class FakeAudio extends EventTarget {
  src = '';
  currentTime = 0;
  duration = NaN;
  volume = 1;
  muted = false;
  paused = true;
  preload = '';

  play(): Promise<void> {
    this.paused = false;
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  end(): void {
    this.dispatchEvent(new Event('ended'));
  }

  removeAttribute(name: string): void {
    if (name === 'src') this.src = '';
  }
}

function track(id: number): Track {
  return {
    id,
    title: `Track ${id}`,
    durationSec: 200,
    trackNumber: id,
    artists: [{ id: 1, name: 'Artist', imageUrl: null }],
    album: null,
    coverUrl: null,
    audioUrl: `/api/media/audio/${id}`,
    playCount: 0,
  };
}

describe('PlayerService', () => {
  let audio: FakeAudio;
  let player: PlayerService;
  let recordPlay: ReturnType<typeof vi.fn>;
  const tracks = [track(1), track(2), track(3)];

  beforeEach(() => {
    localStorage.clear();
    audio = new FakeAudio();
    recordPlay = vi.fn(() => of(undefined));
    TestBed.configureTestingModule({
      providers: [
        { provide: AUDIO_FACTORY, useValue: () => audio as unknown as HTMLAudioElement },
        { provide: CatalogService, useValue: { recordPlay } },
      ],
    });
    player = TestBed.inject(PlayerService);
  });

  it('plays the chosen track of a list', () => {
    player.playTracks(tracks, 1);

    expect(player.current()?.id).toBe(2);
    expect(audio.src).toBe('/api/media/audio/2');
    expect(player.isPlaying()).toBe(true);
  });

  it('moves through the queue and stops at the end', () => {
    player.playTracks(tracks, 1);
    player.next();
    expect(player.current()?.id).toBe(3);
    expect(player.hasNext()).toBe(false);

    player.next();
    expect(player.current()?.id).toBe(3);
  });

  it('wraps around with repeat all', () => {
    player.playTracks(tracks, 2);
    player.cycleRepeat(); // off → all
    audio.end();
    expect(player.current()?.id).toBe(1);
  });

  it('replays the same track with repeat one', () => {
    player.playTracks(tracks, 0);
    player.cycleRepeat(); // all
    player.cycleRepeat(); // one
    audio.currentTime = 200;
    audio.end();
    expect(player.current()?.id).toBe(1);
    expect(audio.currentTime).toBe(0);
  });

  it('restarts the track on previous after 3 seconds, otherwise goes back', () => {
    player.playTracks(tracks, 1);
    audio.currentTime = 10;
    player.previous();
    expect(player.current()?.id).toBe(2);
    expect(audio.currentTime).toBe(0);

    player.previous();
    expect(player.current()?.id).toBe(1);
  });

  it('keeps the current track first when shuffling and restores order after', () => {
    player.playTracks(tracks, 1);
    player.toggleShuffle();
    expect(player.current()?.id).toBe(2);

    player.toggleShuffle();
    expect(player.current()?.id).toBe(2);
    player.next();
    expect(player.current()?.id).toBe(3);
  });

  it('counts a play once after 30 seconds', () => {
    player.playTracks(tracks, 0);
    audio.currentTime = 31;
    audio.dispatchEvent(new Event('timeupdate'));
    audio.dispatchEvent(new Event('timeupdate'));
    audio.end();

    expect(recordPlay).toHaveBeenCalledTimes(1);
    expect(recordPlay).toHaveBeenCalledWith(1);
  });

  it('toggles the same list instead of restarting it', () => {
    player.playTracks(tracks, 0);
    player.toggleTracks(tracks);
    expect(player.isPlaying()).toBe(false);
    expect(player.current()?.id).toBe(1);
  });

  it('plays queued tracks before the rest of the list, then continues the list', () => {
    player.playTracks(tracks, 0);
    player.addToQueue([track(9)]);
    expect(player.upNext().map((t) => t.id)).toEqual([2, 3]);

    player.next();
    expect(player.current()?.id).toBe(9);
    expect(player.manualQueue()).toEqual([]);

    player.next();
    expect(player.current()?.id).toBe(2);
  });

  it('goes back to the list track when pressing previous on a queued track', () => {
    player.playTracks(tracks, 1);
    player.addToQueue([track(9)]);
    player.next();
    player.previous();
    expect(player.current()?.id).toBe(2);
  });

  it('starts playing right away when queueing with nothing playing', () => {
    player.addToQueue([track(7)]);
    expect(player.current()?.id).toBe(7);
    expect(player.isPlaying()).toBe(true);
  });

  it('jumps within the queue and the list', () => {
    player.playTracks(tracks, 0);
    player.addToQueue([track(7), track(8)]);
    player.playFromQueue(1);
    expect(player.current()?.id).toBe(8);
    expect(player.manualQueue()).toEqual([]);

    player.playUpNext(1);
    expect(player.current()?.id).toBe(3);
  });

  it('restores the saved session of the same user, paused', () => {
    player.restore(42);
    player.playTracks(tracks, 2, { label: 'Album' });
    player.reset();
    expect(player.current()).toBeNull();

    audio.paused = true;
    player.restore(42);
    expect(player.current()?.id).toBe(3);
    expect(player.context()?.label).toBe('Album');
    expect(audio.src).toBe('/api/media/audio/3');
    expect(player.isPlaying()).toBe(false);

    player.reset();
    player.restore(7); // another user on the same browser
    expect(player.current()).toBeNull();
  });
});
