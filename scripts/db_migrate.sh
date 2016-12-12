#!/bin/bash

MYSQL_USERNAME="${MYSQL_USERNAME:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-""}"
MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_DBNAME="${MYSQL_DBNAME:-condo}"

url="mysql://${MYSQL_USERNAME}:${MYSQL_PASSWORD}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DBNAME}"

echo "pass: $MYSQL_PASSWORD"
echo "DB_URL: $url"

up() {
  cd ..
  ./node_modules/.bin/sequelize db:migrate --url $url
}

down() {
  cd ..
  ./node_modules/.bin/sequelize db:migrate:undo --url $url
}

downall() {
  if [ "$NODE_ENV" != "development" ]; then
    echo "WARNING: Do not run this in test or production environment"
    exit 1
  fi

  cd ..
  ./node_modules/.bin/sequelize db:migrate:undo:all --url $url
}

case "$1" in
  up)
    up
    ;;
  down)
    down
    ;;
  downall)
    downall
    ;;
  *)
    echo -e "Usage: $0 {up|down}\n"
    exit 1
esac
