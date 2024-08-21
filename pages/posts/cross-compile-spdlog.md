---
title: 【交叉编译】spdlog
date: 2024-01-31 16:22:33 +8
updated: 2024-01-31 16:22:33 +8
tags: [cross compile, cmake, aarch64, spdlog]
categories: 
  - 牛排的小笔记
---

## 获取源码

1. 仓库地址
   - [gabime/spdlog: Fast C++ logging library. (github.com)](https://github.com/gabime/spdlog) 

## 编译过程

1. 编译脚本

```sh
#!/bin/bash
set -e

# 获取绝对路径
ROOT_PWD=$( cd "$( dirname $0 )" && cd -P "$( dirname "$SOURCE" )" && pwd )

# 创建build目录
BUILD_DIR=${ROOT_PWD}/build/build_linux_aarch64
if [[ ! -d "${BUILD_DIR}" ]]; then
  mkdir -p ${BUILD_DIR}
fi

cd ${BUILD_DIR}
cmake -B . -S ${ROOT_PWD} \
-DCMAKE_BUILD_TYPE=Release \
-DCMAKE_C_COMPILER=/usr/bin/aarch64-linux-gnu-gcc \
-DCMAKE_CXX_COMPILER=/usr/bin/aarch64-linux-gnu-g++ \
-DCMAKE_INSTALL_PREFIX=/opt/spdlog
make -j8

```

2. 执行编译

```bash
> chmod +x build.sh
> ./build.sh

> cd ./build/build_linux_aarch64
# 部分路径需要sudo权限
> make install
```
