---
title: 【明日方舟】明日方舟解包教程——咕咕咕ing
date: 2020-08-03 18:00:36
aplayer: true
tags: [Python, 明日方舟, 解包]
categories: 
  - 牛排的小项目
---
<img src="https://bucket.sknp.top/2023/07/8bcc473091cf40a5b5ebb7630c05f65f.png"   alt=""/>

<!-- more -->

<meting-js id="5027081935" server="netease" type="playlist" theme="#C20C0C"> </meting-js>

## 摘要
> 尽可能的使解包过程自动化且智能化

## 前言

> 本教程纯粹兴趣使然，请勿用于其他奇怪的地方，请勿在公开场合讨论解包内容，谢谢合作🙂

> 系统要求：windows7及以上，暂不支持MAC与Linux
>
> Github: https://github.com/Sknp1006/Arknights

> 配合BGM食用效果更佳

## 明日方舟解包概述

### 目录概述

- `assets`: 存放游戏相关资源文件(.ab后缀)
- `lib`: 存放链接文件(.so后缀)
- `res`: 存放app图标、布局、描述等文件

#### assets\AB\Android目录结构

> 游戏资源都在该目录下

- `activity`: 主要是活动LOGO及布局UI图标等
- `arts`🔥: 几乎涵盖所有主界面LOGO，包括主界面、干员头像、精英、家具、敌人头像、信物、皮肤、芯片、材料、帮助、商店、地图
- `audio`: 游戏音乐资源
- `battle`: 与作战界面有关的贴图
- `building`: 基建贴图
- `charpack`🔥: Texture2D干员立绘
- `crisisseasons`: 危机合约贴图
- `gamedata`: 剧情对话
- `i18n`: 剧情外的提示文本("[BUILDING_BUY_LABOR_NO_AP]理智不足，无法进行急速充能")
- `npcpack`: npc资源包(博士，凯尔希，龙门高层等)
- `prefabs`: 商店开包资源(包含可露希尔立绘)
- `scenes`: Texture2D场景贴图
- `spritepack`: 情报收集室、干员专精图标、干员皮肤全图、剧情封面贴图
- `ui`: 活动关卡地图、剿灭作战地图、主线地图、资源地图、教学图、章节图、寻访图、商店促销预览图

## 工具介绍
### AssetStudio
> AssetStudio is a tool for exploring, extracting and exporting assets and assetbundles.
> 链接: https://github.com/Perfare/AssetStudio
> 博客: https://www.perfare.net/

#### 依赖

