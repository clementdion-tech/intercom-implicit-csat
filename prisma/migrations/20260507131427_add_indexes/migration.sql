-- CreateIndex
CREATE INDEX "Conversation_analyzedAt_idx" ON "Conversation"("analyzedAt");

-- CreateIndex
CREATE INDEX "Conversation_churnRisk_idx" ON "Conversation"("churnRisk");

-- CreateIndex
CREATE INDEX "Conversation_label_idx" ON "Conversation"("label");

-- CreateIndex
CREATE INDEX "Conversation_communicationStyle_idx" ON "Conversation"("communicationStyle");

-- CreateIndex
CREATE INDEX "Conversation_language_idx" ON "Conversation"("language");

-- CreateIndex
CREATE INDEX "Conversation_agentId_idx" ON "Conversation"("agentId");

-- CreateIndex
CREATE INDEX "MessageScore_conversationId_idx" ON "MessageScore"("conversationId");
