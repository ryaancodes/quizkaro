CREATE TABLE IF NOT EXISTS attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT NOT NULL,
  player VARCHAR(24) NOT NULL,
  points INT NOT NULL,
  correct INT NOT NULL,
  total INT NOT NULL,
  seconds INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_quiz_points (quiz_id, points)
);
