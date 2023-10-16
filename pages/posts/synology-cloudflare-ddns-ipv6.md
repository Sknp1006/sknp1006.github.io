---
title: 【玩转群晖】使用Cloudflare实现加速ipv6
date: 2023-05-19 16:22:33 +8
updated: 2023-05-19 16:22:33 +8
tags: [Cloudflare, ipv4, ipv6, ddns]
categories: 
  - 牛排的小教程
---

## 前言

咕咕咕，好久没写博客了，这次带来的是【玩转群晖】系列之在纯ipv4网络下访问纯ipv6网站；

前情提要：
> 随着个人越来越难获取公网ipv4地址，ipv6的普及也越来越迫切，但是ipv6的普及并不是一朝一夕的事情；

当我们在纯ipv4网络访问纯ipv6网站的时候，就会遇到一些问题...

<!-- more -->

## 正文

当前痛点：
> 当我在外地访问群晖上的媒体服务器时，如果采用内网穿透的方式，受到中转服务器带宽限制，导致无法播放高清视频；

> 若使用ipv6部署，又会遇到纯ipv4网络无法访问纯ipv6网站的问题；

### 基本思路

解决什么问题：纯ipv4访问纯ipv6网站！

如何解决：网上有很多类似的教程，大概有以下三点：

```txt
1. 使用4to6隧道；
2. 内网穿透，通过服务器中转；
3. 使用VPN服务器；
4. 使用Cloudflare的CDN加速；
```

前三点都是需要额外的硬件支持，本着白嫖的原则，我选择了第四种方法。

### 准备工作

- [x] 一个Cloudflare的账号，如果没有的话，可以去注册一个，注册地址：[https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) 
- [x] 一个域名，如果没有的话，可以去购买一个，我的域名购买自[Dnspod](https://buy.cloud.tencent.com/domain) 
- [x] 一台群晖？这个就不用多说了吧，如果没有的话，可以去购买一台，这里我使用的是DS920+；
- [x] 一个公网ipv6地址，这个是关键，如果没有的话，快去找你的宽带运营商要，如果能要到ipv4自然是更好的；
- [x] 群晖能获取ipv6的公网地址；
- [x] 有一定的网络基础以理解我不明不白的表述；

也许你会需要jellyfin的部署教程，这里先挖个坑😊

### 开始配置
> 根据之前的文章，想必你已经清楚如何获取ipv6的公网地址了，这里就不再赘述了；
> 
> Cloudflare的CDN加速，其实就是将你的域名解析到Cloudflare的服务器上，然后Cloudflare再将你的域名解析到你的服务器上，这样就可以实现通过域名访问你的服务器了；

CloudFlare支持回源的端口有限，所以需要加速的网站或服务要使用特定的端口，Cloudflare支持的回源端口：

```txt
HTTP:
        80
        8080
        8880
        2052
        2082
        2086
        2095
HTTPS:
        443
        2053
        2083
        2087
        2096
        8443
```

#### Cloudflare配置
1. 登陆Cloudflare控制台，在 **文本框** 中输入你的站点，选择 **Free套餐** ：

<img src="https://bucket.sknp.top/2023/07/3eefde78e62ba9bb0b5c4918bacc27ea.png" alt="uTools_1685801712402" style="zoom: 67%;" />

2. 替换为Cloudflare的名称服务器

<img src="https://bucket.sknp.top/2023/07/5c6b7163b85c7ffce23323f595685941.png" alt="uTools_1685802189856" style="zoom: 67%;" />

对于注册在腾讯云的域名，可以登陆 **腾讯云控制台** -> **域名注册** -> **我的域名** ：

<img src="https://bucket.sknp.top/2023/07/97718cc146c6a234ba7688b205491726.png" alt="image-20230603222704899" style="zoom: 67%;" />

3. 修改成功后等待名称服务器更新，通常不需要24小时；
4. 创建用于DDNS的 **API令牌** ，https://dash.cloudflare.com/profile/api-tokens 

<img src="https://bucket.sknp.top/2023/07/337986d9baf9f3f987ff16a6e5c908df.png" alt="uTools_1685803212046" style="zoom: 67%;" />

<img src="https://bucket.sknp.top/2023/07/fd54bdf02db7ad221ef81a9c96406e69.png" alt="uTools_1685803292588" style="zoom: 67%;" />

<img src="https://bucket.sknp.top/2023/07/1489cc0c008223f225feedd99a409544.png" alt="uTools_1685803409238" style="zoom: 67%;" />

⚠️ **注意：令牌只显示一次，请注意保存** ⚠️ 

<img src="https://bucket.sknp.top/2023/07/0ad08427272f04f333c07296994e2736.png" alt="uTools_1685803483318" style="zoom: 67%;" />

#### 群晖iPV6-DDNS

> 这次使用docker部署ddns程序，映像名：`oznu/cloudflare-ddns` 

1. 网络：与Docker Host相同的网络；
2. 环境变量设置如下：

<img src="https://bucket.sknp.top/2023/07/662b169e260282375ef0f52460c7e86c.png" alt="uTools_1685804068238" style="zoom: 67%;" />

3. 接下来启动容器就可以啦～

### 最后

> 我部署的是Jellyfin，它是一个自由、开源的媒体中心软件，可以让你管理和播放你的音频、视频和图片等媒体文件。它类似于Plex和Emby，但是没有任何专有组件或后台服务。你可以在自己的设备上安装Jellyfin服务器，然后使用任何支持Jellyfin的设备进行访问和播放。

虽然访问速度不如直连的ipv6，但是在ipv4网络下也能访问私人视频服务啦，是在是 泰 裤 辣！！！
