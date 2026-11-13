# DPDP: what the law asks that FindMeFlatMate doesn't do yet

Teche, 10 Nov 2026, for Kamal. Draft for a lawyer's review; this is not legal advice. Not published (repo-root `design/`).

**Timing.** The DPDP Rules were notified on 13 Nov 2025. Most duties (notice, consent, security, breach, rights, grievance) start
18 months later, about **13 May 2027**. Section 43A of the IT Act (the 2011 "reasonable security practices" rules) stays until then.
So none of the gaps below is overdue today, but several are big enough to start now.

**The data audit** (every field, who sees it, how long, what deletion removes) was checked against `schema.sql`, the edge functions and
`index.html` on main, and the new `privacy.html` follows it. Things the old policy had wrong, now fixed in the text: codes go on WhatsApp
(Meta) or SMS (MSG91), not "an SMS provider"; Google Maps/Places is live (not OpenStreetMap); listings need sign-in; party invite links
show the address to anyone with the link; full name is stored; gender, last-active time, phone-verified, help tickets and IP addresses
were missing; device data stays after sign-out; Razorpay gets name and number.

| # | Gap | Size | Recommendation |
|---|---|---|---|
| 1 | **Notice at the point of consent.** Sign-in shows "Signing in means you agree to our privacy policy" with a link. The Rules want a notice that stands on its own: itemised data, purposes, how to withdraw and complain. | Medium | A short notice card on the sign-in screen (5 lines + link), and an explicit "I agree" tick next to the 18+ tick. **Touches the login screen: your call.** |
| 2 | **Withdrawing as easily as giving.** Only "delete account" withdraws everything; parts can be switched off in Account. | Small | OK as is if the policy says so (it now does). Optional: a "Withdraw consent" row in Account that explains and leads to delete. |
| 3 | **Access (a summary of my data).** No download; email only. | Medium | A "Download my data" button (a JSON file from one database function). Until then, email within the response time. |
| 4 | **Correction.** Name and a listing's private contact/address can't be changed in the app. | Small | Keep by email (the policy says so), or allow a name change once with a confirm step. |
| 5 | **Erasure / account deletion.** In-app deletion works and removes almost everything. Left behind: party RSVP names, Flatsplits records others share (by design), unlinked payment records (tax law), sign-in/IP logs for ~2 days. Photos are deleted best-effort from the app, so a failure can leave files. | Small | Delete photos on the server side too (a database trigger or a nightly clean-up), and blank the name on RSVPs when an account is deleted. |
| 6 | **Grievance redressal.** A named officer and email exist; no postal address; help tickets are deleted with the account (so a grievance record vanishes). Response times promised: 24 h / 15 days (the Rules' outer limit is 90 days). | Small | Fill the [TO FILL]s; keep ticket records for a set time after deletion (with the name removed), so complaints can be answered. |
| 7 | **Breach notification** to users and the Data Protection Board (Section 8(6), Rule 7: without delay, a detailed report within 72 hours). No process exists. | Medium | A one-page plan: who decides, the template message, how to email/notify all users, the Board's form. Supabase's logs are our only evidence today. |
| 8 | **Deleting when the purpose is over / inactivity.** Nothing is deleted for inactivity; data lives until the account is deleted. The Third Schedule's 3-year inactivity rule names large e-commerce, gaming and social media platforms (2 crore+ users), so it likely doesn't apply to us now; the general duty to erase once the purpose is served (Section 8(7)) does. | Medium | Delete (after a 48-hour warning) accounts unused for, say, 2 years; drop listings closed for 6 months. Needs a scheduled job (pg_cron), which we don't have yet. |
| 9 | **Children (Section 9): 18+ only.** Server refuses a code without the 18+ tick; self-declared, no ID check. | Small | Enough for an adults-only service, with "tell us and we'll delete" (in the policy). |
| 10 | **Notice in English or an Eighth Schedule language on request** (Section 5(3)). | Small | The policy now offers it by email. Optional: a Hindi version. |
| 11 | **Security safeguards and logs (Section 8(5), Rule 6: encryption, access control, logs kept a year).** Strong on access control (RLS on all 36 tables, functions only, secrets server-side). Missing: an access log of the team's use of the database, a written list of who has access, known backups, and the test sign-in still on. | Medium | Switch off test sign-in before launch; write down who has access; turn on Supabase backups (paid plan) and log retention; keep logs a year. |
| 12 | **Processor contracts (Section 8(2)).** We use Supabase, Meta, MSG91, Razorpay, Google and GitHub on their standard terms. | Small | Accept each one's data processing addendum (most are click-through) and keep copies. |
| 13 | **Party invite links show the exact address to anyone with the link.** Disclosed now, but a risk if a link is forwarded. | Medium | Show the address only to accepted guests, like rooms. |
| 14 | **Android `allowBackup`** lets the phone's backup include app data. | Small | Disclosed now; or set `allowBackup="false"`. |
| 15 | **Ads tags (Meta Pixel, Google)** are off. If switched on, they need a notice and consent for the website. | Small | Keep off, or add a consent banner first. |

**Decisions for you:** fill the [TO FILL]s (legal entity, grievance officer, postal address, response times, jurisdiction city,
backups, who has access, security contact); gap 1 (the login screen is yours); and which of 3, 5, 7, 8, 11, 13 to build first.
My order: 11 (test sign-in off, backups), 7, 13, 5, 1, 3, 8.

## Sources (seen 10 Nov 2026)

My session can't open indiacode.nic.in, meity.gov.in or dpdpa.com (blocked by its network), so the sections below come from
search-engine extracts and law-firm summaries, not the gazette text. Check each against the official text.

- DPDP Act 2023 (official PDF, not opened): https://www.indiacode.nic.in/bitstream/123456789/22037/2/a2023-22.pdf
  Sections used: 5 notice, 5(3) languages, 6 consent and withdrawal, 7 legitimate uses, 8(2) processors, 8(5) safeguards,
  8(6) breach, 8(7) erasure, 8(8) grievance, 9 children (under 18), 11 access, 12 correction and erasure, 13 grievance, 14 nomination.
- DPDP Rules 2025, Rules 3 notice, 6 security and one-year logs, 7 breach (72 hours), 8 and Third Schedule (inactivity erasure, 48-hour
  warning), 14 rights and 90-day grievance limit; commencement 18 months after 13 Nov 2025:
  https://www.india-briefing.com/news/dpdp-rules-2025-india-data-protection-law-compliance-40769.html/ ;
  https://www.scconline.com/blog/post/2025/12/26/digital-personal-data-protection-rules-2025-key-highlights/ ;
  https://www.dsci.in/files/content/knowledge-centre/2025/Insight-Brief-on-DPDP-Rules.pdf (not opened; search extract)
- Section 43A IT Act omitted by DPDP Section 44(2) from about 13 May 2027 (one source says 14 Nov 2026; check):
  https://ksandk.com/data-protection-and-data-privacy/what-happens-spdi-rules-after-dpdp-enforcement/
