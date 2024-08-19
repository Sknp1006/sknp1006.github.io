---
title: 【Python】学习协程
date: 2022-06-03 22:22:33
updated: 2022-06-03 22:22:33
tags: [Python, coroutine, asyncio]
categories: 
  - 牛排的小笔记
---

## 前言

好，今天我们来学python协程&异步编程！

<!-- more -->

## 正文

### 1.协程

协程（Coroutine），也可以被称为微线程，是一种用户态的上下文切换技术。简而言之，其实是通过一个线程实现代码块的相互切换执行。例如：

```python
def func1():
    print(1)
    ...
    print(2)
    
def func2():
    print(3)
    ...
    print(4)

func1()
func2()
```

实现协程有这几种方法：

- greenlet，早期模块。
- yield关键字。
- asyncio装饰器（py3.4）
- async、await关键字（py3.5）【推荐】

#### 1.1 greenlet实现协程

```shell
pip3 install greenlet
```

```python
from greenlet import greenlet

def func1():
    print(1)
    gr2.switch()
    print(2)
    gr2.switch()

def func2():
    print(3)
    gr1.switch()
    print(4)

gr1 = greenlet(func1)
gr2 = greenlet(func2)

gr1.switch()
```

#### 1.2 yield关键字

```python
def func1():
    yield 1
    yield from func2()
    yield 2
    
def func2():
    yield 3
    yield 4

f1 = func1()
for item in f1:
    print(item)
```

#### 1.3 asyncio

> 在python3.4及之后的版本

```python
import asyncio

@asyncio.coroutine
def func1():
    print(1)
    # 网络IO请求
    yield from asyncio.sleep(2)  # 遇到IO耗时操作，自动化切换到tasks中的其他任务
    print(2)

@asyncio.coroutine
def func2():
    print(3)
    # 网络IO请求
    yield from asyncio.sleep(2)  # 遇到IO耗时操作，自动化切换到tasks中的其他任务
    print(4)

tasks = [
    asyncio.ensure_future(func1()),
    asyncio.ensure_future(func2())
]

loop = asyncio.get_event_loop()
loop.run_until_complete(asyncio.wait(tasks))
```

注意：遇到IO阻塞自动切换

#### 1.4 async & await关键字

> 在python3.5及之后的版本

```python
import asyncio

async def func1():
    print(1)
    # 网络IO请求
    await asyncio.sleep(2)  # 遇到IO耗时操作，自动化切换到tasks中的其他任务
    print(2)


async def func2():
    print(3)
    # 网络IO请求
    await asyncio.sleep(2)  # 遇到IO耗时操作，自动化切换到tasks中的其他任务
    print(4)

tasks = [
    asyncio.ensure_future(func1()),
    asyncio.ensure_future(func2())
]

loop = asyncio.get_event_loop()
loop.run_until_complete(asyncio.wait(tasks))
```

### 2.协程意义

在一个线程中如果遇到IO等待时间，线程不会傻等，利用空闲的时间干其他的事。

案例：下载三张图片（网络IO）

- 普通方式（同步）

```python
import requests

def download_image(url):
    print("开始下载：", url)
    response = requests.get(url)
    print("下载完成")
    file_name = url.split('/')[-1]
    with open(file_name, mode='wb') as file_object:
        file_object.write(response.content)

if __name__ == "__main__":
    url_list = [
        'https://images.sknp.top/images/2021/05/07/2VlT.jpg',
        'https://images.sknp.top/images/2021/05/07/2Qkg.jpg',
        'https://images.sknp.top/images/2021/05/07/2ync.jpg'
    ]
    for item in url_list:
        download_image(item)
```

- 协程方式（异步）

```python
import aiohttp
import asyncio

async def fetch(session, url):
    print("发送请求", url)
    async with session.get(url, verify_ssl=False) as response:
        content = await response.content.read()
        file_name = url.split('/')[-1]
        with open(file_name, mode='wb') as file_object:
            file_object.write(content)

async def main():
    async with aiohttp.ClientSession() as session:
        url_list = [
            'https://images.sknp.top/images/2021/05/07/2VlT.jpg',
            'https://images.sknp.top/images/2021/05/07/2Qkg.jpg',
            'https://images.sknp.top/images/2021/05/07/2ync.jpg'
        ]
        tasks = [asyncio.create_task(fetch(session, url)) for url in url_list]
        await asyncio.wait(tasks)
 
if __name__ == "__main__":
    # asyncio.run(main())  #py3.7及之后支持
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
```

> 注意：`asyncio.run(main())` 可能会报 **RuntimeError: Event loop is closed** 
>
> 因为它会自动关闭循环

### 3.异步编程

#### 3.1 事件循环

