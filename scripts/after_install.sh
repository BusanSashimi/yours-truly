#!/bin/bash
export NVM_DIR="/home/ubuntu/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
echo "IS this working"
echo "$PATH"
echo npm -v
echo node -v
cd /home/ubuntu/yours-truly
npm install
npm run build
