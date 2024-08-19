---
title: 在WSL2上使用docker
date: 2020-09-19 17:00:00
updated: 2020-09-19 17:00:00
tags: [docker, WSL2, linux]
categories: 
  - 牛排的小笔记
---
> 最近有些想法，需要用到docker
> 正好试试Windows10的linux子系统
> But安装过程稍有不同...

> 记录一下~

<!-- more -->
## 搭建docker环境
### 安装WSL2
> [适用于 Linux 的 Windows 子系统安装指南 (Windows 10)](https://docs.microsoft.com/zh-cn/windows/WSL/install-win10#update-to-WSL-2) 

### 安装Docker Desktop
下载链接: [https://www.docker.com/get-started](https://www.docker.com/get-started) 

> 勾选 `setting` -> `General` -> `Use the wsl 2 based engine`
> 默认开启 `Switch to Linux Containers`

### 解决方案
- [Docker 教程 | 菜鸟教程](https://www.runoob.com/docker/docker-tutorial.html) 
- 镜像加速(不同版本的Docker daemon位置略有不同) 
  - `Docker Engine` -> 添加 `http://f1361db2.m.daocloud.io` 到 `registry-mirrors`
  - 其他系统配置: [配置Docker镜像站](https://www.daocloud.io/mirror#accelerator-doc) 

### by the way
- 此时linux与windows10 **共用** Docker-Desktop
- linux下的 `var/lib/docker` 变更为 `var/lib/docker-desktop` 且为空
- 镜像保存在 `C:\ProgramData\DockerDesktop\vm-data\DockerDesktop.vhdx` 
- `Version: 2.3.7.0(48173) Channel: edge` 版本可以更方便的管理Images
- 安装WSL2之后跟你的手游模拟器还有VM说再见吧😁

---

