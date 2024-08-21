---
title: 【C++】关于 cv::Mat 的几种传参方式
date: 2024-08-21 23:22:33 +8
updated: 2024-08-21 23:22:33 +8
tags: [c++, opencv, cv::Mat]
categories: 
  - 牛排的小笔记
---

## 前言

`cv::Mat` 是 OpenCV 中最常用的数据结构之一，本文主要介绍 `cv::Mat` 的几种传参方式。

在开始之前要说明一下 `cv::Mat` 的结构，根据官方文档——Mat基本上是一个具有两个数据部分的类：矩阵头（包含诸如矩阵大小、用于存储的方法、存储矩阵的地址等信息）和指向包含矩阵的指针像素值（根据选择的存储方法采用任何维度）。矩阵头大小是恒定的，但是矩阵本身的大小可能因图像而异，并且通常会大几个数量级。

由于矩阵的一些特性，在传参时会有意料之外的结果。

<!-- more -->

## 正文

### 背景说明

::: en
OpenCV is an image processing library. It contains a large collection of image processing functions. To solve a computational challenge, most of the time you will end up using multiple functions of the library. Because of this, passing images to functions is a common practice. We should not forget that we are talking about image processing algorithms, which tend to be quite computational heavy. The last thing we want to do is further decrease the speed of your program by making unnecessary copies of potentially large images.
:::

::: zh-CN
OpenCV 是一个图像处理库。它包含大量图像处理功能。为了解决计算挑战，大多数时候您最终会使用库的多个函数。因此，将图像传递给函数是一种常见的做法。我们不应该忘记，我们正在谈论图像处理算法，这些算法往往计算量很大。我们最不想做的就是通过对可能很大的图像进行不必要的复制来进一步降低程序的速度。
:::

::: en
To tackle this issue OpenCV uses a reference counting system. The idea is that each Mat object has its own header, however a matrix may be shared between two Mat objects by having their matrix pointers point to the same address. Moreover, the copy operators will only copy the headers and the pointer to the large matrix, not the data itself.
:::

::: zh-CN
为了解决这个问题，OpenCV 使用了 **引用计数系统** 。这个想法是每个Mat对象都有自己的标头，但是可以通过让两个Mat对象的矩阵指针指向相同的地址来共享矩阵。此外，复制运算符只会复制标头和指向大矩阵的指针，而不是数据本身。
:::

```cpp
Mat A, C; // creates just the header parts
A = imread(argv[1], IMREAD_COLOR); // here we'll know the method used (allocate matrix)
 
Mat B(A); // Use the copy constructor
 
C = A; // Assignment operator
```

::: en
All the above objects, in the end, point to the same single data matrix and making a modification using any of them will affect all the other ones as well. In practice the different objects just provide different access methods to the same underlying data. Nevertheless, their header parts are different. The real interesting part is that you can create headers which refer to only a subsection of the full data. For example, to create a region of interest (ROI) in an image you just create a new header with the new boundaries:
:::

::: zh-CN
所有上述对象最终指向同一个数据矩阵，使用任何一个对象进行修改都会影响所有其他对象。实际上，不同的对象只是提供了对相同基础数据的不同访问方法。然而，它们的标头部分是不同的。真正有趣的部分是，您可以创建仅引用完整数据的子部分的标头。例如，要在图像中创建感兴趣区域（ROI），只需使用新边界创建一个新标头：
:::

```cpp
Mat D (A, Rect(10, 10, 100, 100) ); // using a rectangle
Mat E = A(Range::all(), Range(1,3)); // using row and column boundaries
```

::: en
Now you may ask – if the matrix itself may belong to multiple Mat objects, who takes responsibility for cleaning it up when it's no longer needed? The short answer is: the last object that used it. This is handled by using a reference counting mechanism. Whenever somebody copies a header of a Mat object, a counter is increased for the matrix. Whenever a header is cleaned, this counter is decreased. When the counter reaches zero the matrix is freed. Sometimes you will want to copy the matrix itself too, so OpenCV provides cv::Mat::clone() and cv::Mat::copyTo() functions.
:::

::: zh-CN
现在您可能会问 - 如果矩阵本身可能属于多个Mat对象，那么在不再需要时谁负责清理它？简短的答案是：最后一个使用它的对象。这是通过使用引用计数机制来处理的。每当有人复制Mat对象的标头时，矩阵的计数器就会增加。每当清除标头时，此计数器就会减少。当计数器达到零时，矩阵将被释放。有时您还需要复制矩阵本身，因此OpenCV提供了cv::Mat::clone()和cv::Mat::copyTo()函数。
:::

