---
title: 【玩转群晖】FRP内网穿透
date: 2021-08-15 23:30:30
tags: [群晖, Synology, 内网穿透, frp, 轻量应用服务器]
categories: 
  - 牛排的小教程
---

## 前言

从去年6月开始建博客至今已经400多天了，期间开始接触云服务器，老实说一开始挺新鲜的。因为上一份工作与数据相关，便想拥有一台自己的服务器，不管是运行爬虫还是部署网站，都是蛮酷的感觉。前段时间又搭了一个明日方舟主题wordpress的博客，虽然自娱自乐的成分居多...

在使用云服务器期间，确实体验不错，基本需求都能满足，奈何对数码产品的欲望驱使我购入了人生中的第一台NAS——Synology DS920+；

辣鸡广电大概率是没有公网IP（咱也不敢说，咱也不敢问），所以一直在用群晖的QuickConnect连接。能用但不好用，于是开始折腾内网穿透...

<!-- more -->

## 正文

> 采用frp的好处是免费，前提是你有云服务器，另外如果想获取良好的体验，带宽是首要考量；
>
> 未来打算等云服务器到期，就采用【轻量应用+NAS】替代现在的方案；
>
> 其实frpc的教程在网上大把，但是初学者估计和我一样，不知其中的参数代表什么意思。还有网络上的教程大部分是第三方的frp服务，很少有frps的搭建教程，后文将一一道来；

主机配置如下，存储是从咸鱼淘来的酷狼4Tx4，这价格我承认有赌的成分，实际上是我多虑了。另外配了山特TG-BOX 600 UPS，就图它能在NAS的管理界面出现便买了，断电后大概能提供15分钟续航，期间NAS会自动做好断电前准备，省力又省心；

![](https://bucket.sknp.top/2023/07/eea9eefc7f33ea418239826775658be6.png)

![image-20210815205706534](https://bucket.sknp.top/2023/07/d87501e07b83a6079d174edccfa2505c.png)

言归正传，开始内网穿透教程；

### 搭建frpc

> frpc又称frp-client，指的是需要映射到公网的一方，也就是这里的NAS设备；
>
> 这里采用docker部署；

#### docker部署过程：

1. 在群晖的套件中心中安装 `Docker` 套件；
2. 在注册表中找到 `stilleshan/frpc` 映像，点击下载；

![image-20210815211113125](https://bucket.sknp.top/2023/07/1522a97d93b3e361e2edeecbcc4e681f.png)

3. 在映像中启动刚下载的映像，设置 `使用高权限执行容器`；

![image-20210815211504205](https://bucket.sknp.top/2023/07/176c733816a05a5d54031f7c91de6d58.png)

4.点击 `高级设置` --> `存储空间` --> 点击 `添加文件` ，填写路径信息，ini文件是frpc的配置文件，需要手动创建;

![image-20210815212045334](https://bucket.sknp.top/2023/07/dea3c40ab5684c3e765b36982b451438.png)

5. 设置 `网络` --> 勾选 `使用与Docker Host相同的网络` --> 点击 `应用`；
6. 点击 `下一步` --> 点击 `完成` ，此时的docker会无法运行，需要配置ini文件；

![image-20210815212623227](https://bucket.sknp.top/2023/07/3c009f804ea863e8e4efefcb3a0b64cf.png)

#### ini文件示例

> 注意：代码中的注释部分需要清除

```ini
[common]                            # common,告诉frpc你的server是谁
server_addr = xxx.xxx.x.xx          # frps的IP地址
server_port = xxxx                  # frps的端口
token = xxxx.xxx                    # token，自定义字符串，frps与frpc的定情信物

[web1]                              # 唯一的名称，可自定义
type = http                         # 通信协议
local_ip = 192.168.31.237           # 本地IP地址
local_port = 5000                   # nas的管理端口，5000默认是http协议
custom_domains = nas.xxx.xxx        # 子域名

[web2]                              
type = https                     
local_ip = 192.168.31.237
local_port = 5001                   # nas的管理端口，5001默认是https协议
custom_domains = nas.xxx.xxx

# 下面是我的其他服务，新手只需要注意上面的配置即可

[chevereto-http]                           
type = http                  
local_ip = 192.168.31.237
local_port = 6000
custom_domains = images.xxx.xxx

[chevereto-https]                           
type = https                    
local_ip = 192.168.31.237
local_port = 6001
custom_domains = images.xxx.xxx

[phpMyAdmin]                       # 对于套件，访问方法是: nas.xxx.xxx/phpMyAdmin
type = http                        
local_ip = 192.168.31.237
local_port = 80
custom_domains = nas.xxx.xxx
```

OK，到这frpc的搭建基本完成，下面开始frps的搭建；

### 搭建frps

> 这里建议使用安装宝塔面板的云服务器，省事！
>
> 前段时间体验过的轻量应用就不错，如果只是代理其实并不需要多高的性能；

#### 一键部署

这里不采用docker，只是因为找到了更方便的部署方式：

1. 下载 [MvsCode/frps-onekey: Frps 一键安装脚本&管理脚本](https://github.com/MvsCode/frps-onekey) 

2. 运行代码，由于我用的香港地区的服务器，源选择Github；

```bash
wget https://raw.githubusercontent.com/MvsCode/frps-onekey/master/install-frps.sh -O ./install-frps.sh
chmod 700 ./install-frps.sh
./install-frps.sh install
```

3. 设置也是非常的简单，除了被系统占用的 `port` 与需要自定义的 `token` 其余的默认即可，成功运行如下所示；

![image-20210815222829534](https://bucket.sknp.top/2023/07/e231510a17a373656e7505dc256aab3c.png)

### frpc与frps的通信

> 看完frps的搭建，应该能明白frpc的ini文件的commen字段的意义了；

1、在面板 `安全` 里放行端口；

![image-20210815230328182](https://bucket.sknp.top/2023/07/84cca62f1fed8d6e84739af027bc49ac.png)

2、为你的frps配置DNS解析；

![image-20210815223603596](https://bucket.sknp.top/2023/07/9a74461400975d1923fdb5bcbc94feb2.png)

3、在面板里新建站点，域名为上面解析的二级域名；

![image-20210815225217732](https://bucket.sknp.top/2023/07/e2cc4fdc0ac01647ae0a2598ad131c2f.png)

4. 添加反向代理，目标URL = [IP]: [vhost port]，目前使用http协议，也可以根据需要更换，貌似SSL证书不太好搞；

   ![image-20210815225358564](https://bucket.sknp.top/2023/07/4635aa37756189c78a3d69f1fc935240.png)

5. 使用你的二级域名访问NAS吧~



## 最后

问题：

1. phpMyAdmin默认是80,443端口，如果设置了它，会导致二级域名解析不到nas的5000, 5001端口。若想访问phpMyAdmin则是： `nas.xxx.xxx/phpMyAdmin` ；解决办法可能需要新的二级域名？感觉不太行，在想到之前先不用phpMyAdmin；

最后的最后：

考虑再三，果然写图文会容易懂些，只是后续的图床迁移会变得很麻烦😥

后续会将图床也搭在NAS上，敬请期待~

