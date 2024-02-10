/*
  Warnings:

  - Added the required column `maskAccountNumber` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "maskAccountNumber" VARCHAR(255) NOT NULL;
