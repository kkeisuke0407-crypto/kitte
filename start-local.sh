#!/bin/sh
# 切手買取LPをローカルで確認する（Node.js が必要）。止めるときは Ctrl + C
cd "$(dirname "$0")" && node tools/serve.cjs "$@"
