-- Create "next_auth" schema
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Enable UUID extension if not already enabled in the schema/db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create "users" table
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text,
  email text,
  "emailVerified" timestamp with time zone,
  image text,
  -- Role is selected later in onboarding wizard
  role text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT email_unique UNIQUE (email)
);

-- Create "sessions" table
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  "expires" timestamp with time zone NOT NULL,
  "sessionToken" text NOT NULL,
  "userId" uuid,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessionToken_unique UNIQUE ("sessionToken"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES next_auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Create "accounts" table
CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text,
  "userId" uuid,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT provider_unique UNIQUE (provider, "providerAccountId"),
  CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES next_auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Create "verification_tokens" table
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  token text NOT NULL,
  identifier text NOT NULL,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
  CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);

-- Note: Ensure that the Supabase role you use to connect has access to this schema.
-- You might also need to run:
GRANT USAGE ON SCHEMA next_auth TO service_role, authenticated, anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA next_auth TO service_role, authenticated, anon;
