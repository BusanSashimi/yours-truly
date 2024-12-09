#!/bin/bash
export NVM_DIR="/home/ubuntu/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd /home/ubuntu/yours-truly
rm -rf node_modules
npm install
npm run build
pm2 start npm --name yours-truly -- run start
