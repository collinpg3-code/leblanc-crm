// Builds a basic sales brief from a lead's raw notes when the Lead Scout job
// hasn't written a full one yet. Redesign first, security as the supporting point.

const has = (text, re) => re.test(text)

// Default closing plan when the lead finder hasn't written a custom one.
export function defaultWinPlan(lead, brief) {
  const redesign = /redesign/i.test(brief.recommendedService || '')
  return {
    offer: redesign
      ? 'Offer a free homepage mockup. Seeing their own business on a new site does the selling for you.'
      : 'Offer the $100 security check, and credit it toward any fixes or a redesign if they go ahead.',
    closers: [
      'Ask: "What would a few extra calls a week be worth to you?" Let them put the number on it.',
      'Show them their site and one of our demos side by side on your phone.',
      'Make the next step tiny: "Can I send you a free mockup this week? No commitment."',
      'Mention we are local and small, so they deal with you directly, not a call center.'
    ],
    objections: [
      { objection: "It's too expensive", response: "We're a small local team, so we're a lot friendlier on price than big agencies. Tell me your budget and I'll build a plan around it. We can also start small and grow it." },
      { objection: 'We already have a web person', response: "No problem. I'm happy to give you a free second opinion on the site. If your web person wants to handle the fixes, I'll hand them the list." },
      { objection: 'Not right now', response: 'Totally fair. Can I send a free mockup so you have it when the timing is right? I will check back in a couple of months.' },
      { objection: 'Our site works fine', response: `It does work, and most people would say the same. The question is how many people leave before they call. On a phone, ${(brief.websiteNeeds?.[0] || 'small things').toLowerCase()} can cost you customers without you ever knowing.` }
    ]
  }
}

export function fallbackBrief(lead) {
  const text = [lead.findings, lead.notes, lead.stack].filter(Boolean).join(' ').toLowerCase()
  const name = lead.name || 'this business'
  const industry = lead.industry && lead.industry !== 'Unknown' ? lead.industry.split(/[/(]/)[0].trim() : 'local'
  const takesData = has(text, /form|booking|book |patient|intake|payment|checkout|account|login/)

  const securityIssues = []
  if (has(text, /http:\/\/|mixed content|not https|no https|without https/)) {
    securityIssues.push({ priority: 'high', issue: 'Parts of the site are not encrypted', whyItMatters: 'Browsers can warn visitors the site is "Not secure", and form details can be read in transit.' })
  }
  if (has(text, /outdated|old version|exposed version|version string|wp \d|wordpress \d|jquery \d|php\/?\s?[57]/)) {
    securityIssues.push({ priority: takesData ? 'high' : 'medium', issue: 'Outdated website software is visible', whyItMatters: 'Old versions have known holes that automated attacks look for.' })
  }
  if (has(text, /header|csp|x-frame|hsts|clickjack/)) {
    securityIssues.push({ priority: 'low', issue: 'Basic browser protections are switched off', whyItMatters: 'Simple settings that block common tricks are missing.' })
  }
  if (takesData && securityIssues.length) {
    securityIssues.unshift({ priority: 'high', issue: 'Their forms collect customer details', whyItMatters: 'Any weakness above puts their customers\' information at risk.' })
  }

  const websiteNeeds = []
  if (has(text, /refresh|dated|outdated design|old design|copyright 20(0|1)|template/)) websiteNeeds.push('A modern design that matches the quality of their work')
  if (has(text, /mobile|responsive|not mobile/)) websiteNeeds.push('A layout that works properly on phones')
  if (has(text, /slow|speed|heavy/)) websiteNeeds.push('Faster load times')
  if (!has(text, /book|booking|schedule|appointment/)) websiteNeeds.push('Online booking or a clear quote/contact form')
  websiteNeeds.push('Clear "call", "book" and "get a quote" buttons on every page')
  if (websiteNeeds.length < 3) websiteNeeds.unshift('A modern, professional redesign')

  const recommendedService = securityIssues.length && websiteNeeds.length > 2 ? 'Redesign + Security'
    : securityIssues.some(i => i.priority === 'high') ? 'Redesign + Security' : 'Website Redesign'

  return {
    auto: true,
    summary: `${name} is a ${industry} business${lead.location && lead.location !== 'Unknown' ? ` in ${lead.location.split(',').slice(-2).join(',').trim()}` : ''}. ${securityIssues.length ? 'Their site shows a few security warning signs, and it' : 'Their site'} could be doing more to turn visitors into customers.`,
    recommendedService,
    opener: `Hi, this is Collin with LeBlanc Solutions. I was looking at ${name}'s website and noticed a few things that could be costing you customers. Do you have two minutes?`,
    websiteNeeds,
    benefits: [
      'More calls and bookings from people who find them online',
      'A site that looks as professional as their work',
      'Easy to use on a phone, where most visitors are',
      'Security built in, so they are not the easy target'
    ],
    securityIssues,
    talkingPoints: [
      'Ask how most new customers find them today',
      `Point out: ${websiteNeeds[0].toLowerCase()}`,
      securityIssues[0] ? `Mention the top security concern: ${securityIssues[0].issue.toLowerCase()}` : 'Mention that every site we build is security-tested before launch',
      'Show a demo: leblancsols.com (Our work section)',
      'Offer a free redesign quote (or a $100 security check)',
      'Book a 15-minute follow-up call'
    ],
    pitch: `We build modern websites for ${industry} businesses, and every one is secure from day one. Right now your site could be doing more for you. We'd give it a clean, modern look that works on any phone and makes it easy for customers to call or book. We'd also close the security gaps while we're at it. I can send you a free quote this week.`
  }
}
