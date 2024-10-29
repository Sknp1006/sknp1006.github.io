---
title: 【CUDA】std::vector Allocator
date: 2024-10-29 19:34:33 +8
updated: 2024-10-29 19:34:33 +8
tags: [c++, std::vector, CUDA, Allocator]
categories: 
  - 牛排的小笔记
---

## 前言

最近在跟着 [小彭老师的 CUDA 课程](https://www.bilibili.com/video/BV16b4y1E74f) 学习时，发现了一个平时很少用到的 vector 的功能，那就是自定义内存分配器。

通过查看 [cppreference](https://zh.cppreference.com/w/cpp/container/vector)，发现 vector 的构造函数有两个形参，一个是 T 类型的对象，另一个是 Allocator 类型的对象, 其中 Allocator 默认为 [`std::allocator<T>`](https://zh.cppreference.com/w/cpp/memory/allocator): 

```cpp
template<
    class T,
    class Allocator = std::allocator<T>
> class vector;
```

在往 vector 中插入元素时，会调用 Allocator 的 allocate 函数来分配内存，移除元素时会调用 deallocate 函数来释放内存。

<!-- more -->

## 正文

### CUDA的内存分配

1. 通常在CPU上分配内存时，我们使用 `malloc` 函数来分配内存。

```cpp
int *pret = (int *)malloc(sizeof(int) * 10);
free(pret);
```

2. CUDA分配的内存是在GPU上的，所以我们需要使用 `cudaMalloc` 函数来分配内存。

```cpp
#include <cuda_runtime.h>

int main()
{
    int *pret;
    cudaMalloc(&pret, sizeof(int) * 10);
    cudaFree(pret);
    return 0;
}
```

3. CPU内存和GPU内存不互通，那么我们如何将GPU内存的数据拷贝到CPU内存呢？这就需要使用 `cudaMemcpy` 函数。

```cpp
#include <cstdio>
#include <cuda_runtime.h>

__global__ void pret_kernel(int *pret) { 
    *pret = 42;
}

int main()
{
    // 使用 cudaMalloc + cudaMemcpy 从显存拷贝到内存
    int ret = 0;
    int *pret;
    cudaMalloc(&pret, sizeof(int));
    pret_kernel<<<1, 1>>>(pret);
    // cudaDeviceSynchronize();  // cudaMemcpy 会自动同步, 此处可以省略
    cudaMemcpy(&ret, pret, sizeof(int), cudaMemcpyDeviceToHost);  // 使用 cudaMemcpy 从显存拷贝到内存
    printf("result = %d\n", ret);
    //printf -> (result = 42)
    cudaFree(pret);
}
```

4. 除了使用 `cudaMalloc` 函数分配内存，我们还可以使用 `cudaMallocManaged` 函数分配统一内存。

```cpp
#include <cstdio>
#include <cuda_runtime.h>

__global__ void pret_kernel(int *pret) { 
    *pret = 42;
}

int main()
{
    int *pret;
    cudaMallocManaged(&pret, sizeof(int));
    pret_kernel<<<1, 1>>>(pret);
    cudaDeviceSynchronize();  // 由于没有了 cudaMemcpy,需要显式同步
    printf("result = %d\n", *pret);
    //printf -> (result = 42)
    cudaFree(pret);
}
```

### 自定义 CudaAllocator

由于CPU内存和GPU内存不互通，当我们在使用 vector 时，可以通过自定义 CudaAllocator 来实现在GPU上分配内存。

```cpp
#include <cstdio>
#include <cuda_runtime.h>
#include <vector>

template<class T>
struct CudaAllocator {
    using value_type = T;
    T *allocate(size_t n) {
        T *ptr = nullptr;
        cudaMallocManaged(&ptr, n * sizeof(T));
        return ptr;
    }

    void deallocate(T *ptr, size_t n) {
        cudaFree(ptr);
    }

    /**
     * @brief vector在初始化时会调用所有元素的无参构造函数，使用construct函数以跳过无参构造（避免初始化为0）
     * 这样可以避免在CPU上低效的零初始化，提高性能
     * 
     * is_pod_v 是一个C++17的特性，用于判断一个类型是否是POD类型（Plain Old Data）例如：int, float, char, struct A {int a; float b;}等
     */
    template<class... Args>
    void construct(T *ptr, Args &&... args) {
        if constexpr (!(sizeof...(Args) == 0 && std::is_pod_v<T>)) {
            // 无参且是POD类型的反，即有参或不是POD类型便调用构造函数
            ::new((void *)ptr) T(std::forward<Args>(args)...);
        }
    }
};

__global__ void kernel(int *arr, int n) {
    for (int i = blockDim.x * blockIdx.x + threadIdx.x; i < n; i += blockDim.x * gridDim.x)  // 网格跨步循环
    {
        arr[i] = i;
    }
}

int main() 
{
    int n = 65536;
    std::vector<int, CudaAllocator<int>> arr(n);

    kernel<<<32, 128>>>(arr.data(), n);
    cudaDeviceSynchronize();
    for (int i = 0; i < n; i++) {
        printf("arr[%d] = %d\n",i, arr[i]);
    }
    //printf -> (arr[0] = 0, arr[1] = 1, arr[2] = 2, ..., arr[65535] = 65535)
}
```

### 关于thrust提供的vector

CUDA其实提供了一个类似于STL的库，叫做 [thrust](https://developer.nvidia.com/thrust)。

Thrust 是一个强大的并行算法和数据结构库。 Thrust 为 GPU 编程提供了灵活的高级接口，极大地提高了开发人员的工作效率。使用 Thrust，C++ 开发人员只需编写几行代码即可执行 GPU 加速的排序、扫描、转换和归约操作，速度比最新的多核 CPU 快几个数量级。例如，thrust::sort 算法的排序性能比 STL 和 TBB 快 5 倍到 100 倍。

他提供了三种不同的vector类型，分别是 `thrust::host_vector`, `thrust::device_vector`, `thrust::unified_vector`。

```cpp
#include <thrust/universal_vector.h>
#include <thrust/device_vector.h>
#include <thrust/host_vector.h>
```

其中 `thrust::universal_vector` 是一个统一内存的vector，效果与 `std::vector` + `CudaAllocator` 类似。

`thrust::host_vector` 是在CPU上分配内存。

`thrust::device_vector` 是在GPU上分配内存。

通过赋值操作，可以实现 `host_vector` 和 `device_vector` 之间的数据拷贝。

更多关于 `thrust` 暂且不展开，有兴趣的可以自行查阅。

## 总结

以上便是关于如何自定义 CudaAllocator 的内容，不得不佩服C++ STL的设计之美，在设计之初便考虑到了自定义内存分配器的需求，使得我们可以在不改变原有代码的情况下，实现自定义内存分配器，提高代码的可复用性和性能。

类似的，STL的其他容器也可以通过自定义分配器来实现自定义内存分配，例如 `std::map`, `std::set`, `std::list` 等。
