-- AlterTable Message: rich content types (voice notes, images, files, call summaries)
ALTER TABLE "Message" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "Message" ADD COLUMN     "mediaUrl" TEXT;
ALTER TABLE "Message" ADD COLUMN     "mediaMimeType" TEXT;
ALTER TABLE "Message" ADD COLUMN     "mediaDurationSec" INTEGER;
ALTER TABLE "Message" ADD COLUMN     "fileName" TEXT;
ALTER TABLE "Message" ADD COLUMN     "fileSizeBytes" INTEGER;
ALTER TABLE "Message" ADD COLUMN     "callStatus" TEXT;
ALTER TABLE "Message" ADD COLUMN     "callDurationSec" INTEGER;

-- CreateTable CallLog
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ringing',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CallLog_messageId_key" ON "CallLog"("messageId");

-- CreateIndex
CREATE INDEX "CallLog_conversationId_startedAt_idx" ON "CallLog"("conversationId", "startedAt");

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
