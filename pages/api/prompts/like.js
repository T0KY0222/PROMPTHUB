export default async function handler(req, res) {
  // Likes feature has been removed. Endpoint deprecated.
  res.setHeader('Cache-Control', 'no-store')
  return res.status(410).json({ error: 'Likes feature removed' })
}
