.PHONY: run test build clean format up down

run:
	uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

test:
	venv/bin/pytest tests/ -v

test-api:
	venv/bin/pytest tests/test_api.py -v

benchmark:
	@if [ -z "$(VIDEO)" ]; then echo "Usage: make benchmark VIDEO=path/to/video.mp4"; exit 1; fi
	python tests/benchmark.py $(VIDEO)

clean:
	rm -rf storage/*
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down
