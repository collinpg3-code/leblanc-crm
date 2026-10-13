// Ready-to-send email drafts for a lead, written from its sales brief.
// Plain, short and human: one specific observation, one ask.
import { fallbackBrief } from './brief.js'

export const DEFAULT_SIGNATURE = `Collin
LeBlanc Solutions · leblancsols.com
contact@leblancsols.com
[Your mailing address — required by law for cold emails]`

const OPT_OUT = "P.S. If this isn't something you're thinking about, just reply \"no thanks\" and I won't follow up."

// Pick a stable variant per lead so drafts don't all read the same.
function pick(seed, options) {
  let h = 0
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return options[h % options.length]
}

function greetingName(lead) {
  const raw = (lead.decisionMaker?.name || '').trim()
  if (!raw || /partner|owner|manager|^the /i.test(raw)) return ''
  const clean = raw.replace(/,.*$/, '').trim()
  if (/^Dr\.?\s/i.test(clean)) {
    const parts = clean.replace(/^Dr\.?\s*/i, '').split(/\s+/)
    return `Dr. ${parts[parts.length - 1]}`
  }
  return clean.split(/\s+/)[0]
}

// Turn a "website need" from the brief into something you'd say out loud.
function observation(need, action) {
  const n = need.toLowerCase()
  const year = /©\s?(\d{4})/.exec(need)
  if (/mobile|phone/.test(n) && /not mobile|works on phones|layout that works/.test(n)) return "the site is hard to use on a phone, which is where most people will find you"
  if (year) return `the footer still says © ${year[1]}, which can make a site look like nobody's minding it`
  if (/online booking/.test(n)) return "there isn't a way to book online, so new clients have to call during office hours"
  if (/quote/.test(n)) return "there isn't a quick way to ask for a quote, which is usually the first thing people look for"
  if (/modern code|outdated layout/.test(n)) return "parts of the site are built on older code that's starting to show its age"
  if (/template/.test(n)) return "it's built on a template that a lot of other businesses use, so it's hard to stand out"
  if (/faster|loads about|lighter/.test(n)) return "the homepage is heavy, so it loads slowly on a phone"
  if (/from the homepage/.test(n)) return `it isn't easy to ${action} right from the homepage`
  return need.charAt(0).toLowerCase() + need.slice(1)
}

function actionFor(industry) {
  const i = (industry || '').toLowerCase()
  if (/dent|ortho|chiro|physical|therapy|vet|animal|spa|salon|med/.test(i)) return 'book an appointment'
  if (/hvac|heat|cool|plumb|roof|exterior|electric|landscap|contract|auto|body|detail/.test(i)) return 'request a quote'
  if (/law|attorney|legal|cpa|tax|account|realt/.test(i)) return 'request a consultation'
  return 'get in touch'
}

