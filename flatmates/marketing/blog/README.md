# The blog: how to write and publish an article

The website's blog is at https://findmeflatmate.com/blog/. Its pages are made from the files in `posts/` by
`build.js`; nobody edits `flatmates/blog/` by hand. The product side of it (where it lives, what it must never say,
how it is checked) is in `flatmates/README.md`, "Blog".

**Who does what.** Mark writes or edits a file in `posts/`. Teche runs the script, checks the pages, and ships them
through a PR like any other change. The script refuses a file it can't read and says which line.

## The rules for every article

- **The voice** is the one in `../README.md`: plain, warm, a bit dry, short sentences, Indian English.
- **Facts only, with their source.** A number, a law, a figure or a reported case carries a numbered mark, `[^3]`,
  that points at the third line under `sources:`. No source, no claim. Market habits are called habits ("usually",
  "commonly"), not rules. Anything legal or to do with tax is hedged by state, and the article sets `legal: true`,
  which adds the "general information, not legal advice" line.
- **"Launching soon", never "download now"**, until Kamal says sign-up is open. The dark sheet at the foot of every
  page says it; an article doesn't need to.
- **The app's features stay out.** Kamal, 15 Nov: what the app does is shown after sign-in, not on the public pages.
  An article may say FindMeFlatMate helps you find flatmates who match your vibe, with no brokers, and that numbers
  stay private until both say yes (the home page says as much). It does not name or describe Flatsplits, FlatMart,
  Tribe, the Escape, the Move-in kit or how the score is worked out. `p35` fails if it does.
- **No photos, no religion.** Covers are drawn (our cartoon people round a dark disc).
- **One article, one job.** If the reader can't use it the same day (a list to tick, words to copy, a sum worked
  out, a decision made), it is not ready.

## The file

`posts/<date>-<address>.md`, for example `posts/2026-11-18-split-rent-fairly.md`. The date is the day it is
published; the rest becomes the page's address (`/blog/split-rent-fairly/`), so choose it once and don't change it.

A few lines of facts between two `---` lines, then the words:

```
---
title: Split the rent without falling out
kw: falling out
description: Equal isn't always fair. A simple way to split rent and bills between flatmates, with a calculator that does the sums.
lede: Equal isn't always fair, and "fair" is whatever the whole flat agrees to. Here is a simple way to get there.
rank: 1
topic: money
cover: split
featured: true
keywords: rent split calculator bills electricity ac
takeaways:
- Agree the split **before** anyone picks a room.
- Put it **in writing**.
sources:
- MoneyHelper: How to split rent and bills fairly | https://www.moneyhelper.org.uk/en/blog/utilities/how-to-split-rent-and-bills-fairly
---
```

| Line | What it is |
|---|---|
| `title` | The headline, under 70 characters. Also what search engines and shared links show |
| `kw` | The one key word (or two) of the headline that is set in the orange. It must be in the title |
| `description` | One or two sentences, under 160 characters: what a search result and a WhatsApp preview say |
| `lede` | The line under the headline on the page. Leave it out and the description is used |
| `topic` | One of `finding`, `money`, `living`, `safety`, `paperwork` |
| `cover` | Which drawn cover: `ask`, `split`, `paper`, `scam`, `rules`, `visit`, `homes`, `talk` (new ones are added in `build.js`, `COVERS`) |
| `rank` | Where it comes among articles of the same day (1 first). Leave out for "after the ranked ones" |
| `featured` | `true` on the one article that leads the blog's first page |
| `updated` | The day it was last changed, when that is not the day it was published |
| `legal` | `true` adds the "not legal or tax advice" line |
| `keywords` | Extra words the blog's search should find it by. Readers never see them |
| `takeaways` | "The short version": three to five lines |
| `sources` | `What it is \| https://address`, one per line, in the order the marks number them |

## The words

Blank lines separate things. What the script understands:

| Write | Get |
|---|---|
| `## A heading` | A section heading. These make "In this article" |
| `## A heading {#deposit}` | The same, with a name other pages can link to |
| `### A smaller heading` | A heading inside a section |
| `**bold**`, `*soft*` | **bold**, *soft* |
| `[words](https://address)` | A link to another site (opens in a new tab) |
| `[words](post:rental-scams-red-flags)` | A link to another article, by its address. `post:split-rent-fairly#split` goes to a named place in it |
| `[words](home:)` | A link to the home page, tagged so sign-ups from the blog can be counted |
| `[^2]` | The mark for source number 2 |
| `- a line` / `1. a line` | A list, plain or numbered |
| `> a sentence` | A line worth remembering, set large |
| `\| a \| b \|` rows | A table (a heading row, a row of dashes, then the rest). On a phone each row becomes a card |
| `---` on its own line | A thin rule |

And the boxes. Each starts with `:::name` and ends with `:::` on its own line:

```
:::note Good to know (or any title)
A cream panel with a dark "i".
:::

:::tip Worth doing
The same with an orange tick.
:::

:::warn Before you pay
The same in the app's crimson. For money and safety only.
:::

:::steps
1. **Call 1930, now.** The title is the bold part and ends with a full stop; the rest explains.
2. **File the complaint.** And so on.
:::

:::say
Not: You never clean.
Try: The bathroom was skipped twice. Can we swap weeks?
:::

:::checklist visit | The flat-visit checklist
# The room
- The door locks, and I would get my own key
# Water and power
- The taps run with decent pressure
:::

:::copy A message for the flat's group {#group-message}
Words the reader can copy or send on WhatsApp, exactly as written here.
:::

:::tool rent-split
One or two sentences saying how the split is worked out, shown to anyone whose browser runs no scripts.
:::
```

A checklist's name (`visit`) is how ticks are remembered on the reader's phone: don't change it once published. A
`{#name}` after a copy box's title lets the blog's first page point at it.

## Publishing

```
node flatmates/marketing/blog/build.js              # writes flatmates/blog/ and the blog's lines in sitemap.xml
node flatmates/marketing/blog/build.js --pictures   # also draws the share picture of any new or retitled article
flatmates/tests/demo/run.sh p35                     # the blog's checks
```

Then the usual: a branch, the full `tests/demo/run.sh`, a PR, merge, and the website's publish job. The blog is on
the website only. A change to the blog alone starts no Android build, and nothing of it is in the app.

`--pictures` needs Playwright (Chromium) and python3 with Pillow, like `tests/demo/og-image.js`. Each picture is
1200 x 630, reduced to 256 colours and kept under 300 KB so that WhatsApp shows it. `pictures.json` remembers what
each was drawn from; `build.js --check` (run by `p35`) fails if a title changed and its picture was not redrawn.

To take an article down, delete its file and run the script: its page and picture go, and so do its lines in the
sitemap and the feed.
