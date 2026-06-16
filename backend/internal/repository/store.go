package repository

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

type Store struct {
	db *sql.DB
}

func NewStore(path string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return nil, fmt.Errorf("create db directory: %w", err)
	}

	db, err := sql.Open("sqlite3", path+"?_foreign_keys=on&_busy_timeout=5000")
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	if err := migrate(db); err != nil {
		_ = db.Close()
		return nil, err
	}

	return &Store{db: db}, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) Users() *UserRepository {
	return NewUserRepository(s.db)
}

func (s *Store) Sessions() *SessionRepository {
	return NewSessionRepository(s.db)
}

func (s *Store) StrengthProfiles() *StrengthProfileRepository {
	return NewStrengthProfileRepository(s.db)
}

func (s *Store) Frameworks() *FrameworkRepository {
	return NewFrameworkRepository(s.db)
}

func migrate(db *sql.DB) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			name TEXT NOT NULL,
			current_role TEXT NOT NULL DEFAULT '',
			target_role TEXT NOT NULL DEFAULT '',
			department TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL
		);`,
		`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
		`CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			app_state TEXT NOT NULL,
			current_role TEXT NOT NULL DEFAULT '',
			target_role TEXT NOT NULL DEFAULT '',
			career_level TEXT NOT NULL DEFAULT '',
			message_count INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			data_json TEXT NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_sessions_user_updated ON sessions(user_id, updated_at DESC);`,
		`CREATE TABLE IF NOT EXISTS strength_profiles (
			id TEXT PRIMARY KEY,
			session_id TEXT NOT NULL UNIQUE,
			user_id TEXT NOT NULL,
			primary_domain TEXT NOT NULL,
			secondary_domain TEXT NOT NULL,
			source TEXT NOT NULL,
			top_strengths_json TEXT NOT NULL,
			answers_json TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_strength_profiles_session ON strength_profiles(session_id);`,
		`CREATE INDEX IF NOT EXISTS idx_strength_profiles_user ON strength_profiles(user_id);`,
		`CREATE TABLE IF NOT EXISTS competency_frameworks (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			role TEXT NOT NULL,
			target_level TEXT NOT NULL,
			source_format TEXT NOT NULL,
			competencies_json TEXT NOT NULL,
			is_active INTEGER NOT NULL DEFAULT 1,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_frameworks_user_role_level ON competency_frameworks(user_id, role, target_level, is_active);`,
	}

	for _, stmt := range statements {
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("run sqlite migration: %w", err)
		}
	}
	return nil
}
