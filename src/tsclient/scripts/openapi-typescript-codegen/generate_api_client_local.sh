#!/usr/bin/env bash

# usage: yarn generate:api:client:local [--output]

# OPTIONS:
#  --output  the path folder where types will be generated

openapi --input http://app-dev:8000/v1.0/swagger.json --output $1 --indent='2' --name ApiClientImpress --useOptions
