package repository

import "time"

const timeLayout = time.RFC3339Nano

func parseTime(value string) time.Time {
	t, err := time.Parse(timeLayout, value)
	if err != nil {
		return time.Now()
	}
	return t
}
