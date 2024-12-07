#!/bin/bash
export NVM_DIR="/home/ubuntu/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
echo "$PATH"
cd /home/ubuntu/yours-truly
npm cache verify
npm ci
npm run build
