#!/bin/bash

TMP_DIR="/tmp"

echo $PWD

if [ ! -f ../../.env ]; then
  cp ../../.env.example ../../.env
fi

cp ../../.env $TMP_DIR/.env
