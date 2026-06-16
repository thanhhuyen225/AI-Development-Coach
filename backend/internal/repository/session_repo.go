package repository

import (
	"database/sql"
	"encoding/json"
	"errors"
	"sort"

	"github.com/ai-development-coach/backend/internal/model"
)

var ErrNotFound = errors.New("session not found")

type SessionRepository struct {
	db *sql.DB
}

func NewSessionRepository(db *sql.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

func (r *SessionRepository) Create(session *model.Session) {
	_ = r.upsert(session)
}

func (r *SessionRepository) Get(id string) (*model.Session, error) {
	var dataJSON string
	err := r.db.QueryRow(`SELECT data_json FROM sessions WHERE id = ?`, id).Scan(&dataJSON)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return decodeSession(dataJSON)
}

func (r *SessionRepository) Save(session *model.Session) error {
	result, err := r.db.Exec(`SELECT id FROM sessions WHERE id = ?`, session.ID)
	if err != nil {
		return err
	}
	_ = result
	return r.upsert(session)
}

func (r *SessionRepository) Delete(id string) error {
	result, err := r.db.Exec(`DELETE FROM sessions WHERE id = ?`, id)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *SessionRepository) ListByUser(userID string) []*model.Session {
	var result []*model.Session
	rows, err := r.db.Query(
		`SELECT data_json FROM sessions WHERE user_id = ? ORDER BY updated_at DESC`,
		userID,
	)
	if err != nil {
		return result
	}
	defer rows.Close()

	for rows.Next() {
		var dataJSON string
		if err := rows.Scan(&dataJSON); err != nil {
			continue
		}
		session, err := decodeSession(dataJSON)
		if err == nil {
			result = append(result, session)
		}
	}
	sort.SliceStable(result, func(i, j int) bool {
		return result[i].UpdatedAt.After(result[j].UpdatedAt)
	})
	return result
}

func (r *SessionRepository) GetOwned(id, userID string) (*model.Session, error) {
	s, err := r.Get(id)
	if err != nil {
		return nil, err
	}
	if s.UserID != userID {
		return nil, ErrNotFound
	}
	return s, nil
}

func (r *SessionRepository) upsert(session *model.Session) error {
	dataJSON, err := json.Marshal(session)
	if err != nil {
		return err
	}
	_, err = r.db.Exec(
		`INSERT INTO sessions (
			id, user_id, app_state, current_role, target_role, career_level,
			message_count, created_at, updated_at, data_json
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			user_id = excluded.user_id,
			app_state = excluded.app_state,
			current_role = excluded.current_role,
			target_role = excluded.target_role,
			career_level = excluded.career_level,
			message_count = excluded.message_count,
			created_at = excluded.created_at,
			updated_at = excluded.updated_at,
			data_json = excluded.data_json`,
		session.ID,
		session.UserID,
		session.AppState,
		session.CurrentRole,
		session.TargetRole,
		session.CareerLevel,
		len(session.Convo.Messages),
		session.CreatedAt.Format(timeLayout),
		session.UpdatedAt.Format(timeLayout),
		string(dataJSON),
	)
	return err
}

func decodeSession(dataJSON string) (*model.Session, error) {
	var session model.Session
	if err := json.Unmarshal([]byte(dataJSON), &session); err != nil {
		return nil, err
	}
	return &session, nil
}
