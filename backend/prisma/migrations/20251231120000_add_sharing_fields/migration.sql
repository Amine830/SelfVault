-- AlterTable
ALTER TABLE "files" ADD COLUMN "share_downloads" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "files" ADD COLUMN "share_expires_at" TIMESTAMP(3);
ALTER TABLE "files" ADD COLUMN "share_max_downloads" INTEGER;
ALTER TABLE "files" ADD COLUMN "share_password" TEXT;
ALTER TABLE "files" ADD COLUMN "share_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "files_share_token_key" ON "files"("share_token");

-- CreateIndex
CREATE INDEX "files_share_token_idx" ON "files"("share_token");
