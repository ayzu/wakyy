######### Local  ###########################
dev:
	tsc-watch --onSuccess 'node .'

dev2:
	ts-node-dev --ignore-watch node_modules --transpile-only true -r tsconfig-paths/register src/app.ts

build:
	tsc

run: build
	node .

mongo:
	mongod --dbpath ../../.mongo/data

pretty:
	prettier --write src

lint:
	eslint --max-warnings 0 --ext ts,tsx,json src


######### Docker ###########################

docker-build: build
	docker build . -t wakyy

docker-run: docker-build
	docker run --name=wakyy --rm -it --env-file=.env wakyy

docker-push: docker-build
	docker tag wakyy registry.digitalocean.com/ayzu/wakyy && docker push registry.digitalocean.com/ayzu/wakyy:latest

docker-push-env:
	scp prod.env root@188.166.7.87:/home/.env

docker-inspect:
	docker history --human --format "{{.CreatedBy}}: {{.Size}}" wakyy

docker-login:
	docker login registry.digitalocean.com


############ Server ##############################

server-login:
	ssh root@188.166.7.87

server-pull:
	docker pull registry.digitalocean.com/ayzu/wakyy

server-run:
	docker stop wakyy
	docker run --name=wakyy --rm --env-file=/home/.env --pull=always registry.digitalocean.com/ayzu/wakyy
