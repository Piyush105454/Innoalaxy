test:
	cd backend && pytest tests

test-coverage:
	cd backend && pytest --cov=app tests

lint:
	cd backend && ruff check app tests
	cd frontend && npm run build