```
# 伪代码

任务列表 = [任务1, 任务2, 任务3...]
while True:
    可执行的任务列表，已完成的任务列表 = 去任务列表中检查所有的任务，将'可执行'和'已完成'的任务返回
    for 就绪任务 in 可执行的任务列表:
        执行已就绪的任务
    for 已完成的任务 in 已完成的任务列表:
        在任务列表中移除已完成的任务
    如果 任务列表 中的任务都已完成，则终止循环
```

```python
import asyncio
# 生成或获取一个事件循环
loop = asyncio.get_event_loop()
# 将任务放到'任务列表'
loop.run_until_complete(任务)
```

#### 3.2 快速上手

协程函数，定义函数的时候 `async def` 函数名

协程对象，执行 `协程函数()` 得到的对象

```python
async def func():
    pass
result = func()
```

注意：执行协程函数创建协程对象，函数内部代码不会执行。

```python
import asyncio

async def func():
    print("hello world")

resule = func()

# loop = asyncio.get_event_loop()
# loop.run_until_complete(result)
asyncio.run(result)  #py3.7及之后支持
```

#### 3.3 await

await + 可等待的对象（协程对象、Future、Task对象 -> IO等待）

示例1：

```python
import asyncio

async def func():
    print('fff')
    response = await asyncio.sleep(2)
    print("结束", response)

asyncio.run(func())
```

示例2：

```python
import asyncio

async def others():
    print('start')
    await asyncio.sleep(2)
    print('end')
    return "返回值"

async def func():
    print("执行协程函数内部代码")
    # 遇到IO操作挂起当前协程（任务），等IO操作完成后继续往下执行。当前协程挂起时，事件循环可以去执行其他协程（任务）
    response = await others()
    print("IO请求结束：", response)
    
asyncio.run(func())
```

示例3：

```python
import asyncio

async def others():
    print('start')
    await asyncio.sleep(2)
    print('end')
    return "返回值"

async def func():
    print("执行协程函数内部代码")
    # 遇到IO操作挂起当前协程（任务），等IO操作完成后继续往下执行。当前协程挂起时，事件循环可以去执行其他协程（任务）
    response1 = await others()
    print("IO请求结束：", response1)
    
    response2 = await others()
    print("IO请求结束：", response2)
    
asyncio.run(func())
```

await就是等待对象的值得到结果后再继续往下走。

#### 3.4 Task对象

Tasks用于并发调度协程，通过 `asyncio.create_task(协程对象)` 的方式创建Task对象，这样可以让协程加入事件循环中等待被调度执行。除了使用 `asyncio.create_task()` 函数（py3.7）以外，还可以用低层级的 `loop.create_task()` 或 `ensure_future()` 函数。不建议使用手动实例化Task对象。 

示例1：

```python
import asyncio

async def func():
    print(1)
    await asyncio.sleep(2)
    print(2)
    return "返回值"

async def main():
    print("开始")
    # 创建Task对象，将当前执行的func函数添加到任务循环
    task1 = asyncio.create_task(func())
    task2 = asyncio.create_task(func())
    
    print("main结束")
    # 当执行某协程遇到IO操作时，会自动化切换到其他任务
    # 此处的await是等待相应协程全部执行完并获取结果
    ret1 = await task1
    ret2 = await task2
    print(ret1, ret2)

# 另一种写法
async def main():
    print("开始")
    task_list = [
        asyncio.create_task(func(), name='n1'),
        asyncio.create_task(func(), name='n2')
    ]
    print("main结束")
    
    done, pedding = await asyncio.wait(task_list[])
    print(done)
    
asyncio.run(main())
```

示例2：

```python
import asyncio

async def func():
    print(1)
    await asyncio.sleep(2)
    print(2)
    return "返回值"

task_list = [
    func(),
    func()
]

done, pedding = asyncio.run(asyncio.wait(task_list))
print(done)
```

#### 3.5 asyncio.Future对象

Task继承Future，Task对象内部await结果的处理基于Future对象来的。

示例1：

```python
async def main():
    # 获取当前事件循环
    loop = asyncio.get_running_loop()
    # 创建一个任务（Future对象），这个任务啥也不干
    fut = loop.create_future()
    # 等待任务最终结果（Future对象），没有结果会一直等待
    await fut
    
asyncio.run(main())
```

示例2：

```python
import asyncio

async def set_after(fut):
    await asyncio.sleep(2)
    fut.set_result("666")

async def main():
    # 获取当前事件循环
    loop = asyncio.get_running_loop()
    # 创建一个任务（Future对象）
    fut = loop.create_future()
    # 创建一个任务（Task对象），绑定set_after函数，函数内部在2s之后给fut赋值
    await loop.create_task(set_after(fut))
    # 等待Future对象获取最终结果
    data = await fut
    print(data)

asyncio.run(main())
```

