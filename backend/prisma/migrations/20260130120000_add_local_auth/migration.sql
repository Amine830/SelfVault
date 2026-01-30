-- AlterTable: Add password_hash column for local authentication
-- This column is optional (nullable) to support both Supabase and local auth
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;
