-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "username" TEXT,
    "isLoggedIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Data" (
    "key" TEXT NOT NULL,
    "value" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Data_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Finance" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notes" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todos" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Notes_key_key" ON "Notes"("key");

-- CreateIndex
CREATE INDEX "idx_user_id" ON "todos"("user_id");
