import { Pipe, PipeTransform } from '@angular/core';

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** "Date added" column like Spotify: "5 minutes ago", "3 days ago", then "Oct 14, 2026". */
@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | null | undefined, now = Date.now()): string {
    if (!value) return '';
    const time = new Date(value).getTime();
    const minutes = Math.floor((now - time) / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    return DATE.format(time);
  }
}
