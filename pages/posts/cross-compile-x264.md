---
title: 【交叉编译】x264
date: 2024-01-31 16:22:33 +8
updated: 2024-01-31 16:22:33 +8
tags: [cross compile, cmake, aarch64, x264]
categories: 
  - 牛排的小笔记
---

## 获取源码

1. 仓库地址
   - [VideoLAN / x264 · GitLab](https://code.videolan.org/videolan/x264) 

## 编译过程

1. 执行编译

```bash
> ./configure \
--prefix=/opt/x264 \
--enable-shared \
--enable-static \
--host=aarch64-linux \
--cross-prefix=aarch64-linux-gnu- \
--disable-opencl \
--enable-pic \
--disable-asm

> make -j8
# 部分路径需要sudo权限
> make install
```

