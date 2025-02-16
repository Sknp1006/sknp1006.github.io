---
title: 【CV】纹理特征与灰度共生矩阵
date: 2024-11-08 22:00:00 +8
updated: 2024-11-08 22:00:00 +8
tags: [Texture, GLCM, Image Processing, Computer Vision]
categories: 
  - 牛排的小教程
---

## 前言

在机器视觉中，纹理是一种图像特征，指图像中局部区域在视觉上呈现的重复或规则的图案和结构。这些图案通常不直接取决于物体的形状或边缘，而是由局部像素的排列、强度和颜色的分布决定的。纹理在物体的表面或背景上提供了丰富的信息，可以帮助算法识别物体的类别、形状、位置、表面状态等。

<!-- more -->

## 正文

### 纹理概述

#### 纹理的特征

1. **粗糙度（Roughness）**

> 粗糙度用于描述纹理表面细腻或粗糙的程度。通常，粗糙度高的图像包含更多高频分量，而平滑的图像包含更多低频分量。

- 标准差：像素灰度值的标准差反映了灰度变化的剧烈程度，变化大的区域通常被视为粗糙。
- 能量和熵：纹理的能量和熵也能用于粗糙度度量，能量高通常意味着较为均匀，而熵高则意味着不规则或粗糙。
- Tamura粗糙度：计算图像局部平均灰度值的标准差，然后进一步计算标准差的均值以表征粗糙度。Tamura粗糙度特别适合自然纹理。

2. **方向性（Directionality）**

> 方向性描述了纹理的主要方向，如果纹理具有明显的方向性（如条纹或纤维结构），这一特征可以用来检测纹理的取向。

- 傅里叶变换：通过频谱分析来检测图像中的主方向。高频成分的分布可以反映纹理的方向，方向性强的纹理在频域中表现为一个明显的方向分量。
- Gabor滤波器：Gabor滤波器对特定方向的响应值用于方向性分析，滤波响应较强的方向即为主方向。
- Tamura方向性：通过分析图像中不同像素方向的灰度变化统计方向分布，主方向的变化较少时，方向性强。

3. **对比度（Contrast）**

> 对比度描述了图像中亮和暗区域的差异，是纹理特征中常用的度量之一。高对比度意味着纹理结构清晰，低对比度则意味着纹理相对均匀。

- 方差：图像灰度值的方差可以表示对比度大小。
- Tamura对比度：定义为局部区域内灰度值的标准差与均值的比值，用于表示局部区域的亮度变化程度。

4. **规则性（Regularity）**

> 规则性描述了纹理图案的重复性和一致性，用于区分规则纹理（如织物）和随机纹理（如石头表面）。

- 熵：图像熵低通常表明纹理较为规则，熵高则表明纹理较为随机。
- 纹理重复单元（Texel）：在规则纹理中，Texel的形状和排列可以用来描述纹理的规则性。

5. **尺度（Scale）**

> 尺度描述了纹理的大小和细节程度。细尺度纹理在小范围内变化剧烈，而粗尺度纹理的变化较平缓。

- 小波变换：小波分解能够提取不同尺度的纹理特征。
- LBP特征：通过分析不同半径的LBP，可以得到不同尺度的纹理信息。

#### 纹理特征提取方法

1. **统计方法**

> 统计方法基于图像灰度值的统计特征，适用于不规则、随机性强的纹理。常见的方法有：

- 灰度共生矩阵（GLCM）：通过计算像素对之间的灰度关系来描述纹理。GLCM可以提取对比度、能量、相关性、熵等特征，用来区分不同的纹理。GLCM适合描述方向性强的纹理。
- 灰度差分统计量（GLDS）：类似于GLCM，通过统计相邻像素灰度差异来描述纹理的变化。常用特征有局部对比度和均匀度。
- 一阶和二阶统计特征：一阶特征包括图像的均值、方差、偏度和峰度等基本统计量；二阶统计特征则涉及像素之间的关系，如自相关和协方差。
- 纹理能量度量：使用如Tamura特征来度量粗糙度、对比度和方向性等属性。例如，Tamura的粗糙度特征衡量纹理的粗糙程度，而方向性特征则衡量纹理图案的主要方向。

2. **基于变换的方法**

> 基于变换的方法通过将图像转换到频域或其他特征空间来描述纹理。常用的方法有：

