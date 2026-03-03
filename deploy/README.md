# Deployment Guide — Magical Threads

## What Gets Created
Everything from scratch — no pre-existing Azure resources needed:

- **Azure Container Registry** (Basic) — stores your Docker image
- **Storage Account + File Share** — persistent SQLite volume
- **Log Analytics Workspace** — container logs
- **Container Apps Environment** — serverless container hosting
- **2 Container Apps** — site (port 3000) + admin (port 3001)

## Steps

### 1. Create a resource group
```bash
az group create -n magical-threads -l eastus
```

### 2. Deploy infrastructure (first run, no image yet)
```bash
cd ~/MagicalThreads
az deployment group create -g magical-threads -f deploy/main.bicep
```
This creates the ACR, storage, and environment. Note the `acrName` output.

### 3. Build & push the Docker image
```bash
az acr build -r <acrName> -t magicalthreads:latest .
```

### 4. Deploy the apps
```bash
az deployment group create -g magical-threads -f deploy/main.bicep -p imageTag=latest
```

### 5. Get your URLs
Check the deployment outputs, or:
```bash
az containerapp show -n mt-site -g magical-threads --query properties.configuration.ingress.fqdn -o tsv
az containerapp show -n mt-admin -g magical-threads --query properties.configuration.ingress.fqdn -o tsv
```

## Updating
```bash
az acr build -r <acrName> -t magicalthreads:v2 .
az containerapp update -n mt-site -g magical-threads --image <acrLoginServer>/magicalthreads:v2
az containerapp update -n mt-admin -g magical-threads --image <acrLoginServer>/magicalthreads:v2
```

## Custom Domains
Add CNAME records pointing to the Container App FQDNs, then:
```bash
az containerapp hostname add -n mt-site -g magical-threads --hostname your-domain.com
az containerapp hostname bind -n mt-site -g magical-threads --hostname your-domain.com --environment mt-env
```

## Estimated Monthly Cost
| Resource | Cost |
|----------|------|
| Container Apps (consumption, scale-to-zero) | ~$0-5 |
| Storage (1GB file share) | ~$0.06 |
| Log Analytics | ~$2 |
| Container Registry (Basic) | ~$5 |
| **Total** | **~$7-12/month** |

## Tear Down
```bash
az group delete -n magical-threads --yes
```
