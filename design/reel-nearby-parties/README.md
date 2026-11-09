# Nearby parties: app clips for the reel (9 Nov 2026)

These are real app screens in demo mode, with sample data only. The phone screen is 360×640 at 2× (720×1280),
MP4, 30 fps, with no cursor. The only phone number shown is a fake one (+91 0000000001).

**Free parties only** (Kamal, 9 Nov): every party in these clips is free, and no chip-in shows anywhere. In clip a the
recording hides the editor's Entry row (Free / Chip-in), the money line and the friends' "Extras: … chip in" row.
The app itself still shows them. Clips b, c and e make the demo's sample parties free in the page while recording
(record.js, demo only; the app's demo data is unchanged). c and e use "India vs Australia on the big screen".
While each clip records, record.js checks the visible text every 100 ms for "chip" or "₹". The last run found none in
any clip, and a one-frame-per-second check found none either.

| Clip | Length | What it shows |
|---|---|---|
| `a-host-opens.mp4` | 5.0 s | A host opens a free party to people nearby: she switches it on, sets 6 guests, women only and 2 km. |
| `b-guest-finds.mp4` | 4.0 s | Someone nearby scrolls to "Parties near you". Each card shows the area, the distance and the spots left. |
| `c-request.mp4` | 5.7 s | On "India vs Australia on the big screen" (free) she types a note and taps Request to join. It shows "Asked to join". |
| `d-host-accepts.mp4` | 4.0 s | The host's free party (8 pm), her "Requests from nearby" list, and the tap on Accept. |
| `e-guest-unlocks.mp4` | 5.3 s | The guest's view as the host accepts: the address, Directions in Google Maps, Call / WhatsApp, and the check-in code. |

To re-record, serve the app in demo mode on port 8766 (as `flatmates/tests/demo/run.sh` does on 8765), then run
`node record.js <out-dir>`. It writes timed PNG frames from Chrome's screencast and an ffmpeg concat list per clip.
Then encode each clip:
`ffmpeg -f concat -safe 0 -i <dir>/list.txt -t 6 -vf "scale=720:1280:flags=lanczos,fps=30,format=yuv420p" -c:v libx264 -crf 20 <clip>.mp4`
