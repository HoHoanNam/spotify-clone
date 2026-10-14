import { Pipe, PipeTransform } from '@angular/core';

/** 185 → "3:05" (track rows, player). */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(seconds: number | null | undefined): string {
    const total = Math.max(0, Math.floor(seconds ?? 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
  }
}

/** 2720 → "45 min 20 sec", 3900 → "1 hr 5 min" (album header). */
@Pipe({ name: 'longDuration' })
export class LongDurationPipe implements PipeTransform {
  transform(seconds: number | null | undefined): string {
    const total = Math.max(0, Math.floor(seconds ?? 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h} hr ${m} min`;
    return m > 0 ? `${m} min ${s} sec` : `${s} sec`;
  }
}
