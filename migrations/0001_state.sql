CREATE TABLE workbench_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision INTEGER NOT NULL DEFAULT 0,
  initialized INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL CHECK (json_valid(data))
);
INSERT INTO workbench_state(id, updated_at, data) VALUES
  (1, '1970-01-01T00:00:00.000Z', '{"tasks":[],"projects":[],"research":[],"notes":[],"resources":[],"reports":[],"airecords":[]}');
CREATE TABLE login_attempts (
  client_hash TEXT NOT NULL,
  window INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  PRIMARY KEY (client_hash, window)
);
