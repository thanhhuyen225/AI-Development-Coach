package repository

import (
	"database/sql"
	"encoding/json"
	"errors"

	"github.com/ai-development-coach/backend/internal/model"
)

type StrengthProfileRepository struct {
	db *sql.DB
}

func NewStrengthProfileRepository(db *sql.DB) *StrengthProfileRepository {
	return &StrengthProfileRepository{db: db}
}

func (r *StrengthProfileRepository) Save(profile *model.StrengthProfileRecord) error {
	topStrengthsJSON, err := json.Marshal(profile.TopStrengths)
	if err != nil {
		return err
	}
	answersJSON, err := json.Marshal(profile.Answers)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(
		`INSERT INTO strength_profiles (
			id, session_id, user_id, primary_domain, secondary_domain, source,
			top_strengths_json, answers_json, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(session_id) DO UPDATE SET
			primary_domain = excluded.primary_domain,
			secondary_domain = excluded.secondary_domain,
			source = excluded.source,
			top_strengths_json = excluded.top_strengths_json,
			answers_json = excluded.answers_json,
			updated_at = excluded.updated_at`,
		profile.ID,
		profile.SessionID,
		profile.UserID,
		profile.PrimaryDomain,
		profile.SecondaryDomain,
		profile.Source,
		string(topStrengthsJSON),
		string(answersJSON),
		profile.CreatedAt.Format(timeLayout),
		profile.UpdatedAt.Format(timeLayout),
	)
	return err
}

func (r *StrengthProfileRepository) GetBySession(sessionID, userID string) (*model.StrengthProfileRecord, error) {
	return r.get(
		`SELECT id, session_id, user_id, primary_domain, secondary_domain, source,
		        top_strengths_json, answers_json, created_at, updated_at
		   FROM strength_profiles
		  WHERE session_id = ? AND user_id = ?`,
		sessionID,
		userID,
	)
}

func (r *StrengthProfileRepository) GetLatestByUser(userID string) (*model.StrengthProfileRecord, error) {
	return r.get(
		`SELECT id, session_id, user_id, primary_domain, secondary_domain, source,
		        top_strengths_json, answers_json, created_at, updated_at
		   FROM strength_profiles
		  WHERE user_id = ?
		  ORDER BY updated_at DESC
		  LIMIT 1`,
		userID,
	)
}

func (r *StrengthProfileRepository) get(query string, args ...any) (*model.StrengthProfileRecord, error) {
	var profile model.StrengthProfileRecord
	var topStrengthsJSON, answersJSON, createdAt, updatedAt string
	err := r.db.QueryRow(query, args...).Scan(
		&profile.ID,
		&profile.SessionID,
		&profile.UserID,
		&profile.PrimaryDomain,
		&profile.SecondaryDomain,
		&profile.Source,
		&topStrengthsJSON,
		&answersJSON,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	_ = json.Unmarshal([]byte(topStrengthsJSON), &profile.TopStrengths)
	_ = json.Unmarshal([]byte(answersJSON), &profile.Answers)
	profile.CreatedAt = parseTime(createdAt)
	profile.UpdatedAt = parseTime(updatedAt)
	return &profile, nil
}