// "Preferred Roofing Services, LLC" -> "Preferred Roofing Services"; long multi-name firms -> null.
function shortName(name) {
  const n = String(name || '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/,?\s+(LLC|L\.L\.C\.|Inc\.?|PLC|PLLC|P\.C\.|Co\.)$/i, '').trim()
  return n.includes(',') || n.length > 32 ? null : n
}
const possessive = (n) => (/s$/i.test(n) ? `${n}'` : `${n}'s`)

export function emailDrafts(lead, signature = DEFAULT_SIGNATURE) {
  const brief = lead.brief || fallbackBrief(lead)
  const name = greetingName(lead)
  const hi = name ? `Hi ${name},` : 'Hi there,'
  const short = shortName(lead.name)
  const biz = short || 'your business'
  const site = short ? `${possessive(short)} website` : 'your website'
  const action = actionFor(lead.industry)
  const needs = (brief.websiteNeeds || []).filter(n => !/^clear "call"/i.test(n))
  const first = needs[0] ? observation(needs[0], action) : 'the site could be doing more to bring in new customers'
  const second = needs[1] ? observation(needs[1], action) : ''
  const issue = (brief.securityIssues || []).find(i => i.priority === 'high') || (brief.securityIssues || []).find(i => i.priority === 'medium')
  const sig = `\n\n${signature.trim()}\n\n${OPT_OUT}`
  const seed = lead.id || biz

  const drafts = [
    {
      id: 'first',
      label: 'First email',
      subject: pick(seed, [
        `Quick idea for ${site}`,
        `${name ? `${name}, a` : 'A'} quick thought on your website`,
        `${short ? site : 'Your website'}`
      ]),
      body: `${hi}

I was on ${site} this week and noticed ${first}.${second ? ` I also noticed ${second}.` : ''}

${pick(seed + 'b', [
  `I'm Collin, and I run LeBlanc Solutions, a small web studio right here in northern Michigan. Honestly, I'd love to help you with this. We build clean, modern websites that work great on phones and make it easy for people to ${action}, and every one is security-tested before it goes live.`,
  `I'm Collin with LeBlanc Solutions, a small local web studio. I'd really like to work with you on this. We build websites that look sharp, load fast on phones and make it easy to ${action}, with security built in from day one.`
])}

We're not a big expensive agency. We're local, we keep our prices friendly, and we're happy to work with whatever budget makes sense for you.

Could I put together a free mockup of a new homepage for ${biz}? No cost and no pressure. If you like it, we can talk. If not, no hard feelings.${sig}`
    },
    {
      id: 'followup',
      label: 'Follow-up (3–4 days later)',
      subject: `Re: ${pick(seed, [`Quick idea for ${site}`, 'A quick thought on your website', `${short ? site : 'Your website'}`])}`,
      body: `${hi}

Just bringing this back to the top of your inbox. I know running a business keeps you busy.

Here are two sample sites we built, one simple and one more high-end, so you can see the kind of work we do:
https://leblancsols.com/showcase/clean
https://leblancsols.com/showcase/premium

My offer still stands: a free homepage mockup for ${biz}, and a price that fits your budget if you want to go ahead. I'd genuinely enjoy working on this one. Would that be helpful?${sig}`
    },
    {
      id: 'final',
      label: 'Last follow-up',
      subject: `Should I close the loop?`,
      body: `${hi}

I haven't heard back, so I'll assume the timing isn't right, and that's completely fine.

If a new website (or a security check on the current one) moves up the list later, just reply to this email and I'll pick it up from there.

Thanks, and all the best.${sig}`
    }
  ]

  // Hand-tailored emails from the lead finder come first.
  const tailored = (brief.emails || []).map((e, i) => ({
    id: `custom-${i}`,
    label: `${e.label || 'Email'} (written for them)`,
    subject: e.subject,
    body: `${e.body.trim()}${sig}`
  }))
  if (tailored.length) drafts.unshift(...tailored)

  if (issue) {
    drafts.push({
      id: 'security',
      label: 'Security heads-up',
      subject: `A heads-up about ${site}`,
      body: `${hi}

I took a quick look at ${site} and wanted to give you a heads-up: ${issue.issue.replace(/^Server/, 'the server').replace(/^Some/, 'some').replace(/^The /, 'the ').replace(/^Their /, 'your ').replace(/^Basic/, 'basic')}. ${issue.whyItMatters || ''}

It's usually a quick fix. We do $100 security checks that list everything in plain English, ranked by what matters most, and we can fix it all for you if you'd like.

Want me to take a closer look?${sig}`
    })
  }

  drafts.push({
    id: 'aftercall',
    label: 'After a call',
    subject: `Great talking today — next steps`,
    body: `${hi}

Thanks for taking the time to talk today. Here's a quick recap:

- ${needs[0] ? needs[0].replace(/ \(.*\)$/, '') : 'A modern, mobile-friendly redesign'}
${needs[1] ? `- ${needs[1].replace(/ \(.*\)$/, '')}\n` : ''}- Security built in and tested before launch

Next step: I'll send over a quote. Before we start, I'll also send a short form that gives us permission to check your current website. It takes about three minutes to fill out.

Any questions in the meantime, just reply here.

${signature.trim()}`
  })

  return drafts
}
