---
title: 【交叉编译】opencv4
date: 2024-01-31 16:22:33 +8
updated: 2024-01-31 16:22:33 +8
tags: [cross compile, cmake, aarch64, opencv]
categories: 
  - 牛排的小教程
---

## 获取源码

1. 代码仓库
   - [opencv/opencv: Open Source Computer Vision Library (github.com)](https://github.com/opencv/opencv) 
   - [opencv/opencv_contrib: Repository for OpenCV's extra modules (github.com)](https://github.com/opencv/opencv_contrib) 

## 编译过程

1. 编译脚本

- 默认参数且不带contrib模块

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
-DCMAKE_INSTALL_PREFIX=/opt/opencv \
-DCMAKE_BUILD_TYPE=Release \
-DCMAKE_C_COMPILER=/usr/bin/aarch64-linux-gnu-gcc \
-DCMAKE_CXX_COMPILER=/usr/bin/aarch64-linux-gnu-g++ \
-DCMAKE_SYSTEM_NAME=Linux \
-DCMAKE_SYSTEM_PROCESSOR=aarch64

make -j8

```

- 带opencv_contrib的情况

```bash
# 拉取opencv_contrib源码
> cd <opencv_path>
> git clone https://github.com/opencv/opencv_contrib.git


# 根据实际情况修改编译脚本
# 启用opencv_contrib模块
-DOPENCV_EXTRA_MODULES_PATH=${ROOT_PWD}/opencv_contrib/modules

# 启用nonefree模块
-DOPENCV_ENABLE_NONFREE=ON
```

2. 执行编译

```bash
> chmod +x build.sh
> ./build.sh

> cd ./build/build_linux_aarch64
# 部分路径需要sudo权限
> make install
```

