-- AlterTable
ALTER TABLE "Prompt" ADD COLUMN     "filters" TEXT[] DEFAULT ARRAY[]::TEXT[];
