-- creat users table
-- id (INT, PK, Auto Increment)
-- username (VARCHAR 50, Unique)
-- email (VARCHAR 100, Unique)
-- password (VARCHAR 255) → hashed with bcrypt
-- created_at (TIMESTAMP)

-- Creat posts table
-- id (INT, PK, Auto Increment)
-- user_id (Foreign Key → users.id)
-- title (VARCHAR 255)

-- content (TEXT)
-- created_at (TIMESTAMP)