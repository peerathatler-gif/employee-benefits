-- DropForeignKey
ALTER TABLE `benefit_claims` DROP FOREIGN KEY `benefit_claims_employeeBenefitId_fkey`;

-- DropForeignKey
ALTER TABLE `benefit_claims` DROP FOREIGN KEY `benefit_claims_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `benefit_claims` DROP FOREIGN KEY `benefit_claims_policyId_fkey`;

-- DropForeignKey
ALTER TABLE `benefit_claims` DROP FOREIGN KEY `benefit_claims_reviewedById_fkey`;

-- DropForeignKey
ALTER TABLE `benefit_policies` DROP FOREIGN KEY `benefit_policies_benefitTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `claim_attachments` DROP FOREIGN KEY `claim_attachments_claimId_fkey`;

-- DropForeignKey
ALTER TABLE `employee_benefits` DROP FOREIGN KEY `employee_benefits_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `employee_benefits` DROP FOREIGN KEY `employee_benefits_policyId_fkey`;

-- DropIndex
DROP INDEX `benefit_policies_benefitTypeId_idx` ON `benefit_policies`;

-- DropIndex
DROP INDEX `employee_benefits_employeeId_policyId_periodStart_key` ON `employee_benefits`;

-- AlterTable
ALTER TABLE `benefit_policies` DROP COLUMN `benefitTypeId`,
    DROP COLUMN `name`,
    DROP COLUMN `periodMonths`,
    ADD COLUMN `benefitId` VARCHAR(191) NOT NULL,
    ADD COLUMN `departmentId` VARCHAR(191) NULL,
    ADD COLUMN `effectiveEnd` DATETIME(3) NULL,
    ADD COLUMN `effectiveStart` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `employee_benefits` ADD COLUMN `benefitId` VARCHAR(191) NOT NULL,
    ADD COLUMN `usedAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    MODIFY `policyId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `employees` ADD COLUMN `avatarMimeType` VARCHAR(128) NULL,
    ADD COLUMN `avatarUrl` VARCHAR(64) NULL;

-- AlterTable
ALTER TABLE `leave_requests` DROP COLUMN `requestedDays`,
    DROP COLUMN `reviewNote`,
    ADD COLUMN `rejectionReason` TEXT NULL,
    ADD COLUMN `totalDays` DECIMAL(6, 2) NOT NULL;

-- DropTable
DROP TABLE `benefit_claims`;

-- DropTable
DROP TABLE `benefit_types`;

-- DropTable
DROP TABLE `claim_attachments`;

-- CreateTable
CREATE TABLE `benefit_categories` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `benefit_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `benefits` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `defaultLimit` DECIMAL(12, 2) NOT NULL,
    `periodType` ENUM('MONTHLY', 'QUARTERLY', 'YEARLY') NOT NULL DEFAULT 'YEARLY',
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `benefits_categoryId_idx`(`categoryId`),
    INDEX `benefits_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `benefit_requests` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `benefitId` VARCHAR(191) NOT NULL,
    `requestedAmount` DECIMAL(12, 2) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `benefit_requests_employeeId_idx`(`employeeId`),
    INDEX `benefit_requests_benefitId_idx`(`benefitId`),
    INDEX `benefit_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `benefit_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `storageKey` VARCHAR(255) NOT NULL,
    `originalFilename` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(128) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `benefit_attachments_requestId_idx`(`requestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `storageKey` VARCHAR(255) NOT NULL,
    `originalFilename` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(128) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `leave_attachments_requestId_idx`(`requestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `benefit_policies_benefitId_idx` ON `benefit_policies`(`benefitId`);

-- CreateIndex
CREATE INDEX `benefit_policies_departmentId_idx` ON `benefit_policies`(`departmentId`);

-- CreateIndex
CREATE INDEX `employee_benefits_benefitId_idx` ON `employee_benefits`(`benefitId`);

-- CreateIndex
CREATE UNIQUE INDEX `employee_benefits_employeeId_benefitId_periodStart_key` ON `employee_benefits`(`employeeId`, `benefitId`, `periodStart`);

-- AddForeignKey
ALTER TABLE `benefits` ADD CONSTRAINT `benefits_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `benefit_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_policies` ADD CONSTRAINT `benefit_policies_benefitId_fkey` FOREIGN KEY (`benefitId`) REFERENCES `benefits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_policies` ADD CONSTRAINT `benefit_policies_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_benefits` ADD CONSTRAINT `employee_benefits_benefitId_fkey` FOREIGN KEY (`benefitId`) REFERENCES `benefits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_benefits` ADD CONSTRAINT `employee_benefits_policyId_fkey` FOREIGN KEY (`policyId`) REFERENCES `benefit_policies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_requests` ADD CONSTRAINT `benefit_requests_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_requests` ADD CONSTRAINT `benefit_requests_benefitId_fkey` FOREIGN KEY (`benefitId`) REFERENCES `benefits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_requests` ADD CONSTRAINT `benefit_requests_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_attachments` ADD CONSTRAINT `benefit_attachments_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `benefit_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_attachments` ADD CONSTRAINT `leave_attachments_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `leave_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


