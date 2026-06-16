.PHONY: backend frontend dev install build

backend:
	cd backend && go run ./cmd/server

backend-build:
	cd backend && go build -o bin/server ./cmd/server

frontend:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

install:
	cd frontend && npm install
	cd backend && go mod tidy

dev:
	@echo "Run in two terminals:"
	@echo "  make backend   (port 8080)"
	@echo "  make frontend  (port 5173)"

build: backend-build frontend-build
