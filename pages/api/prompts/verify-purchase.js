import prisma from '../../../lib/prisma'
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id, signature, buyer: suppliedBuyer } = req.body || {}
  if (!id || !signature) return res.status(400).json({ error: 'Missing id or signature' })

  console.log('verify-purchase called with id=', id, 'signature=', signature)

  const prompt = await prisma.prompt.findUnique({ where: { id } })
  if (!prompt) return res.status(404).json({ error: 'Prompt not found' })

  try {
    const connection = new Connection(clusterApiUrl('devnet'))
    const tx = await connection.getTransaction(signature, { commitment: 'confirmed' })
    if (!tx) return res.status(202).json({ status: 'pending', error: 'Transaction not found or not confirmed yet' })

    const meta = tx.meta
    if (!meta || !tx.transaction) return res.status(400).json({ error: 'Malformed transaction data' })

  // Validate recipient public key first
  let recipient
  try { recipient = new PublicKey(prompt.owner) } catch (e) { return res.status(400).json({ error: 'Invalid recipient public key' }) }

  const accounts = tx.transaction.message.accountKeys.map(k => k.toString())
  const ownerIndex = accounts.indexOf(recipient.toString())
    if (ownerIndex === -1) return res.status(400).json({ error: 'Recipient not found in transaction' })

    console.log('verify-purchase: tx.accounts=', accounts)

    // ensure post/pre balances exist for owner index
    if (meta.postBalances.length <= ownerIndex || meta.preBalances.length <= ownerIndex) {
      return res.status(400).json({ error: 'Balance information missing for recipient' })
    }

  const post = BigInt(meta.postBalances[ownerIndex])
  const pre = BigInt(meta.preBalances[ownerIndex])
  const received = post > pre ? post - pre : BigInt(0)

  console.log('verify-purchase: ownerIndex=', ownerIndex, 'pre=', pre.toString(), 'post=', post.toString(), 'received=', received.toString())

    const expectedLamports = BigInt(Math.round(prompt.priceSol * 1e9))
    if (received < expectedLamports) return res.status(400).json({ error: 'Insufficient amount transferred' })

  // Determine buyer: prefer on-chain signer (first account), fall back to supplied buyer
  const buyerFromTx = tx.transaction.message.accountKeys[0] ? tx.transaction.message.accountKeys[0].toString() : null
  console.log('verify-purchase: buyerFromTx=', buyerFromTx, 'suppliedBuyer=', suppliedBuyer)
    let buyer = buyerFromTx || suppliedBuyer || 'unknown'

    // If the client supplied a buyer and it's present in the transaction accounts, prefer that value.
    if (suppliedBuyer) {
      if (accounts.includes(suppliedBuyer)) {
        buyer = suppliedBuyer
      } else {
        console.warn('Supplied buyer not present in transaction accounts', suppliedBuyer)
        // keep buyerFromTx if available; otherwise we will still use suppliedBuyer (best-effort)
        if (!buyerFromTx) buyer = suppliedBuyer
      }
    }

    const existing = await prisma.prompt.findUnique({ where: { id } })
    const buyers = existing.buyers || []
    if (!buyers.includes(buyer)) buyers.push(buyer)
  const updated = await prisma.prompt.update({ where: { id }, data: { buyers } })

  console.log('verify-purchase: recorded buyer=', buyer, 'updatedBuyers=', updated.buyers)

  await prisma.transactionRecord.upsert({
      where: { signature },
      update: {},
      create: { signature, promptId: id, buyer, lamports: Number(expectedLamports) }
    })

    // Return full content for the verified buyer 
    const fullPrompt = await prisma.prompt.findUnique({ where: { id } })
    return res.status(200).json({ ok: true, prompt: { ...fullPrompt, locked: false } })
  } catch (err) {
    console.error('verify-purchase error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


