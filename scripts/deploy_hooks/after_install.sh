#!/bin/bash

TMP_DIR="/tmp"
CODE_DIR="/home/ec2-user/condo_admin"

cp $TMP_DIR/.env $CODE_DIR/.env
npm install
