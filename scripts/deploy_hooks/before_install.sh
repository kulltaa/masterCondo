#!/bin/bash

TMP_DIR="/tmp"
CODE_DIR="/home/ec2-user/condo_admin"

if [ ! -d $CODE_DIR ]; then
  exit 0
fi

cp $CODE_DIR/.env $TMP_DIR/.env
