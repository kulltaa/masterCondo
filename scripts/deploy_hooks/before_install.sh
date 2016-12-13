#!/bin/bash

TMP_DIR="/tmp"
CODE_DIR="/home/ec2-user/condo_admin"

if [ ! -d $CODE_DIR ]; then
  exit 0
fi

if [ ! -f $CODE_DIR/.env ]; then
  cp $CODE_DIR/.env.example $CODE_DIR/.env
fi

cp $CODE_DIR/.env $TMP_DIR/.env
