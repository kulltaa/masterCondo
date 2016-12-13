#!/bin/bash

TMP_DIR="/tmp"
CODE_DIR="/srv/www/condo_admin"

cp $TMP_DIR/.env $CODE_DIR/.env
npm install
