---
name: find-leads
description: Dig hard for high-quality LeBlanc Solutions leads (website redesign first, security second) from public sources, score them, keep only the best, research the decision-maker and write tailored pitches, closing plans and emails. Use when the user wants new leads or the backlog needs refilling.
---

# find-leads — the hard-dig playbook

Quality over quantity. **Five leads that want us beat fifty that don't.** A lead is only worth adding if
Collin could call them tomorrow, point at something real on their website, and they'd care.

## Hard rules (never break)
- Public sources only. Never scan or probe sites (no hidden paths, admin URLs, port checks). Normal page visits + `scripts/score-sites.mjs` (Google Lighthouse, same as PageSpeed) only.
- Never contact a business. Never send email. Never use OpenOutreach.
- Never invent a business, person, number, email, review count or finding. Unverified = leave it out.
- People: only names/contact details the business publishes (its site, Google Business Profile, Michigan LARA filings, chamber/trade directory listings). No people-search/data-broker sites, no personal cell numbers or home addresses, no guessed email patterns.

## Collin's lead feedback (learn his taste)
Before digging, run `.\scripts\crm-backlog.ps1 -Feedback`. It lists what Collin did with past leads in the CRM:
`progressed:*` / `interested` = liked, `archived` / `deleted` / `not_interested` = disliked. Look for patterns
(niches, towns, kinds of website problems, whether an owner was named, score ranges) and lean toward what he
keeps. These are signals, not strict rules. Notes he gave directly (newest last):
- **Liked:** Hankwitz Heating & Cooling, Ludington. Family HVAC since 1975, named owners, Readers' Choice winner, no real website (domain forwards to a directory page).
- **Liked:** Corble Builders, Petoskey. Custom builder since 2002, Builder of the Year, visibly broken site features, owner's own email published.
- **Disliked:** the first generic batch (mostly fine-looking WordPress sites pulled from directories, weak signals, no named owner).

## 1. Who we want (ideal lead)
- **Location:** Michigan, northern Michigan first (Traverse City, Petoskey, Charlevoix, Harbor Springs, Gaylord, Cadillac, Alpena, Manistee, Ludington), then Grand Rapids/Lansing suburbs.
- **High-value niches first:** dental & orthodontics, med spas/aesthetics/dermatology, personal-injury/family/estate law, roofing, HVAC, plumbing, remodelers/builders, landscaping/hardscape, custom home builders, wedding venues, boutique hotels/resorts. Then chiro/PT, vets, CPAs, insurance agencies, real estate teams, auto body/detailing, salons/spas, restaurants.
- **Established and able to pay:** at least one of — 30+ Google reviews, 5+ years in business, 3+ staff, multiple locations, a physical office/showroom.
- **Website clearly hurting them:** see scoring. A business with lots of reviews but **no website at all** (only Facebook/Google profile) is a great lead.
- **Skip:** national franchises and chains, hospital/corporate-owned practices, sites built in the last ~2 years by a known agency (footer "website by …" with a current year and a strong score), businesses that look closed.

## 2. Dig (use many sources, not one)
For each niche + town combination:
- Web search like a customer: "<niche> <town> MI", "best <niche> near <town>", "<niche> <town> reviews". Work through Google/Bing local results, Yelp, BBB, Angi/Houzz (trades), Healthgrades/Zocdoc (health), state bar/Avvo (law), chamber of commerce member directories (Traverse Connect, Petoskey Regional Chamber, Gaylord Area Chamber, Cadillac Area Chamber, etc.).
- Hunt for tells in results and sites: "© 2015"-style footers, "Powered by" old builders, http:// sites, "Not secure", no booking/quote, Facebook-only presence, very few pages.
- Grab 3–4x more candidates than you need. You will throw most away.

