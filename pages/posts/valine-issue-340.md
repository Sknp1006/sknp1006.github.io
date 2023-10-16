---
title: 关于Valine在leancloud国际版无法使用的问题
date: 2020-09-26 17:25:41
type: github
url: https://github.com/xCss/Valine/issues/340
tags: [valine, issues]
categories: 
  - 牛排的小笔记
---
解决方法: 在 `yun.yml` 中添加如下代码
```yaml
valine:
  ServerURLs = "https://xxxxx.api.lncldglobal.com"
```
> xxxxx表示AppID的前8位字符

<!-- more -->
