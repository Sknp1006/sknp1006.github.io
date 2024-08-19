---
title: 【玩转群晖】为frp添加https
date: 2021-08-21 16:30:30
updated: 2021-08-23 11:18:00
tags: [群晖, Synology, 内网穿透, frp, https]
categories: 
  - 牛排的小教程
---

## 前言

书接上回，成功搭建frp实现了用域名访问家里的NAS。美中不足的是，浏览器地址栏的 **不安全** 相当的碍眼。上https刻不容缓，研究了几天不知所以然，可就在刚刚...

<!-- more -->

## 正文

> 不知道是什么原理，但是会介绍详细的配置

### 添加证书

既然要https，那么是需要证书的，我的域名在腾讯云，所以：

1. 打开 [DNSPod](https://console.dnspod.cn/dns/list) 添加二级域名并解析到frps所在服务器；
2. 点击DNS记录的 **【SSL】** 按钮，申请左边的免费证书；
3. 通常30分钟内就能下发，耐心等待片刻...
4. 进入SSL详情，点击 **下载证书** ，会得到一个压缩包；
5. 在宝塔站点添加刚才的二级域名和证书...其实很简单的，这里就是凑凑字数而已（

### frps设置

之前都是在服务端添加反向代理，但是尝试了很久，总是提示重定向次数过多。所以干脆把Nginx停掉以空出80和443端口。这个方法适合服务器没有其他网站运行的情况。frps.ini如下：

```ini
[common]
bind_port = 7000

token = xxx
subdomain_host = xxxx.xxx

vhost_http_port = 80
vhost_https_port = 443

dashboard_addr = 0.0.0.0
dashboard_port = 7500

# dashboard user and passwd for basic auth protect
dashboard_user = xxxx
dashboard_pwd = xxxx
```

参数介绍：

- bind_port：frps服务的端口，用来与frpc建立连接；
- token：相当于frps与frpc之间约定的密码；
- subdomain_host：二级域名对应的一级域名（准确的说，服务商卖给我们的已经是二级域名了，懂得都懂；
- vhost_http_port：http默认请求端口，省去了重定向（反向代理）的麻烦；
- vhost_https_port：https默认请求的端口，省去了反向代理的麻烦；
- ...

### frpc设置

连接frps的参数就不废话了，

```ini
[DSM-https]
type = https
local_ip = 127.0.0.1
local_port = 5001
subdomain = dsm

[NAS]
type = https
local_ip = 127.0.0.1
local_port = 443
subdomain = nas

[Images]
type = https
local_ip = 127.0.0.1
local_port = 6001
subdomain = images
```

参数介绍：

1. type：连接方式，有http、https、tcp、udp等
2. local_ip：本机或者本地网络其他设备的IP；
3. local_port：服务的开放端口，dsm默认的https端口是5001；
4. subdomain：二级域名；

### 群晖设置

除了服务端要添加证书外，群晖这边也需要添加证书：

1. 在 **控制面板** --> **安全性** --> **证书** ；
2. 点击 **新增** --> **添加新证书** -> **导入证书** ;
3. 添加私钥和证书即可，这两个文件在证书压缩包的Nginx下（实际看你部署的服务种类
4. 点击 **设置** ，将套件或服务与证书对应，Done！

> 也许还要清理浏览器的缓存~

## 最后

很奇怪，在登陆DSM有时候会提示 **所输入之账号或密码错误** ，查看日志后发现 `User [sknp] from [127.0.0.1] failed to sign in to [DSM] via [password] due to authorization failure.` 总之就是很奇怪，如果找到解决办法了再更新~~~

### 更新日志

尼玛的，换chrome登录就正常了，辣鸡Edge `User [sknp] from [127.0.0.1] signed in to [DSM] successfully via [password].` ——2021/8/21 17:41
反转了，🤡竟是我自己，不过归根结底是edge给我提示的密码是错的 ——2021/8/23 11:18

