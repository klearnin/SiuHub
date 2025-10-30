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
  '测试球迷',                 -- 昵称
  '13345678901',              -- 手机号
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
  '18822831891',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'coach',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/a4995f3c6d414277464452700cbc784e copy.png'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'coach_002',         -- 用户 ID
  '测试教练2',                 -- 昵称
  '13345678912',              -- 手机号
  'coach2@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'coach',                      -- 用户类型，可换成 'coach' 或其他
  'team_002',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/58742d41ac65b920ac2a690e23d02c5a.png'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'manager_001',         -- 用户 ID
  '测试经理',                 -- 昵称
  '13345678904',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'manager',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/version.jpg'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'player_001',         -- 用户 ID
  '只因',                 -- 昵称
  '13345678925',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'player',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/1.png'
);

INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'medic_001',         -- 用户 ID
  '测试队医',                 -- 昵称
  '12345678905',              -- 手机号
  'medic@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'medic',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/version.jpg'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'player_002',         -- 用户 ID
  '李明',                 -- 昵称
  '13345678926',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'player',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/2.png'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'player_003',         -- 用户 ID
  '王强',                 -- 昵称
  '13345678927',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'player',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/3.png'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'player_004',         -- 用户 ID
  '赵刚',                 -- 昵称
  '13345678928',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'player',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/4.png'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'player_005',         -- 用户 ID
  '刘洋',                 -- 昵称
  '13345678929',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'player',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/5.png'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'player_006',         -- 用户 ID
  '陈晨',                 -- 昵称
  '13345678930',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'player',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/6.png'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'player_007',         -- 用户 ID
  '杨光',                 -- 昵称
  '13345678931',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'player',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/7.png'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'player_008',         -- 用户 ID
  '周杰',                 -- 昵称
  '13345678932',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'player',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/8.png'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'player_009',         -- 用户 ID
  '吴磊',                 -- 昵称
  '13345678933',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'player',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/9.png'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'player_010',         -- 用户 ID
  '郑智',                 -- 昵称
  '13345678934',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'player',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/10.png'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'player_011',         -- 用户 ID
  '孙翔',                 -- 昵称
  '13345678935',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'player',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/11.png'
);
INSERT INTO users (
  id, name, phone, email, password, type, team_id, status, avatar
) VALUES (
  'player_012',         -- 用户 ID
  '马龙',                 -- 昵称
  '13345678936',              -- 手机号
  'coach@example.com',         -- 邮箱
  MD5('123456'),              -- 密码（加密后）
  'player',                      -- 用户类型，可换成 'coach' 或其他
  'team_001',                       -- 无需 team_id
  'approved',                  -- 状态
  '/public/avatars/12.png'
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
  '弘毅学堂',
  'HYXT',
  '/public/team-logos/a4995f3c6d414277464452700cbc784e.png',
  'invite001',
  'coach_001');
INSERT INTO teams (
  id, name, abbr, logo_path, invite_code, creator_id
) VALUES (
  'team_002',
  '测试队伍2',
  'TEST2',
  '/public/team-logos/58742d41ac65b920ac2a690e23d02c5a.png',
  'invite002',
  'coach_002');
 


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

-- 基础事件记录表
CREATE TABLE match_event_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  period ENUM('1H', '2H', 'ET1', 'ET2', 'PEN') NOT NULL,
  event_minute INT NOT NULL,
  minute_note VARCHAR(20),
  event_type ENUM('goal', 'yellow_card', 'red_card', 'penalty', 'substitution') NOT NULL,
  team_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES match_schedule(id) ON DELETE CASCADE
);

-- 进球事件表
CREATE TABLE match_goals (
  event_id INT PRIMARY KEY,
  scorer_id VARCHAR(100),
  scorer_name VARCHAR(100),
  assist_id VARCHAR(100),
  assist_name VARCHAR(100),
  is_penalty BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否为点球进球',
  FOREIGN KEY (event_id) REFERENCES match_event_log(id) ON DELETE CASCADE
);

-- 替补事件表
CREATE TABLE match_substitutions (
  event_id INT PRIMARY KEY,
  sub_in_id VARCHAR(100),
  sub_in_name VARCHAR(100),
  sub_out_id VARCHAR(100),
  sub_out_name VARCHAR(100),
  FOREIGN KEY (event_id) REFERENCES match_event_log(id) ON DELETE CASCADE
);

-- 红黄牌事件表
CREATE TABLE match_cards (
  event_id INT PRIMARY KEY,
  player_id VARCHAR(100),
  player_name VARCHAR(100),
  card_type ENUM('yellow', 'red') NOT NULL,
  FOREIGN KEY (event_id) REFERENCES match_event_log(id) ON DELETE CASCADE
);

-- 点球事件表（仅点球大战用）
CREATE TABLE match_penalties (
  event_id INT PRIMARY KEY,
  player_id VARCHAR(100),
  player_name VARCHAR(100),
  result ENUM('score', 'miss') NOT NULL,
  FOREIGN KEY (event_id) REFERENCES match_event_log(id) ON DELETE CASCADE
);


