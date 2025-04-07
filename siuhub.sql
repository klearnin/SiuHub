-- 创建数据库（如果尚未创建）
CREATE DATABASE IF NOT EXISTS siuhub;
USE siuhub;

-- 创建 users 表
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  password VARCHAR(100) NOT NULL,
  type ENUM('fan', 'player', 'coach', 'manager', 'medic') NOT NULL,
  team_id VARCHAR(100),
  status ENUM('approved', 'pending') DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 插入测试数据
INSERT INTO users (username, password, email, role) VALUES
('coach1', '123456', 'coach1@example.com', 'coach'),
('player1', '123456', 'player1@example.com', 'player'),
('manager1', '123456', 'manager1@example.com', 'manager'),
('fan1', '123456', 'fan1@example.com', 'fan');
