---
title: Github爬虫项目归档
date: 2020-07-03 08:25:10
updated: 2020-07-03 08:25:10
tags: [爬虫, scrapy]
categories: 
  - 牛排的小项目
---
# crawlers
简介：基于scrapy的爬虫项目，主要是做着玩，并探索scrapy~  [github](https://github.com/Sknp1006/crawler)

<!-- more -->

### 一些参数：
  1. 深度优先
  >> DEPTH_PRIORITY = 0  
  >> SCHEDULER_DISK_QUEUE = 'scrapy.squeues.PickleLifoDiskQueue'  
  >> SCHEDULER_MEMORY_QUEUE = 'scrapy.squeues.LifoMemoryQueue'  
  
  2. 广度优先  
  >> DEPTH_PRIORITY = 1  
  >> SCHEDULER_DISK_QUEUE = 'scrapy.squeues.PickleFifoDiskQueue'  
  >> SCHEDULER_MEMORY_QUEUE = 'scrapy.squeues.FifoMemoryQueue'  
  
  3. AutoThrottle extension  
  >> AUTOTHROTTLE_ENABLED = True
  >> AUTOTHROTTLE_START_DELAY = 0  
  >> AUTOTHROTTLE_MAX_DELAY = 60  
  >> AUTOTHROTTLE_TARGET_CONCURRENCY = 10.0  
  >> AUTOTHROTTLE_DEBUG = False  
  >> DOWNLOAD_DELAY = 0.1