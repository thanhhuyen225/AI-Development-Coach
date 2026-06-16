package repository

import (
	"database/sql"
	"encoding/json"
	"errors"
	"strings"

	"github.com/ai-development-coach/backend/internal/model"
)

type FrameworkRepository struct {
	db *sql.DB
}

func NewFrameworkRepository(db *sql.DB) *FrameworkRepository {
	return &FrameworkRepository{db: db}
}

func (r *FrameworkRepository) Save(framework *model.CompetencyFramework) error {
	competenciesJSON, err := json.Marshal(framework.Competencies)
	if err != nil {
		return err
	}

	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if framework.IsActive {
		if _, err := tx.Exec(
			`UPDATE competency_frameworks
			    SET is_active = 0
			  WHERE user_id = ? AND role = ? AND target_level = ?`,
			framework.UserID,
			framework.Role,
			framework.TargetLevel,
		); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(
		`INSERT INTO competency_frameworks (
			id, user_id, role, target_level, source_format, competencies_json,
			is_active, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		framework.ID,
		framework.UserID,
		framework.Role,
		framework.TargetLevel,
		framework.SourceFormat,
		string(competenciesJSON),
		boolToInt(framework.IsActive),
		framework.CreatedAt.Format(timeLayout),
		framework.UpdatedAt.Format(timeLayout),
	); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *FrameworkRepository) GetActive(userID, role, targetLevel string) (*model.CompetencyFramework, error) {
	var framework model.CompetencyFramework
	var competenciesJSON, createdAt, updatedAt string
	var active int
	err := r.db.QueryRow(
		`SELECT id, user_id, role, target_level, source_format, competencies_json,
		        is_active, created_at, updated_at
		   FROM competency_frameworks
		  WHERE user_id = ?
		    AND is_active = 1
		    AND (role = ? OR ? = '')
		    AND (target_level = ? OR ? = '')
		  ORDER BY updated_at DESC
		  LIMIT 1`,
		userID,
		role,
		strings.TrimSpace(role),
		targetLevel,
		strings.TrimSpace(targetLevel),
	).Scan(
		&framework.ID,
		&framework.UserID,
		&framework.Role,
		&framework.TargetLevel,
		&framework.SourceFormat,
		&competenciesJSON,
		&active,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	_ = json.Unmarshal([]byte(competenciesJSON), &framework.Competencies)
	framework.IsActive = active == 1
	framework.CreatedAt = parseTime(createdAt)
	framework.UpdatedAt = parseTime(updatedAt)
	return &framework, nil
}

func (r *FrameworkRepository) ListByUser(userID string) ([]model.CompetencyFramework, error) {
	rows, err := r.db.Query(
		`SELECT id, user_id, role, target_level, source_format, competencies_json,
		        is_active, created_at, updated_at
		   FROM competency_frameworks
		  WHERE user_id = ?
		  ORDER BY updated_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var frameworks []model.CompetencyFramework
	for rows.Next() {
		var framework model.CompetencyFramework
		var competenciesJSON, createdAt, updatedAt string
		var active int
		if err := rows.Scan(
			&framework.ID,
			&framework.UserID,
			&framework.Role,
			&framework.TargetLevel,
			&framework.SourceFormat,
			&competenciesJSON,
			&active,
			&createdAt,
			&updatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(competenciesJSON), &framework.Competencies)
		framework.IsActive = active == 1
		framework.CreatedAt = parseTime(createdAt)
		framework.UpdatedAt = parseTime(updatedAt)
		frameworks = append(frameworks, framework)
	}
	return frameworks, rows.Err()
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}
