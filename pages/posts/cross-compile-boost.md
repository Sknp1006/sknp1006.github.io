---
title: 【交叉编译】boost
date: 2024-02-02 16:22:33 +8
updated: 2024-02-02 16:22:33 +8
tags: [cross compile, aarch64, boost]
categories: 
  - 牛排的小教程
---

## 获取源码

1. 官方网站
   - [Boost C++ Libraries](https://www.boost.org/) 
2. 代码仓库
   - [boostorg/boost: Super-project for modularized Boost (github.com)](https://github.com/boostorg/boost) 

## 编译过程

1. 生成project-config.jam

```bash
> ./bootstrap.sh
```

2. 修改project-config.jam（位于第10行附近）

```
if ! gcc in [ feature.values <toolset> ]
{
   using gcc : : /usr/bin/aarch64-linux-gnu-gcc ;
}
```

3. 执行编译

```bash
> ./b2
```

4. 安装

```bash
# 部分路径需要sudo权限
> ./b2 install --prefix=/opt/boost
```

```bash
# 查看支持的子模块
> ./bootstrap.sh --show-libraries
The Boost libraries requiring separate building and installation are:
    - atomic
    - chrono
    - cobalt
    - container
    - context
    - contract
    - coroutine
    - date_time
    - exception
    - fiber
    - filesystem
    - graph
    - graph_parallel
    - headers
    - iostreams
    - json
    - locale
    - log
    - math
    - mpi
    - nowide
    - program_options
    - python
    - random
    - regex
    - serialization
    - stacktrace
    - system
    - test
    - thread
    - timer
    - type_erasure
    - url
    - wave
```

## 其他参考

### Cross-compilation 交叉编译

> 参考链接：[交叉编译 --- Cross-compilation (boost.org)](https://www.boost.org/build/doc/html/bbv2/tasks/crosscompile.html) 

Boost.Build supports cross compilation with the gcc and msvc toolsets.
Boost.Build 支持与 gcc 和 msvc 工具集进行交叉编译。

When using gcc, you first need to specify your cross compiler in `user-config.jam` (see [the section called “Configuration”](https://www.boost.org/build/doc/html/bbv2/overview/configuration.html)), for example:
使用 gcc 时，首先需要在 `user-config.jam` （参见 “配置 ”部分） 中指定交叉编译器，例如：

```
using gcc : arm : arm-none-linux-gnueabi-g++ ;
```

After that, if the host and target os are the same, for example Linux, you can just request that this compiler version to be used:
之后，如果主机和目标操作系统相同，例如 Linux，则只需请求使用此编译器版本即可：

```
b2 toolset=gcc-arm
```

If you want to target different operating system from the host, you need to additionally specify the value for the `target-os` feature, for example:
如果要面向与主机不同的操作系统，则需要另外指定 `target-os` 该功能的值，例如：

```
# On windows box
b2 toolset=gcc-arm target-os=linux
# On Linux box
b2 toolset=gcc-mingw target-os=windows
```

For the complete list of allowed opeating system names, please see the documentation for [target-os feature](https://www.boost.org/build/doc/html/bbv2/overview/builtins/features.html#bbv2.reference.features.target-os).
有关允许的操作系统名称的完整列表，请参阅 target-os 功能的文档。

When using the msvc compiler, it's only possible to cross-compiler to a 64-bit system on a 32-bit host. Please see [the section called “64-bit support”](https://www.boost.org/build/doc/html/bbv2/reference/tools.html#v2.reference.tools.compiler.msvc.64) for details.
使用 msvc 编译器时，只能交叉编译到 32 位主机上的 64 位系统。有关详细信息，请参阅“64 位支持”部分。