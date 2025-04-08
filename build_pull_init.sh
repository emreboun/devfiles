#!/bin/bash

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
