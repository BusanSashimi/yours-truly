#!/bin/bash
cd /home/ubuntu/yours-truly
/home/ubuntu/.nvm/versions/node/v22.12.0/bin/pm2 start npm --name yours-truly -- run start
