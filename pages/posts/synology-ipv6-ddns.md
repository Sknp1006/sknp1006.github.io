---
title: 【玩转群晖】为nas配置ipv6动态解析
date: 2022-02-09 15:02:33
updated: 2022-02-09 15:02:33
tags: [群晖, Synology, ipv6, ddns]
categories: 
  - 牛排的小教程
---

## 前言

在我换了宽带的第二天，广电推出了加价换1000M宽带的活动，总的来算比我现在的联通宽带划算
但是错过了就是错过了，已无法挽回...

<!-- more -->

## 正文

> 联通宽带虽然没有提供ipv4的公网ip，但是人家有ipv6的啊！

**P.S. 本教程使用DnsPod.cn解析，请注意自己的DNS服务商** 

操作步骤：

1. 拥有一个域名；
2. 新增二级域名，添加AAAA记录（随意，反正会被覆盖）；
3. 在【DNSPod】-【我的账号】-【API密钥】中新增 `DNSPod Token` ，注意保存！
4. 将以下脚本保存在nas上，如路径： `/volume1/docker/debug/ddns.sh` ；

```shell
#!/usr/bin/bash
dnspod_ddnsipv6_id="" #【API_id】将引号内容修改为获取的API的ID
dnspod_ddnsipv6_token="" #【API_token】将引号内容修改为获取的API的token
dnspod_ddnsipv6_ttl="600" # 【ttl时间】解析记录在 DNS 服务器缓存的生存时间，默认600(s/秒)
dnspod_ddnsipv6_domain='' #【已注册域名】引号里改成自己注册的域名
dnspod_ddnsipv6_subdomain='' #【二级域名】将引号内容修改为自己想要的名字
get_ipv6_mode='1' # 【获取IPV6方式】支持两种方式，第一种是直接从你的网卡获取，用这种方法请填1。一种是通过访问网页接口获取公网IP6，这种方法请填2
local_net="ovs_eth0" # 【网络适配器】 默认为eth0，如果你的公网ipv6地址不在eth0上，需要修改为对应的网络适配器
if [ "$dnspod_ddnsipv6_record" = "@" ]
then
  dnspod_ddnsipv6_name=$dnspod_ddnsipv6_domain
else
  dnspod_ddnsipv6_name=$dnspod_ddnsipv6_subdomain.$dnspod_ddnsipv6_domain
fi

die0 () {
    echo "IPv6地址提取错误,无ipv6地址或非公网IP（fe80开头的非公网IP）"
	exit
}

die1 () {  
	echo "IPv6地址提取错误,请使用ip addr命令查看自己的网卡中是否有IPv6公网（非fe80开头）地址，若网卡有IPv6地址却无法获取成功，可尝试在脚本中切换第二种模式获取"
    exit
}

die2 () {
    echo "尝试访问网页http://[2606:4700:4700::1111]/cdn-cgi/trace  查看返回的IPv6地址是否能够正常访问本机，无法访问网页则切换第一种模式获取"
	exit
}

if [[ "$get_ipv6_mode" == 1 ]]
    then
        echo "使用本地网卡获取IPv6"
		ipv6_list=`ip addr show $local_net | grep "inet6.*global" | awk '{print $2}' | awk -F"/" '{print $1}'` || die1
    else
        echo "使用网页接口获取IPv6"
		ipv6_list=$(curl -s -g http://[2606:4700:4700::1111]/cdn-cgi/trace | sed -n '3p' ) || die
        ipv6_list=${ipv6_list##*=}     
    fi






for ipv6 in ${ipv6_list[@]}
do
    if [[ "$ipv6" =~ ^fe80.* ]]
    then
        continue
    else
        echo 获取的IP为: $ipv6 >&1
        break
    fi
done

if [ "$ipv6" == "" ] || [[ "$ipv6" =~ ^fe80.* ]]
then
    die0
fi

dns_server_info=`nslookup -query=AAAA $dnspod_ddnsipv6_name 2>&1`

dns_server_ipv6=`echo "$dns_server_info" | grep 'address ' | awk '{print $NF}'`
if [ "$dns_server_ipv6" = "" ]
then
    dns_server_ipv6=`echo "$dns_server_info" | grep 'Address: ' | awk '{print $NF}'`
fi
    
if [ "$?" -eq "0" ]
then
    echo "你的DNS服务器IP: $dns_server_ipv6" >&1

    if [ "$ipv6" = "$dns_server_ipv6" ]
    then
        echo "该地址与DNS服务器相同。" >&1
    fi
    unset dnspod_ddnsipv6_record_id
else
    dnspod_ddnsipv6_record_id="1"   
fi

send_request() {
    local type="$1"
    local data="login_token=$dnspod_ddnsipv6_id,$dnspod_ddnsipv6_token&domain=$dnspod_ddnsipv6_domain&sub_domain=$dnspod_ddnsipv6_subdomain$2"
    return_info=`curl -X POST "https://dnsapi.cn/$type" -d "$data" 2> /dev/null`
}

query_recordid() {
    send_request "Record.List" ""
}

update_record() {
    send_request "Record.Modify" "&record_type=AAAA&record_line=默认&ttl=$dnspod_ddnsipv6_ttl&value=$ipv6&record_id=$dnspod_ddnsipv6_record_id"
}

add_record() {
    send_request "Record.Create" "&record_type=AAAA&record_line=默认&ttl=$dnspod_ddnsipv6_ttl&value=$ipv6"
}

if [ "$dnspod_ddnsipv6_record_id" = "" ]
then
    echo "解析记录已存在，尝试更新它" >&1
    query_recordid
    code=`echo $return_info  | awk -F \"code\":\" '{print $2}' | awk -F \",\"message\" '{print $1}'`
    echo "返回代码： $code" >&1
    if [ "$code" = "1" ]
    then
        dnspod_ddnsipv6_record_id=`echo $return_info | awk -F \"records\":.{\"id\":\" '{print $2}' | awk -F \",\"ttl\" '{print $1}'`
        update_record
        echo "更新解析成功" >&1
    else
        echo "错误代码返回，域名不存在，请尝试添加。" >&1
        add_record
        echo "添加成功" >&1
    fi
else
    echo "该域名不存在，请在dnspod控制台添加"
    add_record
    echo "添加成功" >&1
fi
```

5. 在nas的【任务计划】中新建任务，运行命令填写：`bash /volume1/docker/debug/ddns.sh` ；
6. 根据ipv6的变动频率，设置任务计划的运行频率，如 `每小时` ；

## 最后

因为群晖nas只提供DNSPod的ipv4动态解析，所以需要用脚本更新ipv6解析；

如果你非常熟悉shell编程，应该很容易理解脚本内容，在此基础上修改使其可用于其他DNS解析；

需要注意：

1. 确保你的ISP服务商有提供ipv6地址，非 `fe80` 开头；
2.  使用网卡方式获取ipv6地址时，应确认ipv6地址所在的网卡，如 `ovs_eth0` （通常是 `eth0` ）
3. 访问ipv6解析的nas需要你的网络支持ipv6，测试网站：[IPv6 测试 (test-ipv6.com)](https://www.test-ipv6.com/index.html.zh_CN) 

OK，拥有ipv6后便可摆脱内网穿透的繁琐啦！
