---
title: 【交叉编译】教程
hide: true
date: 2023-12-21 20:25:45
updated: 2023-12-21 20:25:45
tags: [交叉编译, cross-compile, C++, C, aarch64, x86_64]

categories: 
  - 牛排的小教程
---

## 前言

这是一期C/C++交叉编译相关的入门教程，希望对读者有所帮助～

<!-- more -->

## 正文

### 一、什么是编译？

编译是将源代码（人类可读的高级语言）转换为机器代码（计算机可执行的低级语言）的过程。这个过程通常由编译器完成，它会检查源代码的语法错误，进行优化，并最终生成可执行文件。这个过程可以分为几个阶段，包括预处理、词法分析、语法分析、语义分析、中间代码生成、代码优化和目标代码生成。

C/C++的编译是将C/C++源代码转换为机器代码的过程。这个过程通常由C/C++编译器（如GCC或Clang）完成，它会检查源代码的语法错误，进行优化，并最终生成可执行文件。这个过程可以分为以下几个阶段：

1. **预处理**：处理源代码中的预处理指令，如`#include`，`#define`等；
2. **编译**：将预处理后的源代码转换为汇编代码；
3. **汇编**：将汇编代码转换为目标代码（机器代码）；
4. **链接**：将多个目标代码文件链接在一起，生成最终的可执行文件；

### 二、什么是交叉编译？

交叉编译是一种编译方法，它允许开发者在一个类型的系统（称为主机Host）上编译出在另一个不同类型的系统（称为目标Target）上运行的代码。编译是将源代码转换为机器代码的过程，而交叉编译是在一个系统上编译出在另一个系统上运行的代码。

编译生成的机器代码是与特定的硬件平台相关的，因此如果你需要在一个不同的硬件平台上运行相同的程序，你需要重新编译该程序。而交叉编译允许开发者在一个系统上为另一个系统编译程序，从而避免了在目标系统上进行编译的限制。

对于嵌入式系统开发，交叉编译特别重要，因为这些系统的硬件资源有限，无法在其上进行完整的编译过程。通过交叉编译，开发者可以在资源丰富的系统上为嵌入式系统生成可在其上运行的代码。

### 三、如何编译？

#### 3.1 交叉编译工具

交叉编译工具目录结构：

```
```

