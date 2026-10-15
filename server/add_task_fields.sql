-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_workerId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "workerId",
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "reward" INTEGER NOT NULL DEFAULT 1000;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
