#!/bin/bash

supervisorctl="/usr/local/bin/supervisorctl"

API_PROCESS_NAME=condo_admin_api

$supervisorctl restart $API_PROCESS_NAME:*
