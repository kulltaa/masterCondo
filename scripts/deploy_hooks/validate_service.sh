#!/bin/bash

supervisorctl=$(which supervisorctl)
API_PROCESS_NAME=condo_admin_api

count=$($supervisorctl status $API_PROCESS_NAME:* | grep -v RUNNING | grep -v grep)

if [ -n "$count" ]; then
  exit 1
fi

exit 0
