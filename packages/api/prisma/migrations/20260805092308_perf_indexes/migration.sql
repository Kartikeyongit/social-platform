-- CreateIndex
CREATE INDEX "Notification_userId_type_actorId_entityId_idx" ON "Notification"("userId", "type", "actorId", "entityId");

-- pg_trgm indexes for case-insensitive ILIKE substring search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "User_username_trgm_idx" ON "User" USING gin ("username" gin_trgm_ops);
CREATE INDEX "User_displayName_trgm_idx" ON "User" USING gin ("displayName" gin_trgm_ops);
CREATE INDEX "Hashtag_name_trgm_idx" ON "Hashtag" USING gin ("name" gin_trgm_ops);
