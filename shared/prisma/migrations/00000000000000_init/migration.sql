BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[Order] (
    [id] NVARCHAR(1000) NOT NULL,
    [stripeSessionId] NVARCHAR(1000),
    [stripePaymentId] NVARCHAR(1000),
    [customerName] NVARCHAR(1000) NOT NULL,
    [customerEmail] NVARCHAR(1000) NOT NULL,
    [total] FLOAT(53) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Order_status_df] DEFAULT 'pending-payment',
    [shippingAddress] NVARCHAR(1000),
    [trackingNumber] NVARCHAR(1000),
    [notes] NVARCHAR(1000) NOT NULL CONSTRAINT [Order_notes_df] DEFAULT '',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Order_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [shippingCity] NVARCHAR(1000),
    [shippingCost] FLOAT(53),
    [shippingCountry] NVARCHAR(1000),
    [shippingName] NVARCHAR(1000),
    [shippingState] NVARCHAR(1000),
    [shippingZip] NVARCHAR(1000),
    [shippingLine1] NVARCHAR(1000),
    [shippingLine2] NVARCHAR(1000),
    [shippingPhone] NVARCHAR(1000),
    CONSTRAINT [Order_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Order_stripeSessionId_key] UNIQUE NONCLUSTERED ([stripeSessionId])
);

-- CreateTable
CREATE TABLE [dbo].[OrderItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [orderId] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000),
    [quantity] INT NOT NULL CONSTRAINT [OrderItem_quantity_df] DEFAULT 1,
    [price] FLOAT(53) NOT NULL,
    [size] NVARCHAR(1000),
    [customization] NVARCHAR(max),
    CONSTRAINT [OrderItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Product] (
    [id] NVARCHAR(1000) NOT NULL,
    [sku] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [price] FLOAT(53) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [tag] NVARCHAR(1000),
    [image] NVARCHAR(1000),
    [stock] INT NOT NULL CONSTRAINT [Product_stock_df] DEFAULT 0,
    [active] BIT NOT NULL CONSTRAINT [Product_active_df] DEFAULT 1,
    [isExample] BIT NOT NULL CONSTRAINT [Product_isExample_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Product_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [hasSize] BIT NOT NULL CONSTRAINT [Product_hasSize_df] DEFAULT 0,
    [stripePriceId] NVARCHAR(1000),
    [stripeProductId] NVARCHAR(1000),
    [customizationOptions] NVARCHAR(max),
    CONSTRAINT [Product_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Product_sku_key] UNIQUE NONCLUSTERED ([sku]),
    CONSTRAINT [Product_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[ProductImage] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [url] NVARCHAR(1000) NOT NULL,
    [alt] NVARCHAR(1000),
    [sortOrder] INT NOT NULL CONSTRAINT [ProductImage_sortOrder_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProductImage_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProductImage_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ProductSize] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [size] NVARCHAR(1000) NOT NULL,
    [stock] INT NOT NULL CONSTRAINT [ProductSize_stock_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProductSize_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ProductSize_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProductSize_productId_size_key] UNIQUE NONCLUSTERED ([productId],[size])
);

-- CreateTable
CREATE TABLE [dbo].[Setting] (
    [key] NVARCHAR(1000) NOT NULL,
    [value] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Setting_pkey] PRIMARY KEY CLUSTERED ([key])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductImage_productId_idx] ON [dbo].[ProductImage]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductImage_productId_sortOrder_idx] ON [dbo].[ProductImage]([productId], [sortOrder]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductSize_productId_idx] ON [dbo].[ProductSize]([productId]);

-- AddForeignKey
ALTER TABLE [dbo].[OrderItem] ADD CONSTRAINT [OrderItem_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[Order]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OrderItem] ADD CONSTRAINT [OrderItem_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProductImage] ADD CONSTRAINT [ProductImage_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProductSize] ADD CONSTRAINT [ProductSize_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

