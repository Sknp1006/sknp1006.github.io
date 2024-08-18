---
title: 【Halcon】用docker打包halcon环境
date: 2021-12-17 12:11:22
tags: [halcon, docker, so]
categories: 
  - 牛排的小教程
---

## 前言

笑死，搞这个halcon环境，从c++编译so库到JNA调用再到打包成镜像已经熬走两位中级JAVA工程师了，到头来还是我跑完了整个流程，简历经验+1（熟练使用docker）

牛排能有什么坏心思，只想多挣钱罢了...

<!-- more -->

## 正文

> 先来回忆一下，之前已经实现了 [halcon导出C++代码并打包成so库给JAVA的JNA调用](https://sknp.top/posts/halcon-cplusplus-to-so) 。但实际项目是需要部署到k8s上的，于是通过 [【Paddle】用docker打包paddle文字识别服务](https://sknp.top/posts/paddle-compose-a-word-recognizer) 简单熟悉了一下通过编写DockerFile构建镜像的过程。

### 构建过程

```dockerfile
FROM ubuntu

# Switch to root user to install additional software
USER 0

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
ENV LD_LIBRARY_PATH=/opt/halcon/lib/x64-linux

ADD ./halcon /opt/halcon
ADD ./sknp /home/sknp

# JAVA环境
ADD ./jdk1.8.0_291  /usr/local/jdk1.8.0_291
ENV JAVA_HOME /usr/local/jdk1.8.0_291
ENV JRE_HOME /usr/local/jdk1.8.0_291/jre
ENV PATH $JAVA_HOME/bin:$JRE_HOME/bin:$PATH
RUN chmod -R 755 /usr/local/jdk1.8.0_291/

RUN apt-get update -q && \
    apt-get install -q -y --no-install-recommends \
        bzip2 \
        ca-certificates \
        git \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
        mercurial \
        openssh-client \
        procps \
        subversion \
        wget \
        gcc \
        g++ \
        clang \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* 

USER 1000
```

apt install中 `gcc`、`g++`、`clang` 是必须的，用于编译cpp代码，其他包的延用之前anaconda环境，具体哪些有用哪些没用就交给读者去辨别啦~

**说明：**

- **ENV** 命令中：LD_LIBRARY_PATH的值是halcon动态库的所在路径；

- **ADD** 命令中：`halcon` 是halcon在x64-linux平台的安装目录，通常是 `/opt/halcon/` ；
- `sknp` 是我用于验证的demo；

很简单吧，以上配置还可以通过删除demo和halcon安装目录中的多余文件，实现进一步精简，最终从17G缩减到1.74G！！！

根本不需要安装halcon运行库！！！

### 踩坑心得

**Chapter 1** 

在虚拟机上运行成功后，便着手移植到docker镜像中，由于运行 `install-linux.sh` 需要手动输入配置，无法直接build，所以想到可以从虚拟机复制整个halcon安装目录（完整版10GB+）

**Chapter 2** 

为了达到精简镜像的目的，决定安装halcon的运行库（166MB），基础镜像采用带vnc的centos7

BUT！centos7自带的g++、gcc还停留在4.8版本，而我编译的cpp使用9.3

于是参考 [CentOS 7.8使用devtoolset-9使用高版本gcc version 9.3.1_Gblfy_Blog-CSDN博客](https://blog.csdn.net/weixin_40816738/article/details/118463896) 进行升级：

```bash
yum install centos-release-scl -y
yum install devtoolset-9 -y

#临时覆盖系统原有的gcc引用
scl enable devtoolset-9 bash

# 查看gcc版本
gcc -v
```

> 虽然顺利升级了，但此时还是无法使用，年轻的牛排还未意识到是halcon运行库缺少某些文件导致的

**Chapter 3** 

在尝试centos7后发现它的gcc、g++贼落后，于是使用ubuntu作为基础镜像，而后修改了 `install-linux.sh` 实现无人值守安装。此时依然提示无法找到要链接的动态库...

**Chapter 4** 

又回到最初的起点，呆呆的坐在电脑前🎵

经过验证，完整版的halcon能用，就是太大了。只好硬着头皮删掉里面的无用文件，真香！

**Chapter 5** 

至此，从C++代码编译so库，再到JNA调用，再到现在的镜像构建，由本 **初级工程师** 攻克完成，最终镜像定格在1.74GB

## 最后

1. 若使用 `install-linux.sh` 安装，需要修改脚本，将其中的 **$myread** （相当于python的input）后的变量赋值（赋值时不能有不必要的空格），达到缺省安装的效果；

2. 若想让LD_LIBRARY_PATH变量生效，需要添加 `ENV LD_LIBRARY_PATH=/opt/halcon/lib/x64-linux` ，而不是在容器中 source；

3. 关于软连接问题，若替换的halcon动态库如与原本的文件名不同，需要重新建立软连接：

   ```bash
   ln -s libhalcon.so.20.11.1 libhalcon.so
   ln -s libhalconcpp.so.20.11.1 libhalconcpp.so
   ```

4. 不需要花里胡哨，只要把halcon完整版的安装目录拷贝到容器的`/opt/` 下，配置LD_LIBRARY_PATH，完事！

### 还有一件事

之前一直搞不懂的JNA接收C++返回字符串的乱码问题，是因为halcon的字符串类的转换问题，可以通过以下代码转换：

```cpp
...
HString str = hv_res.S();
char* pChText = new char[255];
memset(pChText, 0x00, 255);
// str.Text() 得到 const char*类型
sprintf(pChText, "%s", str.Text());  // 格式化字符串
return pChText;
```

好了，先说这么多，吃饭去了拜拜~

