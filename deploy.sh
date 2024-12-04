#!/bin/bash
cd ~/YoursTruly
git pull origin master
npm run install &&
npm run build &&
pm2 restart yours-truly
