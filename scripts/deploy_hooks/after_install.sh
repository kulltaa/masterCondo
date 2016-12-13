#!/bin/bash

TMP_DIR="/tmp"
CODE_DIR="/home/ec2-user/api/condo_admin"

sudo chown -R ec2-user: $CODE_DIR

if [ -f $TMP_DIR/.env ]; then
  cp $TMP_DIR/.env $CODE_DIR/.env
else
  cp $CODE_DIR/.env.example $CODE_DIR/.env
fi

npm install