#### 3.6 concurrent.futures.Future对象

使用线程池、进程池实现异步操作时用到的对象。

```python
import time
from concurrent.futures import Future
from concurrent.futures.thread import ThreadPoolExecutor
from concurrent.futures.process import ProcessPoolExecutor

def func(value):
    time.sleep(1)
    print(value)
    return 123

# 创建线程池
pool = ThreadPoolExecutor(max_workers=5)

# 创建进程池
# pool = ProcessPoolExecutor(max_workers=5)

for i in range(10):
    fut = pool.submit(func, i)
    print(fut)
```

以后写代码可能会存在交叉使用。例如：crm项目80%都是基于协程异步编程 + MySQL（不支持）

```python
import time
import asyncio
import concurrent.futures

def func1():
    # 某个耗时操作
    time.sleep(2)
    return "SB"

async def main():
    loop = asyncio.get_running_loop()
    
    # 1. Run in the default loop's executor（默认ThreadPoolExecutor）
    # 第一步：内部会先调用ThreadPoolExecutor的submit方法去线程池中申请一个线程去执行func1函数，并返回一个concurrent.futures.Future对象
    # 第二步：调用asyncio.wrap_future将concurrent.futures.Future对象包装为asyncio.Future对象。
    # 因为concurrent.futures.Future对象不支持await语法，所以需要包装为asyncio.Future对象才能使用。
    fut = loop.run_in_executor(None, func1)
    result = await fut
    print('default thread pool', result)
    
    # 2. Run in a custom thread pool:
    # with concurrent.futures.ThreadPoolExecutor() as pool:
    #    result = await loop.run_in_executor(pool, func1)
    #    print('custom thread pool', result)
    
    # 2. Run in a custom process pool:
    # with concurrent.futures.ProcessPoolExecutor() as pool:
    #    result = await loop.run_in_executor(pool, func1)
    #    print('custom Process pool', result)
 
asyncio.run(main())
```

案例：asyncio + 不支持异步的模块

```python
import asyncio
import requests

async def download_image(url):
    # 发送网络请求，下载图片
    print("开始下载", url)
    loop = asyncio.get_event_loop()
    # requests模块默认不支持异步操作，故用线程池配合实现
    future = loop.run_in_executor(None, requests.get,url)
    
    response = await future
    print("下载完成")
    # 图片保存到本地文件
    file_name = url.split('/')[-1]
    with open(file_name, mode='wb') as file_object:
        file_object.write(response.content)

if __name__ == '__main__':
    url_list = [
        'https://images.sknp.top/images/2021/05/07/2VlT.jpg',
        'https://images.sknp.top/images/2021/05/07/2Qkg.jpg',
        'https://images.sknp.top/images/2021/05/07/2ync.jpg'
    ]
    tasks = [download_image(url) for url in url_list]
    loop = asyncio.get_event_loop()
    loop.run_until_complete(asyncio.wait(tasks))
```

#### 3.7 异步迭代器

**什么是异步迭代器**

实现了 `__aiter__()` 和 `__anext__()` 方法的对象。`__anext__` 必须返回一个awaitable对象。`async for` 会处理异步迭代器的 `__anext__()` 方法所返回的可等待对象，直到引发一个 StopAsyncIteration 异常。

**什么是异步可迭代对象**

可以在 `async for` 语句中被使用的对象。必须通过它的 `__anext__()` 方法返回一个 asyncchronous iterator。

```python
import asyncio

class Reader(object):
    """自定义异步迭代器"""
    
    def __init__(self):
        self.count = 0
        
    async def readline(self):
        # await asyncio.sleep(1)
        self.count += 1
        if self.count == 100:
            return None
        return self.count
    
    def __aiter__(self):
        return self
    
    async def __anext__(self):
        val = await self.readline()
        if val == None:
            raise StopAsyncIteration
        return val

async def func():
    obj = Reader()
    async for item in obj:
        print(item)
        
asyncio.run(func())
```

#### 3.8 异步上下文管理器

此种对象通过定义 `__aenter__()` 和 `__aexit__()` 方法来对 `async with` 语句中的环境进行控制。

```python
import asyncio

class AsyncContexManager:
    def __init__(self):
        self.conn = conn
    async def do_something(self):
        # 异步操作数据库
        return 666
    async def __aenter__(self):
        # 异步连接数据库
        self.conn = await asyncio.sleep(1)
        return self
    async def __aexit__(self, exc_type, exc, tb):
        # 异步关闭数据库连接
        await asyncio.sleep(1)

async with AsyncContexManager() as f:
    result = await f.do_something()
    print(result)
    
asyncio.run(func())
```

