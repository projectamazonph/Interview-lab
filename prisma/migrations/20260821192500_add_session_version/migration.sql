-- Add a monotonic version used to revoke all previously issued user sessions.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 1;
