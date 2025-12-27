start:
	docker compose -f docker-compose.yml up -d
	docker compose -f global-compose.yml up -d

stop:
	docker compose -f docker-compose.yml down
	docker compose -f global-compose.yml down

install:
	docker network create good-food
	docker volume create rabbitmq-data