- 傅里叶变换：傅里叶变换用于分析图像的频率成分，可以用频谱描述纹理的周期性和方向性。高频成分往往对应细腻的纹理，低频成分则对应较粗的纹理。
- 小波变换：小波变换在时域和频域之间有较好的平衡，能有效地分析局部区域的纹理特征。小波系数包含了不同尺度和方向的信息，适用于多尺度纹理分析。
- Gabor滤波器：Gabor滤波器通过特定频率和方向的带通滤波描述图像的局部纹理。Gabor滤波器对方向性和尺度变化的纹理特征具有较好的识别效果，因此广泛用于纹理分类。

3. **结构化方法**

> 结构化方法假设纹理由基本的图案或模式重复构成，适用于具有规则结构的纹理。这些方法包括：

- 自相似性模型：假设纹理是由某种基本的模式按一定规律排列，通过统计这种模式的分布或重复规律来描述纹理。
- Texel分析：Texel（texture element，纹理单元）是一种纹理的基本重复单元。例如织物的纹理由纤维单元重复组成。Texel分析基于对基本单元的检测、统计和分布来描述纹理。
- 形态学特征：通过图像的形态学运算，如膨胀、腐蚀、开闭运算，来提取和分析纹理。形态学方法对检测纹理中的形状和大小变化较为有效。

4. **模型化方法**

>模型化方法假设图像纹理可以用数学模型或概率模型来描述，适用于不同尺度或方向的复杂纹理。常用的模型化方法包括：

- 自回归模型（AR）：假设图像中的像素灰度值满足自回归过程，通过计算模型参数来描述纹理。这类方法适用于分析统计性质较强的纹理。
- 马尔科夫随机场（MRF）：通过马尔科夫链的条件概率分布描述图像中像素之间的相互关系，适用于随机性强的纹理分析。MRF在图像分割和纹理分类中常被应用。
- 分形模型：假设自然界中的纹理具有分形特征，通过分形维数等特征量化纹理的复杂性和不规则性，常用于自然景物的纹理分析。
- 稀疏编码模型：假设纹理可以用一组稀疏的基向量表示，通过学习纹理的稀疏表示来提取特征。这类方法在深度学习中有所应用，尤其是在卷积神经网络的特征提取部分。

#### 纹理在机器视觉中的应用

1. **工业检测**

纹理分析在工业质检中应用广泛，尤其是在检测产品表面的缺陷、瑕疵和材质的一致性上。机器视觉系统可以通过分析表面纹理来快速、自动地进行质量控制。
- 表面缺陷检测：如金属、织物、玻璃等表面的裂纹、划痕、斑点等缺陷通常表现为异常的纹理。系统可以通过对比正常纹理与缺陷纹理，使用特征提取、模式匹配等方法发现异常区域。
- 一致性检测：在生产中，一些产品的表面纹理要求一致（如纺织品、皮革、木材等），不一致的纹理可能意味着产品瑕疵或材料质量不合格。纹理特征描述方法（如灰度共生矩阵、LBP）可以用于评估表面的一致性。
- 粗糙度检测：如金属加工件、陶瓷、涂层的表面需要精确的粗糙度控制，利用纹理分析可以估算表面粗糙度，从而保证加工质量。

2. **医学图像分析**

在医学影像中，纹理分析用于描述和识别人体组织的特征，帮助医生在图像中发现病变区域或标记组织结构。
- 肿瘤检测与分类：肿瘤组织与正常组织在影像纹理上常表现出不同的特征。通过提取纹理特征（如对比度、方向性、粗糙度等），可以有效区分正常组织和异常区域。
- 组织识别：纹理能反映不同组织的密度、结构等属性。例如，MRI、CT、超声图像中的纹理分析可以帮助识别器官组织结构，用于病灶定位、器官分割。
- 病理图像分析：在细胞或组织切片图像中，细胞的排列和分布常体现为特定的纹理特征，纹理分析有助于自动化的病理诊断。

3. **目标识别与分类**

在目标识别与分类任务中，纹理特征可以帮助系统识别物体类别，尤其在物体颜色、形状相近时，纹理提供了额外的区分信息。
- 物体分类：例如在自然图像中，不同材质（如木材、石头、金属、布料等）具有特定的纹理模式，通过提取这些纹理特征，视觉系统可以进行自动分类。
- 人脸识别与表情分析：面部的局部纹理（如皱纹、眼角细节）能反映年龄、表情等信息。基于局部二值模式（LBP）等方法的纹理特征提取广泛用于人脸识别。

