-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priceSol" DOUBLE PRECISION NOT NULL,
    "owner" TEXT NOT NULL,
    "category" TEXT,
    "buyers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionRecord" (
    "id" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "lamports" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionRecord_signature_key" ON "TransactionRecord"("signature");
