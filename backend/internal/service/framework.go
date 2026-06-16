package service

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"regexp"
	"strings"
	"time"

	"github.com/ai-development-coach/backend/internal/data"
	"github.com/ai-development-coach/backend/internal/model"
	"github.com/ai-development-coach/backend/internal/repository"
	"github.com/google/uuid"
)

type FrameworkService struct {
	repo *repository.FrameworkRepository
}

func NewFrameworkService(repo *repository.FrameworkRepository) *FrameworkService {
	return &FrameworkService{repo: repo}
}

func (s *FrameworkService) DetectDepartment(role string) string {
	r := strings.ToLower(role)
	patterns := map[string]string{
		`engineer|developer|devops|backend|frontend|fullstack|sre|mobile|data scientist|ml|ai engineer`: "Engineering",
		`product manager|pm|product owner|po`:      "Product management",
		`marketing|growth|content|seo|brand`:       "Marketing",
		`sales|account executive|bdr|sdr`:          "Sales",
		`hr|human resource|recruiter|l&d|learning`: "HR / L&D",
		`customer success|csm|support|cx`:          "Customer Success",
	}
	for pattern, dept := range patterns {
		matched, _ := regexp.MatchString(pattern, r)
		if matched {
			return dept
		}
	}
	return "Engineering"
}

func (s *FrameworkService) BuildContext(currentRole, targetRole, level string) string {
	return s.buildDefaultContext(currentRole, targetRole, level)
}

func (s *FrameworkService) BuildContextForUser(userID, currentRole, targetRole, level string) string {
	if s.repo != nil {
		framework, err := s.repo.GetActive(userID, targetRole, level)
		if err != nil {
			framework, err = s.repo.GetActive(userID, "", "")
		}
		if err == nil && len(framework.Competencies) > 0 {
			var lines []string
			for _, c := range framework.Competencies {
				lines = append(lines, fmt.Sprintf("- %s: %s", c.Name, c.Description))
			}
			return fmt.Sprintf(
				"COMPETENCY FRAMEWORK (UPLOADED):\nRole: %s\nTarget Level: %s\n\nCompetencies:\n%s",
				framework.Role,
				framework.TargetLevel,
				strings.Join(lines, "\n"),
			)
		}
	}
	return s.buildDefaultContext(currentRole, targetRole, level)
}

func (s *FrameworkService) Upload(userID, sourceFormat string, reader io.Reader) (*model.CompetencyFramework, error) {
	var payload model.FrameworkUploadPayload
	sourceFormat = strings.ToLower(strings.TrimSpace(sourceFormat))
	switch sourceFormat {
	case "json":
		if err := json.NewDecoder(reader).Decode(&payload); err != nil {
			return nil, err
		}
	case "csv":
		parsed, err := parseFrameworkCSV(reader)
		if err != nil {
			return nil, err
		}
		payload = *parsed
	default:
		return nil, fmt.Errorf("unsupported framework format %q", sourceFormat)
	}

	if strings.TrimSpace(payload.Role) == "" {
		return nil, fmt.Errorf("role is required")
	}
	if strings.TrimSpace(payload.TargetLevel) == "" {
		return nil, fmt.Errorf("targetLevel is required")
	}
	if len(payload.Competencies) == 0 {
		return nil, fmt.Errorf("competencies is required")
	}

	now := time.Now()
	framework := &model.CompetencyFramework{
		ID:           uuid.New().String(),
		UserID:       userID,
		Role:         strings.TrimSpace(payload.Role),
		TargetLevel:  strings.TrimSpace(payload.TargetLevel),
		SourceFormat: sourceFormat,
		Competencies: payload.Competencies,
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := s.repo.Save(framework); err != nil {
		return nil, err
	}
	return framework, nil
}

func (s *FrameworkService) List(userID string) ([]model.CompetencyFramework, error) {
	if s.repo == nil {
		return []model.CompetencyFramework{}, nil
	}
	return s.repo.ListByUser(userID)
}

func parseFrameworkCSV(reader io.Reader) (*model.FrameworkUploadPayload, error) {
	r := csv.NewReader(reader)
	r.TrimLeadingSpace = true
	records, err := r.ReadAll()
	if err != nil {
		return nil, err
	}
	if len(records) < 2 {
		return nil, fmt.Errorf("csv must include header and at least one competency row")
	}

	header := map[string]int{}
	for i, col := range records[0] {
		header[strings.TrimSpace(col)] = i
	}

	required := []string{"role", "targetLevel", "name", "description"}
	for _, col := range required {
		if _, ok := header[col]; !ok {
			return nil, fmt.Errorf("missing csv column %q", col)
		}
	}

	payload := &model.FrameworkUploadPayload{
		Role:        strings.TrimSpace(records[1][header["role"]]),
		TargetLevel: strings.TrimSpace(records[1][header["targetLevel"]]),
	}
	for _, row := range records[1:] {
		if len(row) <= header["name"] || len(row) <= header["description"] {
			continue
		}
		name := strings.TrimSpace(row[header["name"]])
		if name == "" {
			continue
		}
		payload.Competencies = append(payload.Competencies, model.Competency{
			Name:        name,
			Description: strings.TrimSpace(row[header["description"]]),
		})
	}
	return payload, nil
}

func (s *FrameworkService) buildDefaultContext(currentRole, targetRole, level string) string {
	dept := s.DetectDepartment(currentRole)
	if dept == "Engineering" {
		if d := s.DetectDepartment(targetRole); d != "Engineering" {
			dept = d
		}
	}

	lvl, ok := data.CareerLevels[level]
	if !ok {
		lvl = data.CareerLevels["L1"]
	}

	functional := data.FunctionalCompetencies[dept]
	if functional == nil {
		functional = data.FunctionalCompetencies["Engineering"]
	}

	var coreLines []string
	for _, c := range data.CoreCompetencies {
		coreLines = append(coreLines, fmt.Sprintf("- %s: %s", c.Name, c.Levels["Competent"]))
	}

	var funcLines []string
	for _, c := range functional {
		funcLines = append(funcLines, fmt.Sprintf("- %s: %s", c.Name, c.Desc))
	}

	return fmt.Sprintf(
		"COMPETENCY FRAMEWORK (FR-03):\nDepartment: %s\nCareer Level: %s — %s\nLevel focus: %s\n\nCore competencies expected at this level:\n%s\n\nFunctional competencies for %s:\n%s",
		dept, level, lvl.Label, lvl.Focus,
		strings.Join(coreLines, "\n"),
		dept,
		strings.Join(funcLines, "\n"),
	)
}

func ComputeStrength(answers map[string]int) model.StrengthResult {
	counts := map[int]int{0: 0, 1: 0, 2: 0, 3: 0}
	for _, v := range answers {
		counts[v]++
	}

	type pair struct {
		idx   int
		count int
	}
	var sorted []pair
	for idx, count := range counts {
		sorted = append(sorted, pair{idx, count})
	}
	for i := 0; i < len(sorted); i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[j].count > sorted[i].count {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}

	primary := data.DomainMap[sorted[0].idx]
	secondary := data.DomainMap[sorted[1].idx]
	return model.StrengthResult{
		Primary:         primary,
		Secondary:       secondary,
		PrimaryDomain:   primary,
		SecondaryDomain: secondary,
		TopStrengths:    []string{primary, secondary},
		Source:          "quick_discovery",
	}
}