4. **图像分割**

图像分割即将图像分成若干不同的区域。纹理特征在分割具有复杂背景或表面纹理的图像中尤为重要。
- 背景与前景分割：在复杂背景中，基于颜色或边缘的分割方法常常难以实现精确分割，而纹理分割可以有效地将背景与前景分离，例如分割自然场景中的植被区域、建筑区域等。
- 医学图像分割：在CT或MRI图像中，不同组织的纹理特征不同，通过纹理分割，可以区分不同的器官组织。特别是使用纹理能在形态不规则的病灶区域有效地进行分割。

5. **自然场景分析**

纹理特征在自然场景的图像分析中也有很多应用，如用于识别场景中的不同元素、区分环境类型等。
- 地表分类：在遥感图像分析中，地表材料（如草地、沙漠、水域、森林等）具有特定的纹理特征，通过纹理分析可以区分不同的地表类型，用于土地利用分类、灾害检测等。
- 场景识别：在自动驾驶或无人机视觉中，纹理特征用于识别道路类型、标志物等。例如，铺设的道路与自然草地或砂石路的纹理特征差异显著，通过识别纹理可以帮助系统进行环境理解。

6. **表面结构分析**

纹理分析用于描述物体的表面结构，帮助识别物体的物理特性。
- 材料分类：不同材料（如金属、陶瓷、塑料等）有不同的表面纹理，纹理分析可以用来识别物体的材料属性。在工业制造和机器人抓取应用中，纹理分析有助于判断材料的类型和表面属性，从而辅助机械操作。
- 物理属性估计：如通过纹理粗糙度估计物体的摩擦系数，预测物体是否容易滑动等，这在机器人抓取和移动任务中十分重要。

7. **纹理合成与增强现实**

在计算机图形学和增强现实中，纹理合成用于为虚拟物体添加真实感，或者在实际物体上叠加合成纹理。
- 纹理填充与增强：当图像中存在缺损区域时，可以使用周围的纹理特征来填充缺损部分，使图像显得自然完整。
- 场景仿真：在虚拟现实和增强现实中，纹理合成被广泛应用于生成具有真实感的场景。例如，为虚拟物体添加逼真的材料纹理，以增强沉浸式体验。

### 灰度共生矩阵（GLCM）

#### GLCM的定义与基本概念

1973年 Haralick 等人提出了用灰度共生矩阵来描述纹理特征，这是由于纹理是由灰度分布在空间位置上反复交替变化而形成的，因而在图像空间中相隔某距离的两个像素之间存在一定的灰度关系，称为是图像中灰度空间相关特性。

灰度共生矩阵是一个二维矩阵，用于描述图像中不同像素对之间的灰度关系。对于一个给定的图像，灰度共生矩阵的元素 $P(i, j, d, \theta)$ 表示在距离 $d$ 和方向 $\theta$ 上，灰度级 $i$ 和 $j$ 之间的像素对出现的概率。通常，灰度共生矩阵是对称的，即 $P(i, j, d, \theta) = P(j, i, d, \theta)$。

灰度共生矩阵的计算过程如下：

1. 选择一个图像 $I$ 和一组灰度级 $G = \{g_1, g_2, \ldots, g_N\}$。
2. 选择一个距离 $d$ 和一个方向 $\theta$。
3. 对于图像中的每个像素 $(x, y)$，计算与其距离为 $d$、方向为 $\theta$ 的像素 $(x', y')$ 的灰度对 $(I(x, y), I(x', y'))$。
4. 统计每个灰度对 $(g_i, g_j)$ 出现的次数，得到灰度共生矩阵 $P(i, j, d, \theta)$。
5. 根据灰度共生矩阵计算纹理特征，如对比度、能量、相关性、熵等。
6. 重复步骤 2-5，选择不同的距离和方向，得到多个灰度共生矩阵。

伪代码如下：

1. 输入：图像 I，灰度级 G，距离 d，方向 θ
2. 初始化灰度共生矩阵 P 为零矩阵
3. 对于图像中的每个像素 (x, y)：
a. 计算像素 (x, y) 的灰度值 I(x, y)
b. 计算距离为 d、方向为 θ 的像素 (x', y') 的灰度值 I(x', y')
c. 增加 P(I(x, y), I(x', y')) 的计数
4. 归一化灰度共生矩阵 P
5. 输出：灰度共生矩阵 P


