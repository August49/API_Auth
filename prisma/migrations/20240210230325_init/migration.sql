/*
  Warnings:

  - You are about to drop the column `maskAccountNumber` on the `Account` table. All the data in the column will be lost.
  - You are about to alter the column `balance` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `maskedAccountNumber` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "maskAccountNumber",
ADD COLUMN     "maskedAccountNumber" VARCHAR(255) NOT NULL,
ALTER COLUMN "balance" SET DEFAULT 0,
ALTER COLUMN "balance" SET DATA TYPE INTEGER;
