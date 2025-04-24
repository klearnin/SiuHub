-- 创建数据库（如果尚未创建）
CREATE DATABASE IF NOT EXISTS siuhub;
USE siuhub;

-- 创建 users 表
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id VARCHAR(100) PRIMARY KEY COMMENT '用户ID',
  name VARCHAR(50) NOT NULL COMMENT '昵称',
  phone VARCHAR(20) NOT NULL COMMENT '手机号',
  email VARCHAR(100) COMMENT '邮箱',
  password VARCHAR(100) NOT NULL COMMENT '密码(MD5加密)',
  type ENUM('fan', 'player', 'coach', 'manager', 'medic') NOT NULL COMMENT '用户类型',
  team_id VARCHAR(100) COMMENT '所属球队ID（球迷选择主队，其他角色关联团队）',
  status ENUM('pending', 'approved') DEFAULT 'approved' COMMENT '审核状态（球员、经理、队医默认为 pending）',
  avatar VARCHAR(200) COMMENT '头像本地路径',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  UNIQUE KEY unique_phone_type (phone, type)  -- 联合唯一索引：手机号 + 身份不能重复
);
-- 插入一个默认用户（用于测试登录）
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'default-user-001',         -- 用户 ID
  '测试用户',                 -- 昵称
  '12345678901',              -- 手机号
  'test@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'fan',                      -- 用户类型，可换成 'coach' 或其他
  NULL,                       -- 无需 team_id
  'approved',                 -- 状态
  '/public/avatars/version.jpg'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'coach_001',         -- 用户 ID
  '测试教练',                 -- 昵称
  '11122233345',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'coach',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/version.jpg'
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
  '/public/team-logos/version.jpg',
  'invite001',
  'coach_001');

DROP TABLE IF EXISTS notices;

CREATE TABLE notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  publish_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  type ENUM('fan','team') NOT NULL
);

-- 插入测试数据
INSERT INTO users (username, password, email, role) VALUES
('coach1', '123456', 'coach1@example.com', 'coach'),
('player1', '123456', 'player1@example.com', 'player'),
('manager1', '123456', 'manager1@example.com', 'manager'),
('fan1', '123456', 'fan1@example.com', 'fan');

INSERT INTO notices (title, content, publish_time, type) VALUES
('team1', '123456', '2025-04-13 15:30:00', 'team'),
('fan1', '123456111', '2025-04-12 15:30:00', 'fan');


-- 删除旧表（顺序注意外键依赖）
DROP TABLE IF EXISTS match_event;
DROP TABLE IF EXISTS match_schedule;
DROP TABLE IF EXISTS training_schedule;
DROP TABLE IF EXISTS schedule;

-- 主表
CREATE TABLE schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    type ENUM('training', 'match', 'past_match') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 训练表
CREATE TABLE training_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    training_time TIME,
    team_training TEXT,
    personal_training TEXT,
    FOREIGN KEY (schedule_id) REFERENCES schedule(id) ON DELETE CASCADE
);

-- 比赛表
CREATE TABLE match_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    location VARCHAR(255),
    match_time TIME,
    team1 VARCHAR(100),
    team2 VARCHAR(100),
    FOREIGN KEY (schedule_id) REFERENCES schedule(id) ON DELETE CASCADE
);

-- 比赛事件表（仅过去比赛使用）
CREATE TABLE match_event (
    id INT PRIMARY KEY AUTO_INCREMENT,
    match_schedule_id INT NOT NULL,
    event_time VARCHAR(20),
    description TEXT,
    FOREIGN KEY (match_schedule_id) REFERENCES match_schedule(id) ON DELETE CASCADE
);
