SET NAMES utf8mb4;
set character_set_results=gb2312;
-- 创建数据库（如果尚未创建）
DROP DATABASE IF EXISTS siuhub;
CREATE DATABASE IF NOT EXISTS siuhub;
USE siuhub;

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
  'team_001',                       -- 无需 team_id
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
 


CREATE TABLE notices (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '公告ID',
  title VARCHAR(255) NOT NULL COMMENT '公告标题',
  content TEXT NOT NULL COMMENT '公告内容',
  publish_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  type ENUM('fan', 'team') NOT NULL COMMENT '公告类型（面向球迷/球队成员）',
  team_id VARCHAR(100) NOT NULL COMMENT '所属球队ID',
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 插入测试公告
INSERT INTO notices (title, content, publish_time, type, team_id) VALUES
('team公告1', '这是测试球队的队内公告', '2025-04-13 15:30:00', 'team', 'team_001'),
('fan公告1', '这是测试球队面向球迷的公告', '2025-04-12 15:30:00', 'fan', 'team_001');



-- 主表
CREATE TABLE schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    type ENUM('training', 'match', 'past_match' ,'else') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    team_id VARCHAR(100) NOT NULL COMMENT '所属球队ID',
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
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

-- 其他表
CREATE TABLE else_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    else_time TIME,
    content TEXT,
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

-- 修复帖子表

CREATE TABLE forum_posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 修复帖子点赞表

CREATE TABLE forum_post_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES forum_posts(id)ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)ON DELETE CASCADE
);

-- 修复评论表

CREATE TABLE forum_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES forum_posts(id)ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)ON DELETE CASCADE
);

-- 修复评论点赞表

CREATE TABLE forum_comment_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  comment_id INT NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id),
  FOREIGN KEY (comment_id) REFERENCES forum_comments(id)ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)ON DELETE CASCADE
);

-- 修复评论回复表

CREATE TABLE forum_comment_replies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  comment_id INT NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES forum_comments(id)ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)ON DELETE CASCADE
);

-- 修复回复点赞表

CREATE TABLE forum_reply_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reply_id INT NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reply_id, user_id),
  FOREIGN KEY (reply_id) REFERENCES forum_comment_replies(id)ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)ON DELETE CASCADE
);

-- 插入一条训练类型的主表记录
INSERT INTO schedule (date, type, team_id) 
VALUES ('2025-04-13', 'training','team_001');

-- 插入对应的训练表记录
INSERT INTO training_schedule (schedule_id, training_time, team_training, personal_training)
VALUES (1, '15:00:00', '全队战术训练', '个人射门练习');

-- 插入一条比赛类型的主表记录
INSERT INTO schedule (date, type, team_id) 
VALUES ('2025-04-24', 'match','team_001');

-- 插入对应的比赛表记录
INSERT INTO match_schedule (schedule_id, location, match_time, team1, team2)
VALUES (2, '市体育场', '18:30:00', '红队', '蓝队');

-- 插入一条其他类型的主表记录
INSERT INTO schedule (date, type, team_id) 
VALUES ('2025-04-15', 'else','team_001');

-- 插入对应的训练表记录
INSERT INTO else_schedule (schedule_id, else_time, content)
VALUES (3, '16:00:00', '艹只因');
