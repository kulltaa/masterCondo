#!/bin/bash

TMP_DIR="/tmp"
CODE_DIR="/srv/www/condo_admin"

if [ ! -f $CODE_DIR/.env ]; then
  cp $CODE_DIR/.env.example $CODE_DIR/.env
fi

cp $CODE_DIR/.env $TMP_DIR/.env
