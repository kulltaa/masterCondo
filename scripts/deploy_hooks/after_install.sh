#!/bin/bash

. /home/ec2-user/.bashrc

tmpdir="/tmp"
codedir="/home/ec2-user/api/condo_admin"
npm=$(which npm)

if [ -f $tmpdir/.env ]; then
  cp $tmpdir/.env $codedir/.env
else
  cp $codedir/.env.example $codedir/.env
fi

cd $codedir && $npm install
