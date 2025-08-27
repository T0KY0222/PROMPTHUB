import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function stripAtMentions(str = '') {
  return String(str)
    .replace(/(^|\s)@[^\s.,;:!?\)\]}]+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function deriveFiltersFromTitle(title) {
  const t = (title || '').toLowerCase()
  const tags = new Set()
  const add = (...xs) => xs.forEach(x => x && tags.add(x))
  if (/translator|pronunciation|morse|chinese|english|translate/.test(t)) add('Language', 'Education')
  if (/teacher|tutor|instructor|academician|educational content|chemistry/.test(t)) add('Education')
  if (/reviewer|critic|analyzer|statistician|fallacy|data visualizer|analyst/.test(t)) add('Analysis')
  if (/tester|qa|sql terminal|linux terminal|javascript console|codepen|html|css|javascript/.test(t)) add('Testing', 'Technology')
  if (/prompt generator|title generator|essay writer|storyteller|poet|rapper|screenwriter|novelist|content/.test(t)) add('Writing', 'Documentation')
  if (/security|password/.test(t)) add('Security', 'Technology')
  if (/architect|requirements|softgpt/.test(t)) add('Architecture', 'Technology')
  if (/interview|resume|career/.test(t)) add('Business')
  if (/coach|motivational|life coach|debate coach|elocutionist|yogi|personal trainer/.test(t)) add('Coaching')
  if (/debate|debater/.test(t)) add('Debate')
  if (/design|ux|ui|interior|artist|flowchart/.test(t)) add('Design')
  if (/composer|rapper|poet|musician|music/.test(t)) add('Music')
  if (/doctor|dentist|psychologist|therapist|mental health|dietitian/.test(t)) add('Health')
  if (/recruiter|career|interview/.test(t)) add('Business')
  if (/accountant|investment|financial|analyst|stock|trader|finviz|forex|crypto/.test(t)) add('Finance')
  if (/ethereum|blockchain|solidity|solana/.test(t)) add('Programming', 'Blockchain')
  if (/programmer|developer|console|terminal|sql|scss/.test(t)) add('Programming', 'Technology')
  if (/travel/.test(t)) add('Travel', 'Everyday Tasks')
  if (/magician|storyteller|game|tic-tac-toe|adventure|movie|tv/.test(t)) add('Entertainment')
  if (/self-help|influencer|social media|instagram|content strategy|marketing|traffic/.test(t)) add('Marketing')
  if (/chef|diet/.test(t)) add('Food', 'Everyday Tasks')
  if (/mechanic|automobile/.test(t)) add('Automotive', 'Everyday Tasks')
  return Array.from(tags)
}

async function main() {
  const list = await prisma.prompt.findMany({ where: { filters: { equals: [] } }, select: { id: true, title: true } })
  let updated = 0
  for (const p of list) {
    const title = stripAtMentions(p.title || '')
    const next = deriveFiltersFromTitle(title)
    if (!next || next.length === 0) continue
    await prisma.prompt.update({ where: { id: p.id }, data: { filters: next } })
    updated++
  }
  console.log(JSON.stringify({ scanned: list.length, updated }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
