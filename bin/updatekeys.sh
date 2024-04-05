#!/bin/bash

find . -name "*.enc.*" -exec sops updatekeys -y {} \;
