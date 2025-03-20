-- CreateTable
CREATE TABLE "WhatsappSessions" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappSessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappSessions_session_id_key" ON "WhatsappSessions"("session_id");
