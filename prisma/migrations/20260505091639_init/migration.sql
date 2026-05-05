-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "intercomId" TEXT NOT NULL,
    "language" TEXT,
    "languagesAll" TEXT,
    "scorePct" INTEGER,
    "label" TEXT,
    "emoji" TEXT,
    "communicationStyle" TEXT,
    "arc" TEXT,
    "conversion" TEXT,
    "conversionDeltaPct" INTEGER,
    "scoreStartPct" INTEGER,
    "scoreEndPct" INTEGER,
    "churnRisk" TEXT,
    "churnSignals" TEXT,
    "burstCount" INTEGER,
    "confidence" DOUBLE PRECISION,
    "culturalCalibration" TEXT,
    "keySignalSummary" TEXT,
    "explicitCsatPct" INTEGER,
    "implicitCsatGap" BOOLEAN NOT NULL DEFAULT true,
    "agentId" TEXT,
    "teamId" TEXT,
    "analyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageScore" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageIndex" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "language" TEXT,
    "scorePct" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION,
    "signalsJson" JSONB,
    "timestamp" TIMESTAMP(3),

    CONSTRAINT "MessageScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "avgScorePct" DOUBLE PRECISION NOT NULL,
    "totalConversations" INTEGER NOT NULL,
    "distributionJson" JSONB NOT NULL,
    "styleBreakdownJson" JSONB NOT NULL,
    "languageBreakdownJson" JSONB NOT NULL,
    "conversionCount" INTEGER NOT NULL,
    "churnCount" INTEGER NOT NULL,
    "explicitImplicitAgreementPct" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_intercomId_key" ON "Conversation"("intercomId");

-- CreateIndex
CREATE UNIQUE INDEX "DailySnapshot_date_key" ON "DailySnapshot"("date");

-- AddForeignKey
ALTER TABLE "MessageScore" ADD CONSTRAINT "MessageScore_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
