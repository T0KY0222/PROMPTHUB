const fs = require('fs')
const path = require('path')

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'store.json')

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)
}

function load() {
  try {
    ensureDataDir()
    if (fs.existsSync(filePath)) {
      const txt = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(txt)
    }
  } catch (e) {
    console.error('Failed to load store.json', e)
  }
  return { prompts: [], idCounter: 1 }
}

function save(store) {
  try {
    ensureDataDir()
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2))
  } catch (e) {
    console.error('Failed to save store.json', e)
  }
}

const store = load()

module.exports = { store, save }
