---
title: 【交叉编译】numcpp
date: 2024-02-02 16:22:33 +8
updated: 2024-02-02 16:22:33 +8
tags: [cross compile, cmake, aarch64, numcpp]
categories: 
  - 牛排的小教程
---

## 获取源码

1. 代码仓库
   - [dpilger26/NumCpp: C++ implementation of the Python Numpy library (github.com)](https://github.com/dpilger26/NumCpp) 

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
    -DCMAKE_INSTALL_PREFIX=/opt/numcpp \
    -DCMAKE_FIND_ROOT_PATH=/opt/boost
make -j8

```

2. 编译依赖库boost（见**【交叉编译】boost**）
   - Numcpp依赖 boost == 1.68.0：[Index of main/release/1.68.0/source (jfrog.io)](https://boostorg.jfrog.io/artifactory/main/release/1.68.0/source/) 
   - 根据实际情况只编译依赖的模块：`./bootstrap.sh --with-libraries=date_time,log` 
   - 使用 `-DCMAKE_FIND_ROOT_PATH=/opt/boost` 指定boost的安装路径

3. 执行编译

```bash
> chmod +x build.sh
> ./build.sh

> cd ./build/build_linux_aarch64
# 部分路径需要sudo权限
> make install
```