-- 球队荣誉表
CREATE TABLE team_honors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  honor_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 个人荣誉表
CREATE TABLE personal_honors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  honor_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 资金变更信息表
CREATE TABLE finance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL COMMENT '变更金额，正数为收入，负数为支出',
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_number INT,
  player_name VARCHAR(100),
  avatar VARCHAR(200) COMMENT '头像本地路径',
  team_id VARCHAR(100) NOT NULL COMMENT '所属球队ID',
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  user_id VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  dominant_foot ENUM('左脚', '右脚'),
  health ENUM('healthy', 'injured') DEFAULT 'healthy' COMMENT '健康状态',
  height INT COMMENT'cm',
  weight INT COMMENT'kg',
  age INT,
   position ENUM(
    '中锋', '影锋', '左边锋', '右边锋',
  '前腰', '左前卫', '右前卫', '中前卫', '后腰',
  '左后卫', '右后卫', '中后卫',
  '守门员'
  ) DEFAULT '守门员' COMMENT '球员位置',
  
  rating INT CHECK (rating BETWEEN 1 AND 5) DEFAULT 5 COMMENT '总体评级',
  
  speed INT CHECK (speed BETWEEN 1 AND 100) DEFAULT 1 COMMENT '速度',
  shooting INT CHECK (shooting BETWEEN 1 AND 100) DEFAULT 1 COMMENT '射门',
  passing INT CHECK (passing BETWEEN 1 AND 100) DEFAULT 1 COMMENT '传球',
  dribbling INT CHECK (dribbling BETWEEN 1 AND 100) DEFAULT 1 COMMENT '盘带',
  defending INT CHECK (defending BETWEEN 1 AND 100) DEFAULT 1 COMMENT '防守',
  stamina INT CHECK (stamina BETWEEN 1 AND 100) DEFAULT 1 COMMENT '体能'
);

INSERT INTO players(player_number, player_name, team_id, avatar, user_id, dominant_foot, health, height, weight, age)
VALUES
(1, '只因', 'team_001', '/public/avatars/1.png', 'player_001', '右脚', 'healthy', 185, 78, 28),
(2, '李明', 'team_001', '/public/avatars/2.png', 'player_002', '右脚', 'healthy', 178, 72, 25),
(3, '王强', 'team_001', '/public/avatars/3.png', 'player_003', '左脚', 'healthy', 182, 75, 27),
(4, '赵刚', 'team_001', '/public/avatars/4.png', 'player_004', '右脚', 'injured', 176, 70, 24),
(5, '刘洋', 'team_001', '/public/avatars/5.png', 'player_005', '右脚', 'healthy', 180, 76, 26),
(6, '陈晨', 'team_001', '/public/avatars/6.png', 'player_006', '左脚', 'healthy', 175, 68, 23),
(7, '杨光', 'team_001', '/public/avatars/7.png', 'player_007', '右脚', 'healthy', 183, 77, 29),
(8, '周杰', 'team_001', '/public/avatars/8.png', 'player_008', '右脚', 'healthy', 177, 71, 25),
(9, '吴磊', 'team_001', '/public/avatars/9.png', 'player_009', '右脚', 'healthy', 181, 74, 27),
(10, '郑智', 'team_001', '/public/avatars/10.png', 'player_010', '右脚', 'healthy', 179, 73, 30),
(11, '孙翔', 'team_001', '/public/avatars/11.png', 'player_011', '左脚', 'healthy', 174, 69, 24),
(12, '马龙', 'team_001', '/public/avatars/12.png', 'player_012', '右脚', 'healthy', 178, 72, 26);

CREATE TABLE tactics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tactic_name VARCHAR(100),
  style VARCHAR(100),
  team_id VARCHAR(100) NOT NULL COMMENT '所属球队ID',
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE tactic_player (
  id INT PRIMARY KEY AUTO_INCREMENT,
  Xvalue INT,
  Yvalue INT,
  tactic_id INT NOT NULL,
  FOREIGN KEY (tactic_id) REFERENCES tactics(id) ON DELETE CASCADE,
  player_id INT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE tactic_characters(
  id INT PRIMARY KEY AUTO_INCREMENT,
  right_corner INT,
  left_corner INT,
  penalty_kicker INT,
  short_freekick INT,
  long_freekick INT,
  captain INT,
  FOREIGN KEY (right_corner) REFERENCES players(id) ON DELETE SET NULL,
  FOREIGN KEY (left_corner) REFERENCES players(id) ON DELETE SET NULL,
  FOREIGN KEY (penalty_kicker) REFERENCES players(id) ON DELETE SET NULL,
  FOREIGN KEY (short_freekick) REFERENCES players(id) ON DELETE SET NULL,
  FOREIGN KEY (long_freekick ) REFERENCES players(id) ON DELETE SET NULL,
  FOREIGN KEY (captain) REFERENCES players(id) ON DELETE SET NULL,
  tactic_id INT NOT NULL,
  FOREIGN KEY (tactic_id) REFERENCES tactics(id) ON DELETE CASCADE
);

CREATE TABLE next_tactic(
  id INT PRIMARY KEY AUTO_INCREMENT,
  next_id INT,
  FOREIGN KEY (next_id) REFERENCES tactics(id) ON DELETE CASCADE,
  team_id VARCHAR(100) NOT NULL UNIQUE COMMENT '所属球队ID',
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

INSERT INTO tactics(tactic_name,style,team_id)
VALUES('test_1','防守反击','team_001');

INSERT INTO tactic_player(Xvalue,Yvalue,tactic_id,player_id)
VALUES('1','2','1','1');

INSERT INTO tactic_player(Xvalue,Yvalue,tactic_id,player_id)
VALUES('2','4','1','2');

INSERT INTO tactic_characters(right_corner,left_corner,penalty_kicker,short_freekick,long_freekick,captain,tactic_id)
VALUES(1,1,1,1,1,2,1);

INSERT INTO next_tactic(next_id,team_id)
VALUES('1','team_001');


CREATE TABLE injuries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  injury_name VARCHAR(255) NOT NULL COMMENT '伤病名称',
  description TEXT COMMENT '伤病描述',
  injury_date DATE NOT NULL COMMENT '受伤日期',
  recovery_days INT NOT NULL COMMENT '预计恢复天数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  uploader_id VARCHAR(50),
  uploader_name VARCHAR(100),
  team_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
