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

@description('DATABASE_URL for SQL Server (set from Azure Container App environment/secrets)')
@secure()
param databaseUrl string = ''

@description('Stripe secret key (stored in Key Vault when provided)')
@secure()
param stripeSecretKey string = ''

@description('Stripe webhook secret (stored in Key Vault when provided)')
@secure()
param stripeWebhookSecret string = ''

@description('Stripe publishable key (stored in Key Vault when provided)')
@secure()
param stripePublishableKey string = ''

// ============================================================
// Container Registry
// ============================================================
var acrName = 'mtacr${uniqueString(resourceGroup().id)}'
var keyVaultRoleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: true
  }
}

// ============================================================
// Storage Account + File Share (optional persistent app volume)
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
// Key Vault + Stripe Secrets
// ============================================================
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'mt-secrets-vault'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
  }
}

resource stripeSecretKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(stripeSecretKey)) {
  parent: keyVault
  name: 'stripe-secret-key'
  properties: {
    value: stripeSecretKey
  }
}

resource stripeWebhookSecretSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(stripeWebhookSecret)) {
  parent: keyVault
  name: 'stripe-webhook-secret'
  properties: {
    value: stripeWebhookSecret
  }
}

resource stripePublishableKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(stripePublishableKey)) {
  parent: keyVault
  name: 'stripe-publishable-key'
  properties: {
    value: stripePublishableKey
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
  identity: {
    type: 'SystemAssigned'
  }
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
        {
          name: 'stripe-secret-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/stripe-secret-key'
          identity: 'system'
        }
        {
          name: 'stripe-webhook-secret'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/stripe-webhook-secret'
          identity: 'system'
        }
        {
          name: 'stripe-publishable-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/stripe-publishable-key'
          identity: 'system'
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
            { name: 'DATABASE_URL', value: databaseUrl }
            { name: 'PORT', value: '3000' }
            { name: 'STRIPE_SECRET_KEY', secretRef: 'stripe-secret-key' }
            { name: 'STRIPE_WEBHOOK_SECRET', secretRef: 'stripe-webhook-secret' }
            { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', secretRef: 'stripe-publishable-key' }
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
  identity: {
    type: 'SystemAssigned'
  }
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
        {
          name: 'stripe-secret-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/stripe-secret-key'
          identity: 'system'
        }
        {
          name: 'stripe-webhook-secret'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/stripe-webhook-secret'
          identity: 'system'
        }
        {
          name: 'stripe-publishable-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/stripe-publishable-key'
          identity: 'system'
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
            { name: 'DATABASE_URL', value: databaseUrl }
            { name: 'STRIPE_SECRET_KEY', secretRef: 'stripe-secret-key' }
            { name: 'STRIPE_WEBHOOK_SECRET', secretRef: 'stripe-webhook-secret' }
            { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', secretRef: 'stripe-publishable-key' }
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

// Grant each Container App identity read access to Key Vault secrets
resource siteKeyVaultSecretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (imageTag != '') {
  name: guid(keyVault.id, siteApp.name, keyVaultRoleDefinitionId)
  scope: keyVault
  properties: {
    roleDefinitionId: keyVaultRoleDefinitionId
    principalId: siteApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource adminKeyVaultSecretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (imageTag != '') {
  name: guid(keyVault.id, adminApp.name, keyVaultRoleDefinitionId)
  scope: keyVault
  properties: {
    roleDefinitionId: keyVaultRoleDefinitionId
    principalId: adminApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ============================================================
// Outputs
// ============================================================
output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output siteUrl string = imageTag != '' ? siteApp.properties.configuration.ingress.fqdn : 'Deploy with imageTag after building'
output adminUrl string = imageTag != '' ? adminApp.properties.configuration.ingress.fqdn : 'Deploy with imageTag after building'
