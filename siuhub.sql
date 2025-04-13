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

CREATE TABLE notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  publish_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  type ENUM('fan','team') NOT NULL,
);

-- 插入测试数据
INSERT INTO users (username, password, email, role) VALUES
('coach1', '123456', 'coach1@example.com', 'coach'),
('player1', '123456', 'player1@example.com', 'player'),
('manager1', '123456', 'manager1@example.com', 'manager'),
('fan1', '123456', 'fan1@example.com', 'fan');

INSERT INTO notices (title, content, publish_time, type) VALUES
('team1', '123456', '2025-04-13 15:30:00', 'team'),
('fan1', '123456111', '2025-04-12 15:30:00', 'fan'),
