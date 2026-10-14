import { DurationPipe, LongDurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it('formats minutes and seconds', () => {
    expect(pipe.transform(0)).toBe('0:00');
    expect(pipe.transform(5)).toBe('0:05');
    expect(pipe.transform(185)).toBe('3:05');
    expect(pipe.transform(185.9)).toBe('3:05');
  });

  it('adds hours when needed', () => {
    expect(pipe.transform(3725)).toBe('1:02:05');
  });

  it('treats missing values as zero', () => {
    expect(pipe.transform(null)).toBe('0:00');
    expect(pipe.transform(undefined)).toBe('0:00');
  });
});

describe('LongDurationPipe', () => {
  const pipe = new LongDurationPipe();

  it('formats album totals like Spotify', () => {
    expect(pipe.transform(42)).toBe('42 sec');
    expect(pipe.transform(2720)).toBe('45 min 20 sec');
    expect(pipe.transform(3900)).toBe('1 hr 5 min');
  });
});
