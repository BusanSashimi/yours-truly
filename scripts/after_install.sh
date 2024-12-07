#!/bin/bash
export NVM_DIR="/home/ubuntu/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
echo "$PATH"
cd /home/ubuntu/yours-truly
rm -rf /home/ubuntu/yours-truly/node_modules /home/ubuntu/yours-trulypackage-lock.json
npm install
npm run build
