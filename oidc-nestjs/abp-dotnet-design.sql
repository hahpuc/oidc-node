-- OpenIddictApplications
CREATE TABLE [dbo].[OpenIddictApplications](
	[Id] [uniqueidentifier] NOT NULL,
	[ApplicationType] [nvarchar](50) NULL,
	[ClientId] [nvarchar](100) NULL,
	[ClientSecret] [nvarchar](max) NULL,
	[ClientType] [nvarchar](50) NULL,
	[ConsentType] [nvarchar](50) NULL,
	[DisplayName] [nvarchar](max) NULL,
	[DisplayNames] [nvarchar](max) NULL,
	[JsonWebKeySet] [nvarchar](max) NULL,
	[Permissions] [nvarchar](max) NULL,
	[PostLogoutRedirectUris] [nvarchar](max) NULL,
	[Properties] [nvarchar](max) NULL,
	[RedirectUris] [nvarchar](max) NULL,
	[Requirements] [nvarchar](max) NULL,
	[Settings] [nvarchar](max) NULL,
	[ClientUri] [nvarchar](max) NULL,
	[LogoUri] [nvarchar](max) NULL,
	[ExtraProperties] [nvarchar](max) NOT NULL,
	[ConcurrencyStamp] [nvarchar](40) NOT NULL,
	[CreationTime] [datetime2](7) NOT NULL,
	[CreatorId] [uniqueidentifier] NULL,
	[LastModificationTime] [datetime2](7) NULL,
	[LastModifierId] [uniqueidentifier] NULL,
	[IsDeleted] [bit] NOT NULL,
	[DeleterId] [uniqueidentifier] NULL,
	[DeletionTime] [datetime2](7) NULL);


-- OpenIddictAuthorizations
SELECT TOP (1000) [Id]
      ,[ApplicationId]
      ,[CreationDate]
      ,[Properties]
      ,[Scopes]
      ,[Status]
      ,[Subject]
      ,[Type]
      ,[ExtraProperties]
      ,[ConcurrencyStamp]
      ,[CreationTime]
      ,[CreatorId]
      ,[LastModificationTime]
      ,[LastModifierId]
      ,[IsDeleted]
      ,[DeleterId]
      ,[DeletionTime]
  FROM [Dev.NovoPST].[dbo].[OpenIddictAuthorizations]

-- OpenIddictScopes
  CREATE TABLE [dbo].[OpenIddictScopes](
	[Id] [uniqueidentifier] NOT NULL,
	[Description] [nvarchar](max) NULL,
	[Descriptions] [nvarchar](max) NULL,
	[DisplayName] [nvarchar](max) NULL,
	[DisplayNames] [nvarchar](max) NULL,
	[Name] [nvarchar](200) NULL,
	[Properties] [nvarchar](max) NULL,
	[Resources] [nvarchar](max) NULL,
	[ExtraProperties] [nvarchar](max) NOT NULL,
	[ConcurrencyStamp] [nvarchar](40) NOT NULL,
	[CreationTime] [datetime2](7) NOT NULL,
	[CreatorId] [uniqueidentifier] NULL,
	[LastModificationTime] [datetime2](7) NULL,
	[LastModifierId] [uniqueidentifier] NULL,
	[IsDeleted] [bit] NOT NULL,
	[DeleterId] [uniqueidentifier] NULL,
	[DeletionTime] [datetime2](7) NULL);


-- OpenIddictTokens
SELECT TOP (1000) [Id]
      ,[ApplicationId]
      ,[AuthorizationId]
      ,[CreationDate]
      ,[ExpirationDate]
      ,[Payload]
      ,[Properties]
      ,[RedemptionDate]
      ,[ReferenceId]
      ,[Status]
      ,[Subject]
      ,[Type]
      ,[ExtraProperties]
      ,[ConcurrencyStamp]
      ,[CreationTime]
      ,[CreatorId]
      ,[LastModificationTime]
      ,[LastModifierId]
      ,[IsDeleted]
      ,[DeleterId]
      ,[DeletionTime]
  FROM [Dev.NovoPST].[dbo].[OpenIddictTokens]