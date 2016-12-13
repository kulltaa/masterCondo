#!/bin/bash

source /home/ec2-user/.bashrc

TMP_DIR="/tmp"
CODE_DIR="/home/ec2-user/api/condo_admin"
NPM="$(which npm)"

echo $NPM

if [ -f $TMP_DIR/.env ]; then
  cp $TMP_DIR/.env $CODE_DIR/.env
else
  cp $CODE_DIR/.env.example $CODE_DIR/.env
fi

cd $CODE_DIR && $NPM install
