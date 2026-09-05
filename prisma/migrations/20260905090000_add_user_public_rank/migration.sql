-- 用户隐私设置：是否参与公开排行榜（设置页开关，默认所有人参与）
ALTER TABLE `users` ADD COLUMN `isPublicRank` BOOLEAN NOT NULL DEFAULT true;
