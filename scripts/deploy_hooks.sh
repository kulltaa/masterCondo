#/bin/bash

TMP_DIR=/tmp
API_PROCESS_NAME=condo_admin_api

before_install() {
  if [ ! -f .env ]; then
    cp .env.example ../.env
  fi

  cp .env $TMP_DIR/.env
}

after_install() {
  cp $TMP_DIR/.env .
  npm install
}

application_start() {
  supervisorctl restart $API_PROCESS_NAME:*
}

case "$1" in
  before_install)
    before_install
    ;;
  after_install)
    after_install
    ;;
  application_start)
    application_start
    ;;
  *)
    echo -e "Usage: $0 {before_install|after_install|application_start}"
    exit 1
esac
