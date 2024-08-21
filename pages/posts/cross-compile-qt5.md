---
title: 【交叉编译】qt5
date: 2024-01-31 16:22:33 +8
updated: 2024-01-31 16:22:33 +8
tags: [cross compile, aarch64, qt5]
categories: 
  - 牛排的小笔记
---

## 获取源码

1. 官方网站
   - [Qt | Tools for Each Stage of Software Development Lifecycle](https://www.qt.io/) 
2. 代码下载地址
   - [Index of /archive/qt/5.12/5.12.2/single](https://download.qt.io/archive/qt/5.12/5.12.2/single/) 

## 编译过程

> qt作为比较大的第三方库，其包含了许多子模块，在编译过程按照自己的需求取舍

1. 编译脚本

> **说明** ：`-xplatform` 的值应当与 `<qt5_path>/qtbase/mkspecs` 中的文件夹名称相同

```sh
#!/bin/bash

../configure \
-prefix /opt/qt5.15.2 \
-opensource \
-confirm-license \
-release \
-xplatform linux-aarch64-gnu-g++ \
-make libs \
-nomake examples \
-nomake tools \
-nomake tests \
-no-openssl \
-no-opengl \
-skip qtserialport \
-skip qtsvg \
-skip qtlocation

```

- 编译脚本应创建在build文件夹中

```bash
# 新建build文件夹
> mkdir build
> cd build

# 创建编译脚本
> touch build.sh
> vim build.sh
```

2. 编辑交叉编译conf文件

> **注意** ：当使用非apt安装的第三方交叉编译工具 或者 你知道自己在干嘛的时候才需要编辑

```bash
# 在linux-aarch64-gnu-g++的基础上修改
> cd <qt5_path>/qtbase/mkspecs/linux-aarch64-gnu-g++
```

- 修改qmake.conf的编译器信息：

> 具体路径以实际情况为准，这里仅供参考

```
#
# qmake configuration for building with aarch64-linux-gnu-g++
#

MAKEFILE_GENERATOR      = UNIX
CONFIG                 += incremental
QMAKE_INCREMENTAL_STYLE = sublib

include(../common/linux.conf)
include(../common/gcc-base-unix.conf)
include(../common/g++-unix.conf)

# modifications to g++.conf
QMAKE_CC                = /opt/gcc-buildroot-9.3.0-2020.03-x86_64_aarch64-rockchip-linux-gnu/bin/aarch64-linux-gcc
QMAKE_CXX               = /opt/gcc-buildroot-9.3.0-2020.03-x86_64_aarch64-rockchip-linux-gnu/bin/aarch64-linux-g++
QMAKE_LINK              = /opt/gcc-buildroot-9.3.0-2020.03-x86_64_aarch64-rockchip-linux-gnu/bin/aarch64-linux-g++
QMAKE_LINK_SHLIB        = /opt/gcc-buildroot-9.3.0-2020.03-x86_64_aarch64-rockchip-linux-gnu/bin/aarch64-linux-g++

# modifications to linux.conf
QMAKE_AR                = /opt/gcc-buildroot-9.3.0-2020.03-x86_64_aarch64-rockchip-linux-gnu/bin/aarch64-linux-ar cqs
QMAKE_OBJCOPY           = /opt/gcc-buildroot-9.3.0-2020.03-x86_64_aarch64-rockchip-linux-gnu/bin/aarch64-linux-objcopy
QMAKE_NM                = /opt/gcc-buildroot-9.3.0-2020.03-x86_64_aarch64-rockchip-linux-gnu/bin/aarch64-linux-nm -P
QMAKE_STRIP             = /opt/gcc-buildroot-9.3.0-2020.03-x86_64_aarch64-rockchip-linux-gnu/bin/aarch64-linux-strip
load(qt_config)

```

> **说明** ：应用此配置时 `-xplatform` 的值为 `linux-aarch64-gnu-g++` 

3. 执行编译

```bash
> cd <qt5_path>/build
> chmod +x build.sh

> ./build.sh

> make -j8
# 部分路径需要sudo权限
> sudo make install
```

