---
title: PyQt5使用说明
date: 2020-09-10
updated: 2021-01-07
tags: [Python, PyQt5]
categories: 
  - 牛排的小笔记
---
用python写脚本，一到运行就low爆，作为程序怎能没有GUI？

GUI项目归档: [https://github.com/Sknp1006/GUI-with-PyQt5](https://github.com/Sknp1006/GUI-with-PyQt5) 

参考资料[《PyQt5快速开发与实战》(含配套代码)](https://github.com/cxinping/PyQt5) 

<!-- more -->

## PyQt5环境搭建
### 安装环境 

|操作系统|Windows10 64bit|
|-------|---------|
|Python|~~3.7.0~~ 3.8.5|
|PyQt5|~~5.15.0~~ 5.15.2|
|Eric|20.9|

### 安装Python

略

### 安装PyQt5

```bash
pip install PyQt5 -i https://pypi.douban.com/simple
```

```bash
pip install PyQt5-tools -i https://pypi.douban.com/simple
```

> 将pyqt5-tools安装路径添加到系统的环境变量 **Path**

例如: `C:\Users\SKNP\Anaconda3\Lib\site-packages\pyqt5_tools`

> 测试是否安装成功，运行以下代码

```python
import sys 	
from PyQt5 import QtWidgets 


app = QtWidgets.QApplication(sys.argv)
widget = QtWidgets.QWidget()
widget.resize(360, 360)
widget.setWindowTitle("hello, pyqt5")
widget.show()
sys.exit(app.exec_())
```

> 下载Eric 6: http://eric-ide.python-projects.org/eric-download.html 
>
> 解压并修改文件名为`eric6`

> 在安装Eric 6之前，需要先安装Qsci模块

```bash
pip install QScintilla -i https://pypi.douban.com/simple
```

### 配置Eric 6(不推荐)

```bash
python install.py
```

若安装过程会出现连接超时，可尝试换源，在`C:\Users\{你的用户名}\pip`中新建pip.ini，输入以下内容即可，类似的也可更换其他源

```ini
[global]
index-url = http://pypi.douban.com/simple
[install]
trusted-host = pypi.douban.com
```

如果没有提示出错，则安装成功

安装完成后，如果eric6文件夹中没有生成eric.bat，就需要进入eric6/eric文件夹双击eric6.pyw，打开eric6

> Eric 6相关配置

- setting->preferences->Qt->Tools Directory: pyqt5_tool安装目录
- setting->preferences->Editor->Autocompletion->QScintilla->勾选show single和Use fill-up characters
- setting->preferences->Editor->Autocompletion->勾选Automatic Completion Enabled

- 添加API并编译

<img src="https://bucket.sknp.top/2023/07/e8346acbfc388f516214af50b07bf9b8.png" style="zoom:80%;" />

<img src="https://bucket.sknp.top/2023/07/d5299565c107ad56c428ca613215f718.png" style="zoom:80%;" />

- setting->preferences->Project->Multiproject自定义workspace

<img src="https://bucket.sknp.top/2023/07/6d3884aec9f762f6f98547a7f39fbd7f.png" style="zoom:80%;" />

- 安装自动补全插件jedi

```bash
pip install jedi -i https://pypi.douban.com/simple
```

- 为Eric 6安装jedi插件

<img src="https://bucket.sknp.top/2023/07/cd74c25e206ec965a0a86b4199843437.png" style="zoom: 80%;" />

接下来找到`Completions,Jedi`安装即可，但是插件仓库一直无法连接，这个方法对我来说不太适用，可以参考接下来的配置。

### 配置Pycharm+PyQt5(推荐)

参考链接: 

- [pyQt designer.exe 无法打开](https://blog.csdn.net/weixin_44134722/article/details/106367308?depth_1-) 
- [This application failed to start because no Qt platform plugin could be initialized.](https://blog.csdn.net/tt1724369779/article/details/101434147) 

最新版的designer.exe位置略有不同，参考：`C:\Users\SKNP\anaconda3\envs\pyqt\Lib\site-packages\qt5_applications\Qt\bin\designer.exe`

在pycharm中添加`External Tools`：
* File->Settings->Tools->External Tools->+

```
Name: QtDesigner
Group: External Tools
Program: C:\Users\SKNP\anaconda3\envs\pyqt\Lib\site-packages\qt5_applications\Qt\bin\designer.exe
Working directory: $FileDir$
```
```
Name: PyUIC
Group: External Tools
Program: C:\Users\SKNP\anaconda3\envs\pyqt\Scripts\pyuic5.exe
Arguments: $FileName$ -o $FileParentDir$\$FileNameWithoutExtension$.py
Working directory: $FileDir$
```
```
Name: PyRCC
Group: External Tools
Program: C:\Users\SKNP\anaconda3\envs\pyqt\Scripts\pyrcc5.exe
Arguments: $FileName$ -o$FileNameWithoutExtension$_rc.py
Working directory: $FileDir$
```

**Done!**

---
