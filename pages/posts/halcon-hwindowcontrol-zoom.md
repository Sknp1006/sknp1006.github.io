---
title: 【Halcon】图像的自适应显示、缩放、移动
date: 2021-07-27 20:22:22
updated: 2021-07-30 20:30:30
tags: [halcon, hWindowControl, C#]
categories: 
  - 牛排的小教程
---

## 前言

> 996使我快乐（大嘘
>
> 演示在 **hWindowControl** 控件中如何显示、缩放、拖动图像；

<!-- more -->

## 正文

- 引入Halcon库；

```csharp
using HalconDotNet;
```

### 自适应窗显示

> 使图片根据窗口大小自适应显示，通过计算控件的图像显示范围（左上行列、右下行列坐标）；
>
> 用到 `HOperatorSet.SetPart()` 方法；

```csharp
// 计算缩放后的[row1, column1, row2, column2]
public void CalScaleValue(HTuple Width, HTuple Height, HWindowControl hv_WindowControl, out HTuple row1, out HTuple column1, out HTuple row2, out HTuple column2)
    {
        HTuple ScaleWidth = Width / (hv_WindowControl.Width * 1.0);
        HTuple ScaleHeight = Height / (hv_WindowControl.Height * 1.0);

        // 判断是横向显示还是纵向显示
        if (ScaleWidth >= ScaleHeight)
        {
            row1 = -(1.0) * ((hv_WindowControl.Width * ScaleWidth) - Height) / 2;
            column1 = 0;
            row2 = row1 + hv_WindowControl.Height * ScaleWidth;
            column2 = column1 + hv_WindowControl.Width * ScaleWidth;
        }
        else
        {
            row1 = 0;
            column1 = -(1.0) * ((hv_WindowControl.Width * ScaleHeight) - Width) / 2;
            row2 = row1 + hv_WindowControl.Height * ScaleHeight;
            column2 = column1 + hv_WindowControl.Width * ScaleHeight;
        }
    }

// 图像显示函数
public void ShowImage()
{
    HTuple row1, column1, row2, column2;
    HTuple Width = new HTuple();  // 原始图像的宽
    HTuple Height = new HTuple();  // 原始图像的高
    Image.Dispose();  // 使用前释放
    HOperatorSet.ReadImage(out Image, filePath);  // 读取图像
    HOperatorSet.GetImageSize(Image, out Width, out Height);  // 获取图像宽高
    
    CalScaleValue(Width, Height, hv_WindowControl, out row1, out column1, out row2, out column2);  // 计算缩放比
    
    HDevWindowStack.Push(HWindowControl_0.HalconWindow);
    HOperatorSet.SetPart(HDevWindowStack.GetActive(), row1, column1, row2, column2);
    HOperatorSet.DispObj(Image, HDevWindowStack.GetActive());
}
```

### 用滚轮实现图像缩放

> 使用 `HOperatorSet.GetMposition()` 可以获得鼠标在 **hWindowControl** 控件的当前坐标(row, column)，但是要注意捕获异常（当控件丢失鼠标焦点），示例如下：

```csharp
Point startPoint = Point.Empty;  // 按下鼠标记录起始点
Point endPoint = Point.Empty;  // 松开鼠标记录终止点
int Delta = 0;  // 初始为0，上滚+120，下滚-120
// 鼠标滚轮事件
private void hWindowControl_HMouseWheel(object sender, HMouseEventArgs e)
{
    HTuple row, column, button;
    try
    {
        HOperatorSet.GetMposition(ModelObjectList[Index - 1].HWindowControl_0.HalconWindow, out row, out column, out button);
        Console.WriteLine(string.Format("HMouseWheel触发：row:{0}  column:{1}  button:{2}", row, column, button));
    }
    catch (HalconDotNet.HOperatorException)
    {
        // 移到控件外触发异常
    }
    catch (System.ArgumentOutOfRangeException)
    {
        // 没加载模板就触发了HMouseWheel事件
    }
    
    // button 变量取值说明：
    // 0：无按键
    // 1：鼠标左键
    // 2：鼠标中键
    // 4：鼠标右键
    // 8：Shift
    // 16：Ctrl
    // 32：Alt

    // 图像缩放（原理是假装控件大小变化，使图像适应窗口）
    Delta = Delta + e.Delta;  // 记录鼠标滚轮的滚动角度，用于计算缩放倍数
    if (Delta <= 0)   // 最小倍数为1
    {
        Delta = 0;  // 复位
        return;
    }
    if (Delta > 1200)  // 1200为放大10倍
    {
        Delta = 1200;
        return;
    }
    Console.WriteLine("Delta:" + Delta);

    try
    {
        HTuple row1_0, column1_0, row2_0, column2_0;
        HTuple row1, column1, row2, column2;
        ModelObjectList[Index - 1].HWindowControl_0.HalconWindow.GetPart(out row1_0, out column1_0, out row2_0, out column2_0);  // 获取当前控件中的图像显示区域（旧）
        ModelObjectList[Index - 1].SetZoomValue(Delta / 100);  // 设置缩放比
        ModelObjectList[Index - 1].CalScaleValue(ModelObjectList[Index - 1].tikaModel.Width, ModelObjectList[Index - 1].tikaModel.Height, ModelObjectList[Index - 1].HWindowControl_0, out row1, out column1, out row2, out column2);  // 计算缩放后的显示区域
        ModelObjectList[Index - 1].HWindowControl_0.HalconWindow.SetPart(row1, column1, row2, column2);
        ModelObjectList[Index - 1].HWindowControl_0.HalconWindow.GetPart(out row1, out column1, out row2, out column2);  // 获取当前控件中的图像显示区域（新）

        double dbRowMove, dbColMove;  // 坐标偏移量
        dbRowMove = row1_0 - row1;
        dbColMove = column1_0 - column1;

        ModelObjectList[Index - 1].ShowImage(dbRowMove, dbColMove);  // ShowImage方法重载
    }
    catch (System.ArgumentOutOfRangeException)
    {
        return;
    }
}
```

> 注释中提到图像缩放的原理是使控件变大，让图像再次自适应控件的大小实现视觉上的放大效果，仅需修改 `CalScaleValue()` 方法中的 `ScaleWidth` 、`ScaleHeight` 计算方式，如下；

```csharp
// double zoomValue = Delta / 100;
HTuple ScaleWidth = Width / (hv_WindowControl.Width * zoomValue);
HTuple ScaleHeight = Height / (hv_WindowControl.Height * zoomValue);
```

> 截至目前已经实现了滚轮缩放功能，但是这种缩放实际上是一次次的重绘实现的，也就是说每次重绘，图像的位置也会变，这就很影响体验了。于是想到可以加上图像偏移，使每次缩放能围绕鼠标的周围区域变化；

### 图像的拖动

> 图像的拖动就相对简单很多了，只要搞清楚 **hWindowControl** 的显示原理——那就是用`HOperatorSet.SetPart()` 方法设置显示范围，记录鼠标按下抬起的坐标，计算偏移量，在当前的坐标进行加减即可；

```csharp
double dbRowMove, dbColMove;  // 坐标偏移量
dbRowMove = startPoint.Y - endPoint.Y;  //计算光标在X轴拖动的距离
dbColMove = startPoint.X - endPoint.X;  //计算光标在Y轴拖动的距离

// ShowImage的一种重载
public void ShowImage(HTuple rowMove, HTuple columnMove)
{
    HTuple row1, column1, row2, column2;

    HOperatorSet.GetPart(HWindowControl_0.HalconWindow, out row1, out column1, out row2, out column2);  //根据HWindow控件在当前状态下显示图像的位置

    HWindowControl_0.HalconWindow.ClearWindow();  // 有重绘需要记得清空上一个窗口的图像
    HDevWindowStack.Push(HWindowControl_0.HalconWindow);
    HOperatorSet.SetPart(HDevWindowStack.GetActive(), row1 + rowMove, column1 + columnMove, row2 + rowMove, column2 + columnMove);  // 计算拖动距离调整HWindows控件显示图像的位置
    HOperatorSet.DispObj(TempImage, HDevWindowStack.GetActive());

    row1.Dispose();
    column1.Dispose();
    row2.Dispose();
    column2.Dispose();
}
```

## 最后

最近在搞halcon联合C#的时候遇到挺多坑的，例如32位与64位在可用内存上的区别，导致32位环境下总是报OOM错误。折磨了若干天后，发现是自己写的某个业务流程中初始化的图像（HObject类型）未及时Dispose()...

未来应该会有很长的时间跟Halcon与C#打交道，【Halcon】系列正式开启，这里将记录更多使用技巧以及踩坑心得;

😅