// Estimation mensuelle des deux architectures C1 à partir des tarifs OFFICIELS AWS.
// Source : AWS Price List Bulk API (fichiers d'offres publics, sans compte AWS)
//   https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/<service>/current/<région>/index.json
// Chaque fichier porte sa date de publication (publicationDate), reprise dans la sortie.
//
// Lance : node estimer-couts.mjs          (télécharge ~270 Mo la 1re fois, cache dans .cache/)
// Hypothèses de volume : tableau VOLUMES ci-dessous, expliqué dans dossier-aws.md § 4.
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

const CACHE = fileURLToPath(new URL('./.cache/', import.meta.url))
const BASE = 'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws'
const REGION = 'eu-west-3' // Europe (Paris)
const HOURS = 730 // heures par mois, convention AWS

// service -> chemin (régional, sauf services globaux)
const SOURCES = {
  AmazonCloudFront: 'AmazonCloudFront/current/index.json',
  AmazonRoute53: 'AmazonRoute53/current/index.json',
  AmazonS3: `AmazonS3/current/${REGION}/index.json`,
  AmazonApiGateway: `AmazonApiGateway/current/${REGION}/index.json`,
  AWSLambda: `AWSLambda/current/${REGION}/index.json`,
  AmazonRDS: `AmazonRDS/current/${REGION}/index.json`,
  AmazonCloudWatch: `AmazonCloudWatch/current/${REGION}/index.json`,
  AWSSecretsManager: `AWSSecretsManager/current/${REGION}/index.json`,
  AWSDataTransfer: `AWSDataTransfer/current/${REGION}/index.json`,
  AWSELB: `AWSELB/current/${REGION}/index.json`,
  AmazonVPC: `AmazonVPC/current/${REGION}/index.json`,
  AmazonEC2: `AmazonEC2/current/${REGION}/index.json`, // ~250 Mo
}

const VOLUMES = {
  apiRequests: 2_000_000, // requêtes API / mois (≈ 1,6 M estimées + marge)
  lambdaAvgSeconds: 0.15, // durée moyenne d'une requête FastAPI
  lambdaMemoryGb: 0.5, // 512 Mo
  frontGb: 5, // transfert du front via CloudFront / mois
  frontRequests: 50_000, // requêtes HTTPS CloudFront / mois
  apiOutGb: 10, // réponses API vers Internet / mois
  s3Gb: 3, // 2 Go de ressources privées + versions + front
  s3Get: 100_000,
  s3Put: 10_000,
  dbStorageGb: 20, // minimum gp3 RDS
  logsGb: 1, // logs ingérés / mois (rétention 30 j -> ~1 Go stocké)
  alarms: 6,
  secrets: 2, // clé de signature applicative + mot de passe maître géré par RDS
  dnsQueries: 1_000_000,
  snapshotCopyGb: 5, // copie quotidienne incrémentale des snapshots vers eu-west-1
  snapshotRemoteGb: 2,
  albLcu: 1, // < 1 LCU réel à 20 req/s, arrondi au-dessus
  ec2EbsGb: 20,
  natGb: 5,
  publicIpv4: 3, // 2 pour l'ALB (2 AZ) + 1 pour la NAT
}

async function load(service) {
  mkdirSync(CACHE, { recursive: true })
  const file = `${CACHE}${service}.json`
  if (!existsSync(file)) {
    process.stderr.write(`téléchargement ${service}…\n`)
    const res = await fetch(`${BASE}/${SOURCES[service]}`)
    if (!res.ok) throw new Error(`${service} : HTTP ${res.status}`)
    await pipeline(Readable.fromWeb(res.body), createWriteStream(file))
  }
  return JSON.parse(readFileSync(file, 'utf8'))
}

const offers = {}
const dates = {}

// Prix unitaire USD : usagetype exact + description qui correspond + 1re tranche par défaut
async function price(service, usagetype, descRe = /./, beginRange = '0') {
  if (!offers[service]) {
    offers[service] = await load(service)
    dates[service] = offers[service].publicationDate
  }
  const { products, terms } = offers[service]
  for (const [sku, p] of Object.entries(products)) {
    if (p.attributes.usagetype !== usagetype) continue
    for (const term of Object.values(terms.OnDemand[sku] ?? {})) {
      for (const d of Object.values(term.priceDimensions)) {
        if (descRe.test(d.description) && d.beginRange === beginRange) {
          return { usd: Number(d.pricePerUnit.USD), unit: d.unit, service }
        }
      }
    }
  }
  throw new Error(`prix introuvable : ${service} ${usagetype} ${descRe}`)
}

