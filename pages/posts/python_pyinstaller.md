---
title: pyinstaller使用教程
date: 2020-08-03 22:23:27
updated: 2020-08-03 22:23:27
tags: [Python, pyinstaller]
categories: 
  - 牛排的小笔记
---
就在今天，我突然想用python编写一个明日方舟apk自动解包的程序。既然要解包，首先要下载包，众所周知在windows上运行py文件是不如直接运行exe方便的。这时就需要pyinstaller将py转换成exe。下面是本人在实际使用过程中的一些心得与踩坑，也欢迎大家留言交流。

<img src="https://bucket.sknp.top/2023/07/f108028767111f86e40882d27a07419c.jpeg" alt="Arknights" style="zoom:67%;" />

<!-- more -->

## 什么是pyinstaller?

简单的说，它是一个能将你编写的py项目打包成可执行文件的python第三方模块~

## 环境准备

### 使用pipenv

[*]  如果在原生环境中使用pyinstaller，可能会造出一个巨大的文件。这是因为原生环境还包含你所安装的其他模块，这些模块未必在你的项目中所使用，但是pyinstaller可没有人那么智能，它会一股脑给你全打包带走，十分贴心（雾）

<img src="https://bucket.sknp.top/2023/07/58d5f75f8cff987aa9ca68cf48d0f80c.png" alt=""  />

就拿download.py为例，源文件才4KB，硬生生给我干到了268MB，其效率之低，可想而知。



Pipenv 是一款管理虚拟环境的命令行软件，简单来讲，它可以创建一个只在某个目录下的局部 Python 环境，而这个环境是可以和全局环境脱离开的。

步骤如下:

1. 安装 Pipenv

```bash
pip install pipenv
```

2. 选一个好目录做我们的虚拟环境，然后在该目录下:

```bash
pipenv install --python 3.7
```

这样就可以在目录下创建一个局部的环境了，我这里设为 3.7 是因为我自己用的是 3.7，具体设什么根据自己的情况来定。

3. 在命令行下激活环境

```bash
pipenv shell
```

输入这个命令，我们就进入到了新建的虚拟环境。如果你这时候使用命令 `pip list` 并发现里面只有很少的库，这就说明我们成功进入虚拟环境了（有点像 Conda）。

4. 安装依赖的库

在虚拟环境下安装 Pyinstaller 和你自己的脚本依赖的第三方库，比如我的就是：

```bash
pipenv install pyinstaller
pipenv install setuptools==44.0.0  #避免使用最新
pipenv install urllib3
pipenv install tqdm
```

再次查看 `pip list` 时，如果都成功安装好了，我们就可以开始打包了。

5. 进入你的项目目录，运行pyinstaller即可。



使用pipenv后的对比:

<img src="https://bucket.sknp.top/2023/07/47b6812f25aa560609b86695c7d712a6.png"   alt="" />

😀



## 使用pyinstaller打包单个文件

用上面的方法创建好打包环境后，现在可以开始打包你的py文件啦~

*  Pyinstaller 用法很简单，在对应的主调 py 文件的目录下，运行:

```bash
pyinstaller [<args>] Target.py
```

介绍一下 Pyinstaller 常用的参数用法:

- `--distpath `: 打包到哪个目录下
- `-w`: 指定生成 GUI 软件，也就是运行时不打开控制台
- `-c`: 运行时打开控制台
- `-i `: 指定打包后可执行文件的图标
- `--clean`: 在构建之前清理PyInstaller缓存并删除临时文件

关于打包成什么样，有两种选择：

- `-D`: 创建包含可执行文件的单文件夹包，同时会有一大堆依赖的 dll 文件，这是默认选项
- `-F`: 只生成一个 .exe 文件，如果项目比较小的话可以用这个，但比较大的话就不推荐

最后来看看我使用的参数:

```bash
pyinstaller -F -i A.ico download.py
```

<img src="https://bucket.sknp.top/2023/07/173c5e220c504ffb9efe51f2ae69510f.png"   alt="" />

若不指定distpath，则默认将exe文件保存在dist目录。



**更多的用法可以自行百度**



## 踩坑

### 生成的exe文件过大

* 上文已经说过，使用pipenv即可解决。

### 生成的exe文件无法运行

> 这个问题比较特殊，这里讲讲我遇到的错

1. 能正常生成exe

    <img src="https://bucket.sknp.top/2023/07/2fc4d818b15b9eaf76d7d7801d7f15e9.png"   alt="" />
    
    如图所示，提示缺少模组，这里有两个思路:
    
    * 成功生成exe文件时，也会生成已**.spec**为后缀的文件，这是用来指示pyinstaller如何打包的文件，在`hiddenimports`中添加需要忽略的包（注意引号），如下所示：
    
        <img src="https://bucket.sknp.top/2023/07/0527414942d245836eb344b54d60980e.png"   alt=""/>
    
        再次尝试运行pyinstaller，若提示其他缺少的包，依次添加。
    
    * 根据网络上的资料，造成这种兼容性问题的原因是`setuptools`的版本过高，建议使用`44.0.0`版本，至于安装，想必不用再说了吧。总之推荐这种方法，前提是降级setuptools不会对你现有的程序造成错误。
    * 某天发现生成的exe又过大，这时请检查你的虚拟环境是否缺少包。在我的实践中发现，虚拟环境的包会在某些条件下变为最开始的状态。

2. 不能正常生成exe

> 多半是源程序不合规范

标准格式要包含如下内容:

```python
def main():
   print('hello world!')

if __name__ == '__main__':
   main()
```

download.py示例:

> tips: 想让tqdm在同一行显示，需要注意`ncols=80`参数和`miniters=0`，前者是行宽，后者是刷新频率

```python
import urllib.request as ur
import tqdm


# 进度条类
class TqdmUpTo(tqdm.tqdm):
    # Provides `update_to(n)` which uses `tqdm.update(delta_n)`.

    last_block = 0

    def update_to(self, block_num=1, block_size=1, total_size=None):
        if total_size is not None:
            self.total = total_size
        self.update((block_num - self.last_block) * block_size)
        self.last_block = block_num


def main():
    link = "https://ak.hypergryph.com/downloads/android_lastest"
    local = 'Arknights.zip'
    try:
        with TqdmUpTo(unit='B', unit_scale=True, unit_divisor=1024, miniters=0, desc="Arknights",
                      dynamic_ncols=False, ncols=80) as t:  # 继承至tqdm父类的初始化参数
            ur.urlretrieve(link, filename=local, reporthook=t.update_to, data=None)
        input("按任意键继续...")
    except KeyboardInterrupt:
        t.close()
        raise
    t.close()

```