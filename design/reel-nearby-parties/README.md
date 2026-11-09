# Nearby parties: app clips for the reel (9 Nov 2026)

These are real app screens in demo mode, with sample data only. The phone screen is 360×640 at 2× (720×1280),
MP4, 30 fps, with no cursor. The only phone number shown is a fake one (+91 0000000001).

| Clip | Length | What it shows |
|---|---|---|
| `a-host-opens.mp4` | 6.0 s | A host opens a party to people nearby. She switches it on and sets the guest limit (6), a ₹300 chip-in covering food, snacks and music, the money and alcohol line, women only, and 2 km. |
| `b-guest-finds.mp4` | 4.0 s | Someone nearby scrolls to "Parties near you". Each card shows the area, the distance and the spots left. |
| `c-request.mp4` | 5.8 s | On "Board games and chai" she types a note and taps Request to join. It shows "Asked to join". |
| `d-host-accepts.mp4` | 4.1 s | The host's "Requests from nearby" list, and the tap on Accept. |
| `e-guest-unlocks.mp4` | 5.4 s | The guest's view as the host accepts: the address, Directions in Google Maps, Call / WhatsApp, and the check-in code. |

To re-record, serve the app in demo mode on port 8766 (as `flatmates/tests/demo/run.sh` does on 8765), then run
`node record.js <out-dir>`. It writes timed PNG frames from Chrome's screencast and an ffmpeg concat list per clip.
Then encode each clip:
`ffmpeg -f concat -safe 0 -i <dir>/list.txt -t 6 -vf "scale=720:1280:flags=lanczos,fps=30,format=yuv420p" -c:v libx264 -crf 20 <clip>.mp4`