### 4.uvloop

 是asyncio的事件循环的替代方案。事件循环 > 默认asyncio的事件循环。

```shell
pip3 install uvloop
```

```python
import asyncio
import uvloop
asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

# 编写asyncio的代码，与之前的代码一致

# 内部的事件循环自动变为uvloop
asyncio.run(...)
```

### 5.实战案例

#### 5.1 异步redis

在通过python代码操作redis时，链接/操作/断开都是网络IO。

```shell
pip3 install aioredis==1.3.1
```

示例1：

```python
import asyncio
import aioredis


async def execute(address):
    print("开始执行", address)
    # 网络IO操作：创建redis连接
    redis = await aioredis.create_redis(address)
    # 网络IO操作：在redis中设置哈希值car，内部再设三个键值对
    await redis.hmset_dict('car', key1=1, key2=2, key3=3)

    # 网络IO操作：去redis中获取值
    result = await redis.hgetall('car', encoding='utf-8')
    print(result)

    redis.close()
    # 网络IO操作：关闭redis连接
    await redis.wait_closed()

    print("结束", address)


asyncio.run(execute('redis://127.0.0.1:6379'))
```

> 可通过docker在本地快速启动redis数据库： **docker run -d redis**

示例2：

```python
import asyncio
import aioredis


async def execute(address):
    print("开始执行", address)
    # 网络IO操作：创建redis连接
    redis = await aioredis.create_redis(address)
    # 网络IO操作：在redis中设置哈希值car，内部再设三个键值对
    await redis.hmset_dict('car', key1=1, key2=2, key3=3)

    # 网络IO操作：去redis中获取值
    result = await redis.hgetall('car', encoding='utf-8')
    print(result)

    redis.close()
    # 网络IO操作：关闭redis连接
    await redis.wait_closed()

    print("结束", address)


task_list = [
    execute('redis://127.0.0.1:6379'),
    execute('redis://127.0.0.1:6379')
]
asyncio.run(asyncio.wait(task_list))
```

异步连接池（部分代码）：

```python
import aioredis
from aioredis import Redis

REDIS_POOL = aioredis.ConnectionsPool('redis://127.0.0.1', minsize=1, maxsize=10)

async def func():
    # 连接池获取一个连接
    conn = await REDIS_POOL.acquire()
    redis = Redis(conn)
    # 写
    await redis.hmset_dict('car', key1=1, key2=2, key3=3)
    # 读
    result = await redis.hgetall('car', encoding='utf-8')
    # 归还连接池
    REDIS_POOL.release(conn)
```

#### 5.2 异步MySQL

```shell
pip3 install aiomysql
```

示例1：

```python
import asyncio
import aiomysql

async def execute():
    # 网络IO操作：创建mysql连接
    conn = await aiomysql.connect(host='127.0.0.1', port=3306, user='root', password='123', db='mysql')
    # 网络IO操作：创建CURSOR
    cur = await conn.cursor()

    # 网络IO操作：执行SQL
    await cur.execute("select Host,User from user")
    # 网络IO操作：获取SQL结果
    result = await cur.fetchall()
    print(result)
    # 网络IO操作：关闭redis连接
    await cur.close()
    conn.close()
    
asyncio.run(execute())
```

示例2：

```python
import asyncio
import aiomysql

async def execute():
    # 网络IO操作：创建mysql连接
    conn = await aiomysql.connect(host='127.0.0.1', port=3306, user='root', password='123', db='mysql')
    # 网络IO操作：创建CURSOR
    cur = await conn.cursor()
    # 网络IO操作：执行SQL
    await cur.execute("select Host,User from user")
    # 网络IO操作：获取SQL结果
    result = await cur.fetchall()
    print(result)
    # 网络IO操作：关闭redis连接
    await cur.close()
    conn.close()

task_list = [
    execute('127.0.0.1', 'password'),
    execute('127.0.0.1', 'password')
]
asyncio.run(asyncio.wait(task_list))
```

#### 5.3 aiohttp

```shell
pip3 install aiohttp
```

```python
import aiohttp
import asyncio

async def fetch(session, url):
    print("发送请求：", url)
    async with session.get(url, verify_ssl=False) as response:
        text = await response.text()
        print("得到结果：", url, len(text))

async def main():
    async with aiohttp.ClientSession() as session:
        url_list = [
            'https://python.org',
            'https://www.baidu.com',
            'https://www.pythonav.com'
        ]
        tasks = [asyncio.create_task(fetch(session, url)) for url in url_list]
        await asyncio.wait(tasks)
    
if __name__ == '__main__':
    # asyncio.run(main())
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
```

## 最后

Keep Learning！
