# Azure Certificate Auth Setup

## Steps to complete in Azure Portal

### 1. Create an App Registration
1. Go to **Azure Portal → Microsoft Entra ID → App registrations → New registration**
2. Name: `MagicalThreadsStorage`
3. Supported account types: Single tenant
4. Click **Register**
5. Note the **Application (client) ID** and **Directory (tenant) ID**

### 2. Upload the Certificate
1. In the app registration, go to **Certificates & secrets → Certificates → Upload certificate**
2. Upload `/Users/kevin/MagicalThreads/certs/azure-storage.crt`
3. Add a description like "Storage access cert"

### 3. Grant RBAC Role on the Storage Account
1. Go to **Storage accounts → magicalthreadsmedia → Access Control (IAM)**
2. Click **Add → Add role assignment**
3. Role: **Storage Blob Data Contributor**
4. Assign access to: **User, group, or service principal**
5. Search for `MagicalThreadsStorage` (the app registration)
6. Click **Save**

### 4. Update Environment Variables
Add these to your `.env` file on the server:

```env
AZURE_TENANT_ID=<Directory (tenant) ID from step 1>
AZURE_CLIENT_ID=<Application (client) ID from step 1>
AZURE_CERT_PATH=/app/certs/azure-storage.pem
AZURE_STORAGE_ACCOUNT=magicalthreadsmedia
```

The code falls back to `AZURE_STORAGE_CONNECTION_STRING` if `AZURE_TENANT_ID` is not set, so nothing breaks until you complete these steps.

### 5. Deploy
1. Ensure `certs/azure-storage.pem` exists on the server
2. The `docker-compose.yml` already mounts `./certs:/app/certs:ro`
3. Redeploy: `docker compose up -d --build`

### 6. (Optional) Remove Connection String
Once cert auth is verified working, you can remove `AZURE_STORAGE_CONNECTION_STRING` from `.env` and `docker-compose.yml`.
