-- ==============================================================================
-- Schema DDL — Laboratorio DevOps AWS (devopslab)
-- Motor: MySQL 8.0
-- Claves Primarias: UUID (CHAR(36)) generadas automáticamente con UUID()
-- ==============================================================================

-- 1. Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS devopslab
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE devopslab;

-- 2. Tabla: users
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_users PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla: materials
-- Nota: image_key guarda la referencia al objeto almacenado en el Bucket S3 (materials-images-dev)
CREATE TABLE IF NOT EXISTS materials (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  image_key VARCHAR(255) NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_materials PRIMARY KEY (id),
  CONSTRAINT fk_materials_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_materials_name (name),
  INDEX idx_materials_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Datos Iniciales (Seed Data) para pruebas
-- Usuario de prueba inicial (Password simulado con hash bcrypt de 'Admin123!')
INSERT INTO users (id, name, email, password_hash)
VALUES (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'DevOps Admin',
  'admin@devopslab.local',
  '$2b$10$wT5a0N4y8yP0rY.d7Z9g1eZ4G1qO1kM9eA2sQ6m5z8L3yK2vJ5rKu'
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Materiales de prueba con referencias a objetos S3
INSERT INTO materials (id, name, description, price, image_key, created_by)
VALUES
(
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  'Tubo de Acero Galvanizado 2 pulgadas',
  'Tubo industrial de alta resistencia para estructuras metalicas',
  45.50,
  'materials/tubo-galvanizado.jpg',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
),
(
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
  'Plancha de Madera Pino Tratada',
  'Madera cepillada y tratada contra humedad para construccion liviana',
  28.00,
  'materials/plancha-pino.jpg',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
)
ON DUPLICATE KEY UPDATE name = VALUES(name);
