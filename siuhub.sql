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


CREATE TABLE teams (
  id VARCHAR(100) PRIMARY KEY COMMENT '球队ID',
  name VARCHAR(100) NOT NULL UNIQUE COMMENT '球队名称',
  abbr VARCHAR(20) NOT NULL COMMENT '球队缩写',
  logo_path VARCHAR(200) COMMENT '队徽本地路径',
  invite_code VARCHAR(20) UNIQUE NOT NULL COMMENT '邀请码（教练生成）',
  creator_id VARCHAR(100) NOT NULL COMMENT '创建人ID（即教练）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