const V = VOLUMES
const COMMON = async () => [
  ['Front — CloudFront transfert (Europe)', V.frontGb, await price('AmazonCloudFront', 'EU-DataTransfer-Out-Bytes')],
  ['Front — CloudFront requêtes HTTPS', V.frontRequests, await price('AmazonCloudFront', 'EU-Requests-Tier2-HTTPS')],
  ['S3 — stockage Standard', V.s3Gb, await price('AmazonS3', 'EUW3-TimedStorage-ByteHrs')],
  ['S3 — requêtes GET', V.s3Get, await price('AmazonS3', 'EUW3-Requests-Tier2')],
  ['S3 — requêtes PUT/LIST', V.s3Put, await price('AmazonS3', 'EUW3-Requests-Tier1')],
  ['RDS PostgreSQL db.t4g.micro Single-AZ (730 h)', HOURS, await price('AmazonRDS', 'EUW3-InstanceUsage:db.t4g.micro', /PostgreSQL$/)],
  ['RDS stockage gp3', V.dbStorageGb, await price('AmazonRDS', 'EUW3-RDS:GP3-Storage', /running PostgreSQL$/)],
  ['RDS copie des snapshots vers eu-west-1 (transfert)', V.snapshotCopyGb, await price('AWSDataTransfer', 'EUW3-EU-AWS-Out-Bytes')],
  ['RDS snapshots conservés hors région (≈ tarif Paris)', V.snapshotRemoteGb, await price('AmazonRDS', 'EUW3-RDS:ChargedBackupUsage', /running PostgreSQL$/)],
  ['Transfert sortant API -> Internet', V.apiOutGb, await price('AWSDataTransfer', 'EUW3-DataTransfer-Out-Bytes')],
  ['CloudWatch Logs — ingestion', V.logsGb, await price('AmazonCloudWatch', 'EUW3-DataProcessing-Bytes', /Standard log class/)],
  ['CloudWatch Logs — stockage (rétention 30 j)', V.logsGb, await price('AmazonCloudWatch', 'EUW3-TimedStorage-ByteHrs', /log storage/)],
  ['CloudWatch alarmes', V.alarms, await price('AmazonCloudWatch', 'EUW3-CW:AlarmMonitorUsage')],
  ['Secrets Manager', V.secrets, await price('AWSSecretsManager', 'EUW3-AWSSecretsManager-Secrets')],
  ['Route 53 — zone hébergée', 1, await price('AmazonRoute53', 'HostedZone')],
  ['Route 53 — requêtes DNS', V.dnsQueries, await price('AmazonRoute53', 'DNS-Queries')],
]

const ARCHI_A = async () => [
  ['API Gateway HTTP API', V.apiRequests, await price('AmazonApiGateway', 'EUW3-ApiGatewayHttpRequest')],
  ['Lambda arm64 — requêtes', V.apiRequests, await price('AWSLambda', 'EUW3-Request-ARM')],
  ['Lambda arm64 — calcul (Go-s)', V.apiRequests * V.lambdaAvgSeconds * V.lambdaMemoryGb, await price('AWSLambda', 'EUW3-Lambda-GB-Second-ARM')],
  ...(await COMMON()),
]

const ARCHI_B = async () => [
  ['ALB — heures', HOURS, await price('AWSELB', 'EUW3-LoadBalancerUsage', /Application LoadBalancer/)],
  ['ALB — LCU', HOURS * V.albLcu, await price('AWSELB', 'EUW3-LCUUsage', /Application load balancer/)],
  ['EC2 t4g.small Linux (730 h)', HOURS, await price('AmazonEC2', 'EUW3-BoxUsage:t4g.small', /On Demand Linux/)],
  ['EBS gp3 (disque EC2)', V.ec2EbsGb, await price('AmazonEC2', 'EUW3-EBS:VolumeUsage.gp3')],
  ['NAT Gateway — heures', HOURS, await price('AmazonEC2', 'EUW3-NatGateway-Hours')],
  ['NAT Gateway — données', V.natGb, await price('AmazonEC2', 'EUW3-NatGateway-Bytes')],
  ['Adresses IPv4 publiques', HOURS * V.publicIpv4, await price('AmazonVPC', 'EUW3-PublicIPv4:InUseAddress')],
  ...(await COMMON()),
]

// 0.0000002 plutôt que 2e-7
const unitPrice = (usd) => usd.toFixed(10).replace(/0+$/, '').replace(/\.$/, '')
const fmt = (n, d = 2) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })

function table(title, lines) {
  console.log(`\n### ${title}\n`)
  console.log('| Poste | Quantité / mois | Prix unitaire (USD) | Coût / mois (USD) | Source |')
  console.log('|---|---:|---:|---:|---|')
  let total = 0
  for (const [label, qty, p] of lines) {
    const cost = qty * p.usd
    total += cost
    console.log(`| ${label} | ${fmt(qty, 0)} ${p.unit} | ${unitPrice(p.usd)} | ${fmt(cost)} | ${p.service} |`)
  }
  console.log(`| **Total** | | | **${fmt(total)}** | |`)
  return total
}

const a = table('Architecture A — CloudFront + S3 / API Gateway + Lambda / RDS', await ARCHI_A())
const b = table('Architecture B — CloudFront + S3 / ALB + EC2 / RDS', await ARCHI_B())

console.log(`\nÉcart B - A : ${fmt(b - a)} USD / mois (B ≈ ${fmt(b / a, 1)} × A)`)
console.log(`\nTarifs extraits le ${new Date().toISOString().slice(0, 10)}.`)
console.log('Prix à la demande, hors taxes, offre gratuite AWS non déduite, région eu-west-3 (Paris).')
console.log('\n| Fichier d\'offre AWS | Date de publication |')
console.log('|---|---|')
for (const [service, date] of Object.entries(dates)) console.log(`| \`${SOURCES[service]}\` | ${date} |`)
