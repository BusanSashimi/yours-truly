#!/bin/bash
cd /home/ubuntu/yours-truly
pm2 start npm --name yours-truly -- run start
