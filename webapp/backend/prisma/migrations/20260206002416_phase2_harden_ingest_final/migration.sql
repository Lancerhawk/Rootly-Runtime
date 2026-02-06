/*
  Warnings:

  - You are about to drop the column `file_path` on the `incidents` table. All the data in the column will be lost.
  - You are about to drop the column `line_number` on the `incidents` table. All the data in the column will be lost.
  - Added the required column `commit_sha` to the `incidents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `environment` to the `incidents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `occurred_at` to the `incidents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "incidents" DROP COLUMN "file_path",
DROP COLUMN "line_number",
ADD COLUMN     "commit_sha" TEXT NOT NULL,
ADD COLUMN     "environment" TEXT NOT NULL,
ADD COLUMN     "error_type" TEXT,
ADD COLUMN     "occurred_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "stack_trace" TEXT;
