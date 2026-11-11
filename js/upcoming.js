// UPCOMING on RELEASES®: the drops that have a date but aren't out yet, soonest first.
// Read by the page (js/releases.js) and by the server (api/_notify.js), which only takes a
// NOTIFY ME for an id on this list whose date hasn't passed. Empty = the strip stays hidden.
// Only add a drop once the owner has named it and given it a date (previews stay unlisted).
//
// Each entry:
//   id     a short slug, never reused (it keys the NOTIFY ME list: notify:<id>)
//   label  the small line above the name, e.g. 'FW26 · DELIVERY 1' (a label, not the product name)
//   name   the drop's name as the owner writes it, e.g. 'GOOD® CRATE Nº004'
//   date   when it goes live (ISO, with the time zone)
//   href   where it lives once it's out; NOTIFY ME turns into AVAILABLE and links here
//
// Example (commented out on purpose; not a real drop):
// { id: 'example-fw26-d1', label: 'FW26 · DELIVERY 1', name: 'GOOD® CRATE Nº00X', date: '2026-12-01T17:00:00Z', href: '/releases' },
window.GOOD_UPCOMING = [
];
