-- 创建数据库（如果尚未创建）
CREATE DATABASE IF NOT EXISTS siuhub;
USE siuhub;

-- 创建 users 表
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role ENUM('coach', 'player', 'manager', 'medic', 'fan') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- 插入一条训练类型的主表记录
INSERT INTO schedule (date, type) 
VALUES ('2025-04-13', 'training');

-- 插入对应的训练表记录
INSERT INTO training_schedule (schedule_id, training_time, team_training, personal_training)
VALUES (1, '15:00:00', '全队战术训练', '个人射门练习');

-- 插入一条比赛类型的主表记录
INSERT INTO schedule (date, type) 
VALUES ('2025-04-24', 'match');

-- 插入对应的比赛表记录
INSERT INTO match_schedule (schedule_id, location, match_time, team1, team2)
VALUES (2, '市体育场', '18:30:00', '红队', '蓝队');
