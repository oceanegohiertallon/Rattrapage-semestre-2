
### Architecture A — CloudFront + S3 / API Gateway + Lambda / RDS

| Poste | Quantité / mois | Prix unitaire (USD) | Coût / mois (USD) | Source |
|---|---:|---:|---:|---|
| API Gateway HTTP API | 2 000 000 Requests | 0.00000117 | 2,34 | AmazonApiGateway |
| Lambda arm64 — requêtes | 2 000 000 Requests | 0.0000002 | 0,40 | AWSLambda |
| Lambda arm64 — calcul (Go-s) | 150 000 Lambda-GB-Second | 0.0000133334 | 2,00 | AWSLambda |
| Front — CloudFront transfert (Europe) | 5 GB | 0.085 | 0,43 | AmazonCloudFront |
| Front — CloudFront requêtes HTTPS | 50 000 Requests | 0.0000012 | 0,06 | AmazonCloudFront |
| S3 — stockage Standard | 3 GB-Mo | 0.024 | 0,07 | AmazonS3 |
| S3 — requêtes GET | 100 000 Requests | 0.00000042 | 0,04 | AmazonS3 |
| S3 — requêtes PUT/LIST | 10 000 Requests | 0.0000053 | 0,05 | AmazonS3 |
| RDS PostgreSQL db.t4g.micro Single-AZ (730 h) | 730 Hrs | 0.018 | 13,14 | AmazonRDS |
| RDS stockage gp3 | 20 GB-Mo | 0.133 | 2,66 | AmazonRDS |
| RDS copie des snapshots vers eu-west-1 (transfert) | 5 GB | 0.02 | 0,10 | AWSDataTransfer |
| RDS snapshots conservés hors région (≈ tarif Paris) | 2 GB-Mo | 0.1 | 0,20 | AmazonRDS |
| Transfert sortant API -> Internet | 10 GB | 0.09 | 0,90 | AWSDataTransfer |
| CloudWatch Logs — ingestion | 1 GB | 0.5985 | 0,60 | AmazonCloudWatch |
| CloudWatch Logs — stockage (rétention 30 j) | 1 GB-Mo | 0.0315 | 0,03 | AmazonCloudWatch |
| CloudWatch alarmes | 6 Alarms | 0.1 | 0,60 | AmazonCloudWatch |
| Secrets Manager | 2 Secrets | 0.4 | 0,80 | AWSSecretsManager |
| Route 53 — zone hébergée | 1 HostedZone | 0.5 | 0,50 | AmazonRoute53 |
| Route 53 — requêtes DNS | 1 000 000 Queries | 0.0000004 | 0,40 | AmazonRoute53 |
| **Total** | | | **25,32** | |

### Architecture B — CloudFront + S3 / ALB + EC2 / RDS

| Poste | Quantité / mois | Prix unitaire (USD) | Coût / mois (USD) | Source |
|---|---:|---:|---:|---|
| ALB — heures | 730 Hrs | 0.02646 | 19,32 | AWSELB |
| ALB — LCU | 730 LCU-Hrs | 0.0084 | 6,13 | AWSELB |
| EC2 t4g.small Linux (730 h) | 730 Hrs | 0.0188 | 13,72 | AmazonEC2 |
| EBS gp3 (disque EC2) | 20 GB-Mo | 0.0928 | 1,86 | AmazonEC2 |
| NAT Gateway — heures | 730 Hrs | 0.05 | 36,50 | AmazonEC2 |
| NAT Gateway — données | 5 GB | 0.05 | 0,25 | AmazonEC2 |
| Adresses IPv4 publiques | 2 190 Hrs | 0.005 | 10,95 | AmazonVPC |
| Front — CloudFront transfert (Europe) | 5 GB | 0.085 | 0,43 | AmazonCloudFront |
| Front — CloudFront requêtes HTTPS | 50 000 Requests | 0.0000012 | 0,06 | AmazonCloudFront |
| S3 — stockage Standard | 3 GB-Mo | 0.024 | 0,07 | AmazonS3 |
| S3 — requêtes GET | 100 000 Requests | 0.00000042 | 0,04 | AmazonS3 |
| S3 — requêtes PUT/LIST | 10 000 Requests | 0.0000053 | 0,05 | AmazonS3 |
| RDS PostgreSQL db.t4g.micro Single-AZ (730 h) | 730 Hrs | 0.018 | 13,14 | AmazonRDS |
| RDS stockage gp3 | 20 GB-Mo | 0.133 | 2,66 | AmazonRDS |
| RDS copie des snapshots vers eu-west-1 (transfert) | 5 GB | 0.02 | 0,10 | AWSDataTransfer |
| RDS snapshots conservés hors région (≈ tarif Paris) | 2 GB-Mo | 0.1 | 0,20 | AmazonRDS |
| Transfert sortant API -> Internet | 10 GB | 0.09 | 0,90 | AWSDataTransfer |
| CloudWatch Logs — ingestion | 1 GB | 0.5985 | 0,60 | AmazonCloudWatch |
| CloudWatch Logs — stockage (rétention 30 j) | 1 GB-Mo | 0.0315 | 0,03 | AmazonCloudWatch |
| CloudWatch alarmes | 6 Alarms | 0.1 | 0,60 | AmazonCloudWatch |
| Secrets Manager | 2 Secrets | 0.4 | 0,80 | AWSSecretsManager |
| Route 53 — zone hébergée | 1 HostedZone | 0.5 | 0,50 | AmazonRoute53 |
| Route 53 — requêtes DNS | 1 000 000 Queries | 0.0000004 | 0,40 | AmazonRoute53 |
| **Total** | | | **109,31** | |

Écart B - A : 83,99 USD / mois (B ≈ 4,3 × A)

Tarifs extraits le 2026-10-09.
Prix à la demande, hors taxes, offre gratuite AWS non déduite, région eu-west-3 (Paris).

| Fichier d'offre AWS | Date de publication |
|---|---|
| `AmazonApiGateway/current/eu-west-3/index.json` | 2026-10-02T23:15:01Z |
| `AWSLambda/current/eu-west-3/index.json` | 2026-10-01T18:47:46Z |
| `AmazonCloudFront/current/index.json` | 2026-10-03T00:04:26Z |
| `AmazonS3/current/eu-west-3/index.json` | 2026-09-28T23:04:16Z |
| `AmazonRDS/current/eu-west-3/index.json` | 2026-10-06T22:40:50Z |
| `AWSDataTransfer/current/eu-west-3/index.json` | 2026-09-16T13:22:08Z |
| `AmazonCloudWatch/current/eu-west-3/index.json` | 2026-10-07T11:55:40Z |
| `AWSSecretsManager/current/eu-west-3/index.json` | 2026-09-11T12:46:10Z |
| `AmazonRoute53/current/index.json` | 2026-09-11T12:45:04Z |
| `AWSELB/current/eu-west-3/index.json` | 2026-09-11T12:45:44Z |
| `AmazonEC2/current/eu-west-3/index.json` | 2026-10-08T18:48:50Z |
| `AmazonVPC/current/eu-west-3/index.json` | 2026-09-17T19:05:28Z |