## 3. Qualify ruthlessly
1. Put candidates in `clients/<batch>/candidates.json` as `[{ "business", "url", "industry", "location" }]`.
2. Score their sites (≈1 min each): `node scripts/score-sites.mjs clients/<batch>/candidates.json clients/<batch>/scores.json`
3. After research (step 4) run: `node scripts/lead-score.mjs clients/<batch>/leads.json clients/<batch>/scores.json clients/<batch>/leads.scored.json --min 50`
   It adds Google scores, a 0–100 `leadScore` and `whyJuicy`, sorts best first and drops weak leads. Need (50) + can pay (25) + can reach the decision-maker (25). Put review counts, years in business and red flags you saw (broken links, placeholder text, no phone number, "Not secure", outdated content) into public_flags/summary/websiteNeeds so the scorer counts them. Add "reviews": <number> when known.
   No-website businesses: set `brief.leadScore` yourself (65–80 if established) and explain in `whyJuicy`.
Only push leads that pass.

## 4. Research the keepers (2–4 normal page visits each)
- Home, About/Team/Our Doctors/Attorneys, Services, Contact.
- Capture: what they do best, how long in business, what they're proud of (family-owned, awards, local roots), how customers book/contact today, review count and rating if shown publicly, the decision-maker (rules above) and team size.
- Find **one local competitor with a better website** (online booking, modern, fast) — great pitch material ("<competitor> lets patients book online in 30 seconds").
- Note real security tells you saw (no HTTPS/"Not secure", outdated PHP/WordPress shown publicly, http resources, unencrypted forms).

## 5. Write it for them (Collin's voice)
Voice: warm, excited, local, plain English. Short sentences. Sound like a real person who genuinely wants to help this business — not a robot, not a pushy salesman. Say plainly we're a small local studio, affordable, flexible with budgets, happy to work with them. Every pitch and email must mention at least two specifics about THIS business (their services, town, years, something on their site, their competitor). No hype words ("revolutionary", "synergy"), no fake urgency, no claims you can't back up.

Example first email (style, not a template):
> Hi Dr. Jenicke,
> I was looking at Brilliant Smiles' website and loved reading that you've been caring for Cadillac families for over 20 years. One thing jumped out though: on a phone, there's no way to book a cleaning, and Google scores the site 34 out of 100 for mobile. Dr. Smith's office down the road lets patients book online in about 30 seconds.
> I'm Collin, I run LeBlanc Solutions, a small web studio here in northern Michigan. I'd honestly love to help you with this. We're not a pricey agency, and we'll work with whatever budget makes sense.
> Could I mock up a new homepage for Brilliant Smiles, free? If you like it, we talk. If not, no hard feelings.

## 6. Output format
`clients/<batch>/leads.json` — array of:
```json
{
  "business": "", "url": "https://...", "industry": "", "location": "Town, MI", "stack": "",
  "public_flags": "raw notes of what you saw",
  "contact": "main public phone / business email",
  "teamSize": 0, "locations": 1,
  "decisionMaker": { "name": "", "role": "", "phone": "", "email": "", "source": "", "confidence": "confirmed|likely", "howToReach": "" },
  "brief": {
    "summary": "2-3 sentences: who they are + what's holding the site back",
    "recommendedService": "Website Redesign | Redesign + Security | Security Check | Security Fixes",
    "opener": "first line for a call, specific to them",
    "websiteNeeds": ["3-5 specifics"],
    "benefits": ["3-4, in their business terms (more booked cleanings, more roof estimates...)"],
    "securityIssues": [{ "priority": "high|medium|low", "issue": "", "whyItMatters": "" }],
    "talkingPoints": ["5-7 ordered points for the call"],
    "pitch": "30-second pitch, specific to them",
    "winPlan": {
      "offer": "the specific opening offer (e.g. free homepage mockup, $100 check credited toward redesign)",
      "closers": ["3-4 tactics that fit THIS business"],
      "objections": [{ "objection": "", "response": "" }]
    },
    "emails": [
      { "label": "First email", "subject": "", "body": "no signature, it's added automatically" },
      { "label": "Follow-up", "subject": "", "body": "" },
      { "label": "Security heads-up", "subject": "", "body": "only if a real medium/high issue" }
    ]
  }
}
```
Then score (step 3) and push the scored file: `.\scripts\crm-backlog.ps1 -PushJson clients\<batch>\leads.scored.json`

## 7. Report
Leads kept vs dropped, the top 5 with one line each on why they're juicy, niches/towns covered, and any source that was especially productive.
