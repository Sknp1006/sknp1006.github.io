---
title: 【FFMPEG】使用 ffmpeg 推 RTSP 流
date: 2024-08-15 14:12:30
tags: [ffmpeg,rtsp,mediamtx,macbook pro,m2]
categories: 
  - 牛排的小笔记
---

## 前言

在现代多媒体应用中，实时流媒体传输（RTSP）是一项重要技术。它允许我们将音视频内容实时传输到远程服务器，从而实现实时观看和监控。FFmpeg 是一个强大的多媒体处理工具，支持多种音视频格式和流媒体协议。

本文将介绍如何在 macOS 上使用 FFmpeg 推送 RTSP 流。我们将涵盖以下内容：
1. 在 macOS 上安装和配置 FFmpeg。
2. 搭建 RTSP 服务。
3. 使用 FFmpeg 将本地视频文件推送到 RTSP 服务。
4. 使用 FFmpeg 将摄像头视频推送到 RTSP 服务。

通过本文的学习，您将掌握在 macOS 上使用 FFmpeg 进行 RTSP 推流的基本方法和技巧。

<!-- more -->

## 正文

### 安装和配置 FFmpeg

1. 首先，我们需要在 macOS 上安装 FFmpeg。您可以通过 Homebrew 包管理器来安装 FFmpeg。如果您尚未安装 Homebrew，请按照以下步骤进行安装：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. 安装完成后，您可以使用以下命令来安装 FFmpeg：

```bash
brew install ffmpeg
```

3. 安装完成后，您可以使用以下命令来验证 FFmpeg 是否安装成功：

```bash
ffmpeg -version
```

### 搭建 RTSP 服务

接下来，我们需要搭建一个 RTSP 服务，以便将音视频流推送到远程服务器。我们可以使用 [MediaMtx](https://mediamtx.com/) 来搭建 RTSP 服务。MediaMtx 是一个开源的流媒体服务器，支持 RTSP、RTMP、HLS 等多种流媒体协议。

推荐使用 docker 来运行 MediaMtx 服务端程序。`--network=host` 标志是强制性的，因为 Docker 可以出于路由原因更改 UDP 数据包的源端口，这不允许 RTSP 服务器识别数据包的发送者。可以通过禁用 UDP 传输协议来避免此问题：

```bash
docker run -d \
--restart=on-failure \
-e MTX_PROTOCOLS=tcp \
-e MTX_WEBRTCADDITIONALHOSTS=192.168.x.x \
-p 8554:8554 \
-p 1935:1935 \
-p 8888:8888 \
-p 8889:8889 \
-p 8890:8890/udp \
-p 8189:8189/udp \
bluenviron/mediamtx
```

将 `MTX_WEBRTCADDITIONALHOSTS` 设置为您的本地 IP 地址。

端口介绍：
- 8554：RTSP 端口。
- 1935：RTMP 端口。
- 8888：HTTP 端口。
- 8889：HTTPS 端口。

### 使用 FFmpeg 推送 RTSP 流

#### 推视频文件

```bash
ffmpeg -re -stream_loop -1 -i "path/to/your/file" -f rtsp -rtsp_transport tcp -c copy rtsp://your_rtsp_server_address:port/app/stream
```

参数介绍：
- `-re`：以实时速率播放输入文件。
- `-stream_loop -1`：无限循环播放输入文件。
- `-i "path/to/your/file"`：指定输入文件的路径。
- `-f rtsp`：指定输出格式为 RTSP。
- `-rtsp_transport tcp`：指定 RTSP 传输协议为 TCP。
- `-c copy`：使用拷贝编解码器。
- `rtsp://your_rtsp_server_address:port/app/stream`：指定 RTSP 服务的地址和端口。

#### 推摄像头

在 macOS 上查看视频音频设备

```bash
ffmpeg -f avfoundation -list_devices true -i ""
```

将摄像头推流到 rtsp 服务

```bash
ffmpeg -f avfoundation -framerate 30 -video_size 1280x720 -i "0" -vcodec libx264 -preset veryfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -f rtsp rtsp://your_rtsp_server_address:port/app/stream
```

参数介绍：
- `-f avfoundation`：指定输入设备为 avfoundation。
- `-framerate 30`：指定帧率为 30。
- `-video_size 1280x720`：指定视频尺寸为 1280x720。
- `-i "0"`：指定输入设备的索引。
- `-vcodec libx264`：指定视频编解码器为 libx264。
- `-preset veryfast`：指定编码速度为 veryfast。
- `-maxrate 3000k`：指定最大码率为 3000k。
- `-bufsize 6000k`：指定缓冲区大小为 6000k。
- `-pix_fmt yuv420p`：指定像素格式为 yuv420p。
- `-g 50`：指定关键帧间隔为 50。
- `-f rtsp`：指定输出格式为 RTSP。
- `rtsp://your_rtsp_server_address:port/app/stream`：指定 RTSP 服务的地址和端口。

#### 推RTSP视频流

```bash
ffmpeg -i rtsp://your_rtsp_server_address:port/app/stream -f rtsp -rtsp_transport tcp -c copy rtsp://your_rtsp_server_address:port/app/stream
```

#### ⚠️注意事项

推送 RTSP 视频流时，推送和访问的端口都是 8554。

## 最后

恭喜你！现在你已经掌握了在 macOS 上使用 FFmpeg 推送 RTSP 流的基本技能。无论是推送本地视频文件还是实时摄像头视频，你都可以轻松应对。希望这些技巧能为你的多媒体项目增添一份助力。记住，流媒体的世界充满了无限可能，继续探索吧！

祝你推流愉快，码上成功！