-- 创建数据库（如果尚未创建）
CREATE DATABASE IF NOT EXISTS siuhub;
USE siuhub;

-- 创建 users 表
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id VARCHAR(100) PRIMARY KEY COMMENT '用户ID',
  name VARCHAR(50) NOT NULL COMMENT '昵称',
  phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
  email VARCHAR(100) COMMENT '邮箱',
  password VARCHAR(100) NOT NULL COMMENT '密码(MD5加密)',
  type ENUM('fan', 'player', 'coach', 'manager', 'medic') NOT NULL COMMENT '用户类型',
  team_id VARCHAR(100) COMMENT '所属球队ID（球迷选择主队，其他角色关联团队）',
  status ENUM('pending', 'approved') DEFAULT 'approved' COMMENT '审核状态（球员、经理、队医默认为 pending）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间'
);
-- 插入一个默认用户（用于测试登录）
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status
) VALUES (
  'default-user-001',         -- 用户 ID
  '测试用户',                 -- 昵称
  '12345678901',              -- 手机号
  'test@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'fan',                      -- 用户类型，可换成 'coach' 或其他
  NULL,                       -- 无需 team_id
  'approved'                  -- 状态
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status
) VALUES (
  'coach_001',         -- 用户 ID
  '测试教练',                 -- 昵称
  '11122233345',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'coach',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved'                  -- 状态
);


CREATE TABLE teams (
  id VARCHAR(100) PRIMARY KEY COMMENT '球队ID',
  name VARCHAR(100) NOT NULL UNIQUE COMMENT '球队名称',
  abbr VARCHAR(20) NOT NULL COMMENT '球队缩写',
  logo_path VARCHAR(200) COMMENT '队徽本地路径',
  invite_code VARCHAR(20) UNIQUE NOT NULL COMMENT '邀请码（教练生成）',
  creator_id VARCHAR(100) NOT NULL COMMENT '创建人ID（即教练）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

INSERT INTO teams (
  id, name, abbr, logo_path, invite_code, creator_id
) VALUES (
  'team_001',
  '测试队伍',
  'TEST',
  '\SiuHub\picture\version.jpg',
  'invite001',
  'coach_001'
);