```cpp
Mat F = A.clone();
Mat G;
A.copyTo(G);
```

::: en
Now modifying F or G will not affect the matrix pointed to by the A's header. What you need to remember from all this is that:
:::

::: zh-CN
现在修改F或G将不会影响A标头指向的矩阵。从这一切中你需要记住的是：
:::

::: en
Output image allocation for OpenCV functions is automatic (unless specified otherwise).
:::

::: zh-CN
OpenCV 函数的输出图像分配是自动的（除非另有说明）。
:::

::: en
You do not need to think about memory management with OpenCV's C++ interface.
:::

::: zh-CN
使用 OpenCV 的 C++ 接口，您无需考虑内存管理。
:::

::: en
The assignment operator and the copy constructor only copy the header.
:::

::: zh-CN
赋值运算符和复制构造函数仅复制标头。
:::

::: en
The underlying matrix of an image may be copied using the cv::Mat::clone() and cv::Mat::copyTo() functions.
:::

::: zh-CN
可以使用cv::Mat::clone()和cv::Mat::copyTo()函数复制图像的基础矩阵。
:::

### 实验过程

说了上面一堆，我们了解到在复制 **矩阵头** 时，矩阵本身并没有被复制，只是指针指向了同一个地址。

测试代码如下:

```cpp
#include <iostream>
#include <opencv2/opencv.hpp>

/// @brief 值传递
/// @param InMat 
void fun_1(cv::Mat InMat)
{
    std::cout << "InMat head pointer: " << &InMat << std::endl;
    std::cout << "InMat.data before: " << (void*)InMat.data << std::endl;
    InMat.at<uchar>(0, 0) = 100;
    std::cout << "InMat.data after: " << (void*)InMat.data << std::endl;
}
/// @brief 引用传递
/// @param InMat 
void fun_2(cv::Mat& InMat)
{
    std::cout << "InMat head pointer: " << &InMat << std::endl;
    std::cout << "InMat.data before: " << (void*)InMat.data << std::endl;
    InMat.at<uchar>(0, 0) = 100;
    std::cout << "InMat.data after: " << (void*)InMat.data << std::endl;
}

int main(int argc, char* argv[])
{
    cv::Mat orig_img = cv::Mat::ones(3, 3, CV_8UC1);
    std::cout << "orig_img head pointer: " << &orig_img << std::endl;
    std::cout << "orig_img.data: " << (void*)orig_img.data << std::endl;

    fun_1(orig_img);
    fun_2(orig_img);
    return 0;
}
```

运行结果如下:

```bash
orig_img head pointer: 0x16b107040
orig_img.data: 0x12f72dec0

# fun_1
InMat head pointer: 0x16b106e70
InMat.data before: 0x12f72dec0
InMat.data after: 0x12f72dec0

# fun_2
InMat head pointer: 0x16b107040
InMat.data before: 0x12f72dec0
InMat.data after: 0x12f72dec0
```

从结果可以看出，`InMat` 的头指针在 `fun_1` 和 `fun_2` 中的地址是不同的，但是 `InMat.data` 的地址是相同的，说明在值传递的情况下，`InMat` 的头指针是被复制了的，但是由于 **引用计数系统** 的特性，`InMat.data` 部分是共享的。

 Opencv 的初学者可能会看到一篇讲 `cv::Mat`、`cv::Mat&`、`const cv::Mat`、`const cv::Mat&` 传参方式的文章，那篇文章纯属误人子弟。从上面的 `cv::Mat`、`cv::Mat&` 的实验结果可以看到，由于矩阵的共享，在函数内部修改 `InMat` 的值，都会影响到原始的 `orig_img`。

至于 `const cv::Mat`、`const cv::Mat&` 的传参方式呢？在 const 的修饰下，当尝试修改 `InMat` 的值时，编译器会报错:

```bash
关于Mat的几种传递方式的区别.cpp:10:27: error: cannot assign to return value because function 'at<unsigned char>' returns a const value
    InMat.at<uchar>(0, 0) = 100;
    ~~~~~~~~~~~~~~~~~~~~~ ^
/opt/opencv/include/opencv4/opencv2/core/mat.inl.hpp:905:7: note: function 'at<unsigned char>' which returns const-qualified type 'const unsigned char &' declared here
const _Tp& Mat::at(int i0, int i1) const
      ^~~~
```

### 总结

事实证明，实践是检验真理的唯一标准。

作为开发者要脚踏实地，不要被一些文章误导，要多动手实践，多思考，多总结。
