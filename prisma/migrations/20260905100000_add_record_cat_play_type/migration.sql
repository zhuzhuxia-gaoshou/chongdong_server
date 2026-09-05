-- 猫玩玩法落库：type=catPlay 的记录记录所选玩法（逗猫棒等 6 种）
ALTER TABLE `exercise_records` ADD COLUMN `catPlayType` VARCHAR(191) NULL;
