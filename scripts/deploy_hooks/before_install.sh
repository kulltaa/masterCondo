#!/bin/bash

tmpdir="/tmp"
codedir="/home/ec2-user/api/condo_admin"

if [ ! -d $codedir ]; then
  exit 0
fi

cp $codedir/.env $tmpdir/.env
