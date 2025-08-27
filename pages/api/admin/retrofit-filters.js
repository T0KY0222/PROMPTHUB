import prisma from '../../../lib/prisma'

function stripAtMentions(str = '') {
  return String(str)
    .replace(/(^|\s)@[^\s.,;:!?)\]}]+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function deriveFiltersFromTitle(title) {
  const t = (title || '').toLowerCase()
  const tags = new Set(['Chat'])
  const add = (...xs) => xs.forEach(x => x && tags.add(x))

  if (/translator|pronunciation|morse/.test(t)) add('Education', 'Language')
  if (/teacher|tutor|instructor|academician|educational content/.test(t)) add('Education')
  if (/reviewer|critic|analyzer|statistician|fallacy|data visualizer|analyst/.test(t)) add('Analysis')
  if (/tester|qa|sql terminal|linux terminal|javascript console/.test(t)) add('Testing', 'Technology')
  if (/prompt generator|title generator|essay writer|storyteller|poet|rapper|screenwriter|novelist|content/.test(t)) add('Documentation', 'Writing')
  if (/security|password/.test(t)) add('Security', 'Technology')
  if (/architect/.test(t)) add('Architecture', 'Technology')

  if (/interview/.test(t)) add('Interview')
  if (/coach|motivational|life coach|debate coach|elocutionist|yogi|personal trainer/.test(t)) add('Coaching')
  if (/debate|debater/.test(t)) add('Debate')
  if (/design|ux|ui|interior|florist|artist/.test(t)) add('Design')
  if (/composer|rapper|poet|musician|music/.test(t)) add('Music')
  if (/doctor|dentist|psychologist|therapist|mental health|dietitian|ai assisted doctor|hypnotherapist/.test(t)) add('Health')
  if (/recruiter|career|interview/.test(t)) add('Business')
  if (/accountant|investment|financial|analyst/.test(t)) add('Finance', 'Business')
  if (/ethereum|blockchain|solidity/.test(t)) add('Programming', 'Blockchain')
  if (/programmer|developer|console|terminal|sql/.test(t)) add('Programming', 'Technology')
  if (/travel/.test(t)) add('Travel', 'Everyday Tasks')
  if (/magician|storyteller|game|tic-tac-toe|adventure/.test(t)) add('Entertainment')
  if (/self-help|gnomist|aphorism|influencer|social media|domain name/.test(t)) add('Marketing', 'Everyday Tasks')
  if (/chef|diet/.test(t)) add('Food', 'Everyday Tasks')
  if (/mechanic|automobile/.test(t)) add('Automotive', 'Everyday Tasks')

  return Array.from(tags)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method not allowed')
  }
  const secret = process.env.SEED_SECRET || ''
  if (!secret || req.headers['x-seed-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { category = 'gpt', onlyEmpty = true } = req.body || {}

  const where = { category }
  if (onlyEmpty) where.filters = { equals: [] }

  const list = await prisma.prompt.findMany({ where })
  let updated = 0
  for (const p of list) {
    const title = stripAtMentions(p.title || '')
    const nextFilters = deriveFiltersFromTitle(title)
    if (!nextFilters || nextFilters.length === 0) continue
    await prisma.prompt.update({ where: { id: p.id }, data: { filters: nextFilters } })
    updated++
  }
  return res.status(200).json({ scanned: list.length, updated })
}