#### GLCM的特征

1. **对比度 (Contrast)**

- 定义：衡量图像中像素灰度值之间的差异程度，反映图像的清晰度和灰度的变化剧烈程度。
- 物理意义：对比度越大，说明图像的纹理差异越明显，局部灰度变化越剧烈。
- 计算公式：

$$
\text{Contrast} = \sum_{i,j} (i - j)^2 \, p(i, j)
$$

- 应用场景：适用于检测边缘较多的纹理（例如纺织品、自然场景等）。

2. **熵 (Entropy)**

- 定义：表示图像纹理的复杂度和随机性，反映图像的无序程度。
- 物理意义：熵越高，说明图像中的纹理越复杂，信息量越大；熵低则表示图像纹理较为简单或均匀。
- 计算公式：

$$
\text{Entropy} = - \sum_{i,j} p(i, j) \, \log(p(i, j) + \epsilon)
$$

（其中 $\epsilon$ 是一个小的常数，用于防止对数零问题）

- 应用场景：适用于区分纹理较为复杂的场景，例如检测不同材料的纹理。

3. **同质性 (Homogeneity)**

- 定义：测量图像纹理的平滑程度，衡量像素对之间灰度值是否接近。
- 物理意义：同质性值高的图像通常具有较为平滑的纹理，而同质性低表示图像中的灰度差异大。
- 计算公式：

$$
\text{Homogeneity} = \sum_{i,j} \frac{p(i, j)}{1 + |i - j|}
$$

- 应用场景：适合用于检测平滑的表面或均匀的纹理，例如均匀光滑的材料表面。

4. **相关性 (Correlation)**

- 定义：衡量相邻像素对之间的灰度相关程度，反映像素值之间的线性关系。
- 物理意义：较高的相关性表示纹理方向一致，像素值呈现一定的线性变化；相关性低则表示纹理较为随机。
- 计算公式：

$$
\text{Correlation} = \sum_{i,j} \frac{(i - \mu_i) \cdot (j - \mu_j) \cdot p(i, j)}{\sigma_i \cdot \sigma_j}
$$

$$
\mu_i = \sum_{i} i \sum_{j} p(i, j) \quad , \quad \mu_j = \sum_{j} j \sum_{i} p(i, j)
$$

$$
\sigma_i = \sqrt{\sum_{i} (i - \mu_i)^2 \sum_{j} p(i, j)} \quad , \quad \sigma_j = \sqrt{\sum_{j} (j - \mu_j)^2 \sum_{i} p(i, j)}
$$

$\mu_i$ 是行的均值、$\mu_j$ 是列的均值。

$\sigma_i$ 是行的标准差、$\sigma_j$ 是列的标准差。

- 应用场景：多用于有方向性纹理的检测，如织物或结构性材料。

5. **能量 (Energy)**

- 定义：表示纹理的重复性和平滑度，是GLCM中所有元素的平方和。有时也被称为角二阶矩 (Angular Second Moment, ASM)
- 物理意义：能量值越高，说明图像中的灰度分布越均匀，结构越规则。
- 计算公式：

$$
\text{Energy} = \sum_{i,j} p(i, j)^2
$$

- 应用场景：适合平滑或重复性强的纹理分析，比如规则排列的材料。

6. **最大概率 (Maximum Probability)**

- 定义：表示GLCM中出现频率最高的灰度级对的概率。
- 物理意义：最大概率值越高，说明图像中存在显著的、重复出现的灰度值对。
- 计算公式：

$$
\text{Maximum Probability} = \max(p(i, j))
$$

- 应用场景：用于分析纹理中最显著的灰度级关系。

7. **逆方差 (Inverse Difference Moment)**

- 定义：类似于同质性，反映相邻灰度对之间的差异，平滑图像的逆方差值较高。
- 物理意义：值高说明纹理变化较小、图像平滑；值低则表示纹理较粗糙。
- 计算公式：

$$
\text{Inverse Difference Moment} = \sum_{i,j} \frac{p(i, j)}{1 + (i - j)^2}
$$

- 应用场景：多用于分析细致或均匀纹理。

### 代码实现

见 [https://github.com/Sknp1006/Project-CV/tree/dev/src/glcm](https://github.com/Sknp1006/Project-CV/tree/dev/src/glcm) 

## 最后

The end.

