#!/bin/bash
cd ~/YoursTruly
git pull origin master
npm install &&
npm run build &&
pm2 restart yours-truly
