#!/bin/bash

API_PROCESS_NAME=condo_admin_api

supervisorctl restart $API_PROCESS_NAME:*
