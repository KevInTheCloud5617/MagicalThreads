// Magical Threads — Full Azure deployment
// Creates ALL resources from scratch. Only prereq: a resource group.
//
// Usage:
//   az group create -n magical-threads -l eastus
//   az deployment group create -g magical-threads -f deploy/main.bicep
//   az acr build -r <acrName from output> -t magicalthreads:latest .
//   az deployment group create -g magical-threads -f deploy/main.bicep -p imageTag=latest

@description('Location for all resources')
param location string = resourceGroup().location

@description('Image tag to deploy (set after first acr build)')
param imageTag string = ''

// ============================================================
// Container Registry
// ============================================================
var acrName = 'mtacr${uniqueString(resourceGroup().id)}'

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: true
  }
}

// ============================================================
// Storage Account + File Share (persistent SQLite volume)
// ============================================================
var storageAccountName = 'mtstore${uniqueString(resourceGroup().id)}'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
}

resource fileService 'Microsoft.Storage/storageAccounts/fileServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
}

resource fileShare 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-05-01' = {
  parent: fileService
  name: 'mt-data'
  properties: {
    shareQuota: 1
  }
}

// ============================================================
// Log Analytics Workspace
// ============================================================
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'mt-logs'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// ============================================================
// Container Apps Environment
// ============================================================
resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'mt-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// Mount Azure File Share into the environment
resource envStorage 'Microsoft.App/managedEnvironments/storages@2024-03-01' = {
  parent: env
  name: 'mt-data'
  properties: {
    azureFile: {
      accountName: storageAccount.name
      accountKey: storageAccount.listKeys().keys[0].value
      shareName: 'mt-data'
      accessMode: 'ReadWrite'
    }
  }
}

// ============================================================
// Container Apps (only deployed when imageTag is provided)
// ============================================================
var fullImage = '${acr.properties.loginServer}/magicalthreads:${imageTag}'
var acrCreds = acr.listCredentials()

resource siteApp 'Microsoft.App/containerApps@2024-03-01' = if (imageTag != '') {
  name: 'mt-site'
  location: location
  properties: {
    managedEnvironmentId: env.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acrCreds.username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acrCreds.passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'site'
          image: fullImage
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'DATABASE_URL', value: 'file:/data/store.db' }
            { name: 'PORT', value: '3000' }
          ]
          volumeMounts: [
            { volumeName: 'data', mountPath: '/data' }
          ]
        }
      ]
      volumes: [
        {
          name: 'data'
          storageName: 'mt-data'
          storageType: 'AzureFile'
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
    }
  }
}

resource adminApp 'Microsoft.App/containerApps@2024-03-01' = if (imageTag != '') {
  name: 'mt-admin'
  location: location
  properties: {
    managedEnvironmentId: env.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3001
        transport: 'auto'
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acrCreds.username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acrCreds.passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'admin'
          image: fullImage
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          command: ['sh', '-c', 'PORT=3001 node /app/admin-standalone/server.js']
          env: [
            { name: 'DATABASE_URL', value: 'file:/data/store.db' }
          ]
          volumeMounts: [
            { volumeName: 'data', mountPath: '/data' }
          ]
        }
      ]
      volumes: [
        {
          name: 'data'
          storageName: 'mt-data'
          storageType: 'AzureFile'
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
    }
  }
}

// ============================================================
// Outputs
// ============================================================
output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output siteUrl string = imageTag != '' ? siteApp.properties.configuration.ingress.fqdn : 'Deploy with imageTag after building'
output adminUrl string = imageTag != '' ? adminApp.properties.configuration.ingress.fqdn : 'Deploy with imageTag after building'
