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

-- 插入测试数据
INSERT INTO users (username, password, email, role) VALUES
('coach1', '123456', 'coach1@example.com', 'coach'),
('player1', '123456', 'player1@example.com', 'player'),
('manager1', '123456', 'manager1@example.com', 'manager'),
('fan1', '123456', 'fan1@example.com', 'fan');