- [.NET Framework 4.7.2](https://dotnet.microsoft.com/download/dotnet-framework/net472)
- [Microsoft Visual C++ 2017 Redistributable](https://support.microsoft.com/help/2977003/the-latest-supported-visual-c-downloads)

#### 编译

Visual Studio 2019 or newer  
AssetStudioFBX uses [FBX SDK 2020.0.1 VS2017](https://www.autodesk.com/developer-network/platform-technologies/fbx-sdk-2020-1-1) , before building, you need to install the FBX SDK and modify the project file, change include directory and library directory to point to the FBX SDK directory  
If you want to change the FBX SDK version, you need to replace libfbxsdk.dll which in AssetStudioGUI/Libraries/x86/ and AssetStudioGUI/Libraries/x64/ directory to the new version

> 这里演示x64编译方式，FBX SDK默认安装在C盘，请根据实际情况进行更改

- 将`FBX SDK`添加`include directory`(包含目录)和`library directory`(库目录)

1. 找到解决方案管理器，右键`AssetStudioFBXNative`->`属性`，找到`包含目录`与`库目录`

<img src="https://bucket.sknp.top/2023/07/6b21341de66ae6f7a8cb035122f0c1de.png" style="zoom: 80%;"  alt=""/>

2. 添加`C:\Program Files\Autodesk\FBX\FBX SDK\2020.1.1\include`路径到`包含目录`

<img src="https://bucket.sknp.top/2023/07/2c4a05c1061647b0a617d5c77a20a02e.png" style="zoom:80%;"  alt=""/>

3. 添加`C:\Program Files\Autodesk\FBX\FBX SDK\2020.1.1\lib\vs2017\x64\release`到`库目录`

<img src="https://bucket.sknp.top/2023/07/2defd38ca8752ed104d0a80baec85f21.png" style="zoom:80%;"  alt=""/>

4. 设置编译参数`Release` `x64`，点击`本地Windows调试器`，按提示完成调试

<img src="https://bucket.sknp.top/2023/07/4c3984f572605c2f82c4d6fe08149383.png"   alt=""/>

5. 找到你所编译的程序目录`C:\Users\SKNP\Downloads\AssetStudio-0.15.0\AssetStudioGUI\bin\Release`

<img src="https://bucket.sknp.top/2023/07/f3a238ce47d4c59f7af2af8e01757474.png"   alt=""/>

6. 至此已完成程序编译，双击`AssetStudioGUI.exe`开始使用吧(*￣3￣)╭

#### 如果你看的头大，可以直接下载我编译好的版本

> [AssetStudio-0.15.0](https://pan.baidu.com/s/157WM-L-kUU6OmYy4srewvw ) 提取码：d174

### GalPhotoAuto
> 用于合成GALGAME解包后的图片程序。
>
> 下载链接: [https://blog.ztjal.info/?dl_id=10](https://blog.ztjal.info/?dl_id=10)
> 下载链接：[https://pan.baidu.com/s/1oySXwL6B_K7w1Knsy4fhyg](https://pan.baidu.com/s/1oySXwL6B_K7w1Knsy4fhyg) 提取码：oqt2 
>
> 博客: [https://blog.ztjal.info/my-computer-using/hate-software/galphotoauto](https://blog.ztjal.info/my-computer-using/hate-software/galphotoauto)

❗更多信息见博客或程序包中的说明文件

## 使用说明

### 使用思路

- 获取游戏资源(获取原始文件)
- 使用AssetStudio提取游戏的加密资源(解密文件)
- 对于提取出的资源进行二次处理(即是将文件变成可以被其他软件使用的形式)

### 方法步骤

> 获取游戏资源

- 明日方舟APK下载链接：`https://ak.hypergryph.com/downloads/android_lastest`
- 将`.apk`改为`.zip`，解压`assets\AB\Android`目录

> 提取游戏资源

- 运行`AssetStudioGUI.exe` -> `File` -> `Load folder` -> 选择`Android `文件夹-> 文件载入
- 点击`Filter Type`: 类型筛选(仅简单介绍部分)
  - `AudioClip`: 游戏音乐
  - `Mesh`: 游戏中的实体模型
  - `Sprite`: 一种特殊的图片，场景中的Sprite可以像普通的3D游戏物体一样对待
  - 🔥`Texture2D`: 二维图片，游戏内的贴图资源
- 点击`Export` -> `Filtered assets` -> 导出所筛选资源
- 若导出Texture2D类型文件则保存在Texture2D文件夹中

> 二次处理(以Texture2D为例)
>
> 立绘被分成了两张图，一个储存的是 RGB 通道的信息，另一个储存的是 Alpha 通道的信息，因此需要把两个通道合并
>
> 下载[批量修改文件名(明日方舟立绘).vbs](https://pan.baidu.com/s/1fY42ZQtTM93EMbBcdwn-lQ) 提取码：hgp1

- 复制`批量修改文件名(明日方舟立绘).vbs`到`Texture2D`目录下，双击运行，等待至脚本弹出"文件重命名处理完成"对话框

- 运行`GalPhotoAuto.exe`  -> 选择`(2)添加处理图片` -> 模式二（添加文件夹） -> 点击`(2)选择合成规则`
-  依次点开：常规合成规则 -> 源图与ALPHA分开为两张图 -> 模式二：添加文件夹，自动合成，以“_m”结尾的合成，xxx.bmp是源图，xxx_m.bmp是作为ALPHA 4，点击执行即可
- 合成完毕的文件，名字里会包含merge，需要手动筛选

## 我的方案

<details><summary>暂未完成</summary>

> 上述的方案适合小白，以下方案适合有一定编程基础的玩家

> 👉首先，准备好游戏安装包，并提取出所需资源(Texture2D)
>
> 配套源码在文章开头的Github链接中😘
>
> 下面开始二次处理: 

### 从Texture2D中筛选char开头的文件

- *Texture2D_path* 是你提取的目录

- *destPath* 是char文件保存的目录
- 仅需要更改或输入`Texture2D_path`

### 合成图片

> 图片是两两对应的，你会发现总文件数却是奇数，原因是多了一个`char_any.png`，就是你每次抽卡都会出现的黑色小人(‾◡◝)，莫慌

- 文件主要分两种 *源图* 和 *alpha* 图，二者一一对应
- 原图又分一下几种:
  - `char_编号_名字`: 四肢散落一地图(bushi)
  - 🔥`char_编号_名字_1`: 初始立绘
  - 🔥`char_编号_名字_1+`: 精1立绘（阿米娅特有）
  - 🔥`char_编号_名字_2`: 精2立绘
  - 🔥`char_编号_名字_代号`: 皮肤立绘
- 文件名中带 *[alpha]* 为alpha文件

</details>

---

![](https://bucket.sknp.top/2023/07/2fbd058327fd1f595863683f895e1782.jpg)

