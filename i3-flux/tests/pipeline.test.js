// Tests du pipeline I3 — lanceur intégré de Node (node --test), aucune dépendance.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeDate, normalizeRecord } from '../src/normalize.js'
import { runPipeline } from '../src/pipeline.js'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const DATASET = join(ROOT, 'data', 'seances.ndjson')
const dirs = []
after(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

function tmp() {
  const d = mkdtempSync(join(tmpdir(), 'i3-'))
  dirs.push(d)
  return d
}

// Lance le pipeline sur un contenu donné, renvoie stats + sorties parsées
async function run(content) {
  const dir = tmp()
  const input = join(dir, 'entree.ndjson')
  writeFileSync(input, content, 'utf8')
  const out = join(dir, 'sortie')
  const stats = await runPipeline(input, out)
  const read = (f) => readFileSync(join(out, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  return { stats, acceptes: read('acceptes.ndjson'), rejets: read('rejets.ndjson'), out }
}

const VALID = {
  id: 's01', date: '19/10/2026', period: 'matin', group: 'A', mode: 'DG',
  title: 'React composants', domain: 'web', teacherId: 't1', status: 'confirme',
}
const line = (overrides) => JSON.stringify({ ...VALID, ...overrides })

describe('ligne valide', () => {
  it('normalise date, période et statut', async () => {
    const { stats, acceptes } = await run(line() + '\n')
    assert.deepEqual(stats, { lus: 1, acceptes: 1, rejets: 0, doublons: 0 })
    assert.deepEqual(acceptes[0], {
      source_line: 1, id: 's01', date: '2026-10-19', period: 'am', group: 'A', mode: 'DG',
      title: 'React composants', domain: 'web', teacherId: 't1', status: 'confirmed',
    })
  })

  it('accepte toutes les variantes de période et de statut prévues', () => {
    for (const [p, attendu] of [['matin', 'am'], ['am', 'am'], ['après-midi', 'pm'], ['apres-midi', 'pm'], ['pm', 'pm']]) {
      assert.equal(normalizeRecord({ ...VALID, period: p }).period, attendu)
    }
    assert.equal(normalizeRecord({ ...VALID, status: 'propose' }).status, 'proposed')
    assert.equal(normalizeRecord({ ...VALID, mode: 'AUTO', teacherId: null, status: 'proposed' }).teacherId, null)
  })

  it('valide les dates réelles, années bissextiles comprises', () => {
    assert.equal(normalizeDate('2026-10-19'), '2026-10-19')
    assert.equal(normalizeDate('29/02/2028'), '2028-02-29')
    assert.throws(() => normalizeDate('29/02/2026'), /inexistante/)
    assert.throws(() => normalizeDate('2026-13-01'), /inexistante/)
    assert.throws(() => normalizeDate('19-10-2026'), /format inconnu/)
  })
})

describe('lignes invalides', () => {
  const cas = [
    ['date inexistante', { date: '2026-02-30' }, /date inexistante/],
    ['date au mauvais format', { date: '2026/10/19' }, /format inconnu/],
    ['période inconnue', { period: 'soir' }, /période invalide/],
    ['groupe inconnu', { group: 'C' }, /groupe invalide/],
    ['mode inconnu', { mode: 'VISIO' }, /mode invalide/],
    ['formateur inconnu', { teacherId: 't9' }, /teacherId invalide/],
    ['statut inconnu', { status: 'annulé' }, /statut invalide/],
    ['titre vide', { title: '' }, /title manquant ou vide/],
    ['id manquant', { id: undefined }, /id manquant/],
    ['AUTO avec formateur', { mode: 'AUTO', teacherId: 't1', status: 'proposed' }, /AUTO exige/],
    ['AUTO confirmée', { mode: 'AUTO', teacherId: null, status: 'confirmed' }, /AUTO exige/],
    ['confirmée sans formateur', { teacherId: null, status: 'confirmed' }, /confirmed exige un formateur/],
  ]
  for (const [nom, overrides, motif] of cas) {
    it(`rejette : ${nom}`, async () => {
      const { stats, rejets } = await run(line(overrides) + '\n')
      assert.deepEqual(stats, { lus: 1, acceptes: 0, rejets: 1, doublons: 0 })
      assert.equal(rejets[0].source_line, 1)
      assert.match(rejets[0].motif, motif)
    })
  }

  it("rejette une ligne JSON valide qui n'est pas un objet", async () => {
    const { rejets } = await run('[1,2]\n42\n')
    assert.deepEqual(rejets.map((r) => r.motif), ["la ligne n'est pas un objet JSON", "la ligne n'est pas un objet JSON"])
  })

  it('une ligne invalide n\'interrompt pas les suivantes', async () => {
    const { stats, acceptes } = await run([line({ period: 'soir' }), line({ id: 's02' })].join('\n') + '\n')
    assert.deepEqual(stats, { lus: 2, acceptes: 1, rejets: 1, doublons: 0 })
    assert.equal(acceptes[0].id, 's02')
    assert.equal(acceptes[0].source_line, 2)
  })
})

describe('doublons', () => {
  it('garde la première occurrence valide, compte les suivantes comme doublons', async () => {
    const { stats, acceptes } = await run([line(), line({ title: 'Copie' }), line({ title: 'Copie 2' })].join('\n') + '\n')
    assert.deepEqual(stats, { lus: 3, acceptes: 1, rejets: 0, doublons: 2 })
    assert.equal(acceptes[0].title, 'React composants')
  })

  it("valide AVANT de dédupliquer : une première occurrence invalide ne bloque pas l'id", async () => {
    const { stats, acceptes, rejets } = await run([line({ date: '2026-02-30' }), line({ title: 'Version correcte' })].join('\n') + '\n')
    assert.deepEqual(stats, { lus: 2, acceptes: 1, rejets: 1, doublons: 0 })
    assert.equal(rejets[0].source_line, 1)
    assert.equal(acceptes[0].title, 'Version correcte')
    assert.equal(acceptes[0].source_line, 2)
  })
})

describe('JSON malformé', () => {
  it('rejette la ligne avec son contenu brut et continue', async () => {
    const tronque = '{"id":"bad4","title":"JSON tronqué"'
    const { stats, rejets, acceptes } = await run([tronque, line()].join('\n') + '\n')
    assert.deepEqual(stats, { lus: 2, acceptes: 1, rejets: 1, doublons: 0 })
    assert.deepEqual(rejets[0], { source_line: 1, motif: 'JSON malformé', contenu: tronque })
    assert.equal(acceptes[0].source_line, 2)
  })
})

describe('fichier vide et lignes vides', () => {
  it('fichier vide : tout à zéro, sorties vides mais présentes', async () => {
    const { stats, acceptes, rejets, out } = await run('')
    assert.deepEqual(stats, { lus: 0, acceptes: 0, rejets: 0, doublons: 0 })
    assert.equal(acceptes.length + rejets.length, 0)
    assert.deepEqual(JSON.parse(readFileSync(join(out, 'stats.json'), 'utf8')), stats)
  })

  it('une ligne vide au milieu est lue et rejetée (invariant respecté)', async () => {
    const { stats, rejets } = await run([line(), '', line({ id: 's02' })].join('\n') + '\n')
    assert.deepEqual(stats, { lus: 3, acceptes: 2, rejets: 1, doublons: 0 })
    assert.deepEqual(rejets[0], { source_line: 2, motif: 'ligne vide', contenu: '' })
  })

  it('fins de ligne Windows (CRLF) et BOM UTF-8 acceptés', async () => {
    const { stats } = await run('﻿' + [line(), line({ id: 's02' })].join('\r\n') + '\r\n')
    assert.deepEqual(stats, { lus: 2, acceptes: 2, rejets: 0, doublons: 0 })
  })
})

describe('jeu de données du sujet (data/seances.ndjson)', () => {
  it('lus = acceptés + rejets + doublons, avec les bonnes lignes', async () => {
    const dir = tmp()
    const stats = await runPipeline(DATASET, dir)
    assert.deepEqual(stats, { lus: 12, acceptes: 6, rejets: 4, doublons: 2 })
    assert.equal(stats.lus, stats.acceptes + stats.rejets + stats.doublons)

    const acceptes = readFileSync(join(dir, 'acceptes.ndjson'), 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    assert.deepEqual(acceptes.map((a) => `${a.source_line}:${a.id}`), ['1:s01', '2:s02', '3:s03', '5:s04', '6:s05', '11:s06'])
    const rejets = readFileSync(join(dir, 'rejets.ndjson'), 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    assert.deepEqual(rejets.map((r) => r.source_line), [7, 8, 9, 12])
  })

  it('même fichier = même résultat, octet pour octet, quel que soit le fuseau horaire', () => {
    const sorties = ['UTC', 'Pacific/Kiritimati', 'America/Los_Angeles'].map((tz) => {
      const out = join(tmp(), 'sortie')
      execFileSync(process.execPath, [join(ROOT, 'pipeline.js'), DATASET, out], { env: { ...process.env, TZ: tz } })
      return ['acceptes.ndjson', 'rejets.ndjson', 'stats.json'].map((f) => readFileSync(join(out, f), 'utf8')).join('\0')
    })
    assert.equal(sorties[1], sorties[0])
    assert.equal(sorties[2], sorties[0])
  })
})
