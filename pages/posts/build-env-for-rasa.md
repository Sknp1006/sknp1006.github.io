---
title: NLP环境搭建(Rasa)
date: 2021-01-02 17:49:10
updated: 2021-01-03 22:00:00
tags: [NLP, NLU, 安装环境, rasa]
categories: 
  - 牛排的小笔记
---
> 虽说环境搭建算不上啥干货,但是对于本人而言，每次搭环境都要重新找配置找资源
> 过程繁琐且浪费时间,所以写篇文章记录，也就是说这篇文章其实是备忘录
> 记录使用Rasa的过程，相关项目也许会上传Github

<!-- more -->

# 在Windows环境下
## 环境说明
系统版本：Windows 10专业版 20H2
Anaconda版本：3-2020.11-Windows-x86_64
Python版本：3.8.5
cuda：10.1
tensorflow：2.3.1（安装Rasa自带）
Rasa UI：3.0.3

## 安装Anaconda
> Anaconda指的是一个开源的Python发行版本，其包含了conda、Python等180多个科学包及其依赖项

国内用户请使用：[Anaconda清华镜像源](https://mirrors.tuna.tsinghua.edu.cn/anaconda/archive/)  
官方网站：[https://www.anaconda.com/](https://www.anaconda.com/) 

## 安装CUDA
> CUDA（Compute Unified Device Architecture），是显卡厂商NVIDIA推出的运算平台
> 总而言之，若你想使用GPU为机器学习加速，便需要安装CUDA√(相关包有pytorch、tensorflow等)

CUDA 10.1下载链接：[https://developer.nvidia.com/cuda-10.1-download-archive-base](https://developer.nvidia.com/cuda-10.1-download-archive-base)
> 安装过程偶见自动重启现象，请在安装CUDA时选择`自定义`，分别安装`图形驱动程序`与`CUDA`

## 安装tensorflow
> 官方文档：[https://tensorflow.google.cn/](https://tensorflow.google.cn/) 

### 硬件要求
  * 支持以下带有 GPU 的设备：
    * CUDA® 架构为 3.5、3.7、5.2、6.0、6.1、7.0 或更高的 NVIDIA® GPU 卡。请参阅[支持 CUDA® 的 GPU 卡列表](https://developer.nvidia.com/cuda-gpus) 
    * 在配备 NVIDIA® Ampere GPU（CUDA 架构 8.0）或更高版本的系统上，内核已从 PTX 经过了 JIT 编译，因此 TensorFlow 的启动时间可能需要 30 多分钟。通过使用 `export CUDA_CACHE_MAXSIZE=2147483648` 增加默认 JIT 缓存大小，即可将此系统开销限制为仅在首次启动时发生（有关详细信息，请参阅 [JIT 缓存](https://devblogs.nvidia.com/cuda-pro-tip-understand-fat-binaries-jit-caching) ）
    * 对于 CUDA® 架构不受支持的 GPU，或为了避免从 PTX 进行 JIT 编译，亦或是为了使用不同版本的 NVIDIA® 库，请参阅[在 Linux 下从源代码编译指南](https://tensorflow.google.cn/install/source)
    * 软件包不包含 PTX 代码，但最新支持的 CUDA® 架构除外；因此，如果设置了 CUDA_FORCE_PTX_JIT=1，TensorFlow 将无法在旧版 GPU 上加载。（有关详细信息，请参阅[应用兼容性](http://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#application-compatibility) ）
    
### 软件要求
  * 必须在系统中安装以下 NVIDIA® 软件：
    * [NVIDIA® GPU 驱动程序](https://www.nvidia.com/drivers) ：CUDA® 10.1 需要 418.x 或更高版本
    * [CUDA® 工具包](https://developer.nvidia.com/cuda-toolkit-archive) ：TensorFlow 支持 CUDA® 10.1（TensorFlow 2.1.0 及更高版本）
    * CUDA® 工具包附带的 [CUPTI](http://docs.nvidia.com/cuda/cupti/) 
    * [cuDNN SDK 7.6](https://developer.nvidia.com/cudnn)
    * （可选）[TensorRT 6.0](https://docs.nvidia.com/deeplearning/sdk/tensorrt-install-guide/index.html) ，可缩短用某些模型进行推断的延迟时间并提高吞吐量。

### 系统要求
  * Python 3.5-3.8
    * 若要支持 Python 3.8，需要使用 TensorFlow 2.2 或更高版本。
  * pip 19.0 或更高版本（需要 manylinux2010 支持）
  * Ubuntu 16.04 或更高版本（64 位）
  * macOS 10.12.6 (Sierra) 或更高版本（64 位）（不支持 GPU）
  * Windows 7 或更高版本（64 位）
    * [适用于 Visual Studio 2015、2017 和 2019 的 Microsoft Visual C++ 可再发行软件包](https://support.microsoft.com/help/2977003/the-latest-supported-visual-c-downloads) 
  * Raspbian 9.0 或更高版本
  * [GPU 支持](https://tensorflow.google.cn/install/gpu) 需要使用支持 CUDA® 的显卡（适用于 Ubuntu 和 Windows）

### 通过pip安装
```
pip install tensorflow
```
安装过慢请访问 [pypi](https://pypi.org/project/tensorflow/#files) 自行下载对应版本whl文件，例：`tensorflow-2.4.0-cp38-cp38-win_amd64.whl`
```
pip install .\tensorflow-2.4.0-cp38-cp38-win_amd64.whl
```

## 安装Node.js
官方网站：[https://nodejs.org/zh-cn/](https://nodejs.org/zh-cn/)
```
淘宝镜像源：npm config set registry https://registry.npm.taobao.org
官方源：npm config set registry http://www.npmjs.org
```

## 安装Rasa
> Rasa 是最火的聊天机器人框架，是基于机器学习和自然语言处理技术开发的系统 
> Rasa 中文官方文档包括聊天机器人，上下文管理，多伦对话，意图识别，填槽，中文聊天机器人开发必备手册 

中文文档：[http://www.rasachatbot.com/](http://www.rasachatbot.com/) 

Rasa 的推荐安装方式是通过pip:
```
pip install rasa-x --extra-index-url https://pypi.rasa.com/simple
```
解决方案：
  * [无法卸载 'ruamel-yaml'](https://www.pythonheidong.com/blog/article/505802/6b89827e9d0f316db511/) 
  * pip换源，在`C:\Users\SKNP\pip`下创建`pip.ini`
  ```
  [global]
  index-url = https://mirrors.aliyun.com/pypi/simple
  [install]
  trusted-host = mirrors.aliyun.com
  ```
  * [解决tensorflow-gpu 2.1出现错误“Could not load dynamic library 'cudart64_101.dll'](https://blog.csdn.net/qq_41999081/article/details/104515513) 



### 安装spaCy
> spaCy 是一个 Python 和 CPython 的 NLP 自然语言文本处理库，你也可以在这里找到想要的语言模型

官方文档：[https://spacy.io/models](https://spacy.io/models)

你可以用以下命令安装：
```
pip install rasa[spacy]
python -m spacy download en_core_web_md
python -m spacy link en_core_web_md en
```
命令行下载过慢时使用离线安装：
例：下载[中文包](https://github.com/explosion/spacy-models/releases//tag/zh_core_web_md-2.3.1) 
```
pip install zh_core_web_md-2.3.1.tar.gz
```
> 语言包路径：`C:\Users\YOU\anaconda3\Lib\site-packages\spacy\data`

## 安装Rasa UI
### 通过npm安装
```
git clone https://github.com/paschmann/rasa-ui.git
cd rasa-ui
npm install
```
**建议使用cnpm可规避大部分问题**
解决方案：
  * [windows下electron安装node原生模块(sqlite3)--踩坑记录](https://my.oschina.net/dtdths/blog/1614712) 
  * [安装node-gyp](https://www.cnblogs.com/wangyuxue/p/11218113.html) 
  * 若要使用 v140 生成工具进行生成，请安装 Visual Studio 2015 生成工具
  * RasaUI\@3.0.3默认使用sqlite3\@4.1.0下载失败：参考[sqlite3](https://www.npmjs.com/package/sqlite3) 
  * fatal error LNK1127: 库已损坏，参考：[安装node-gyp并build——解决 "node.lib:fatal error LNK1127" 问题](https://blog.csdn.net/qq_33826977/article/details/78645665) 

---

![](https://bucket.sknp.top/2023/07/2fbd058327fd1f595863683f895e1782.jpg) 

