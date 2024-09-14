---
title: 【C++】std::sort 原理
date: 2024-09-14 13:18:33 +8
updated: 2024-09-14 18:22:33 +8
tags: [c++,  std::sort, algorithm, quicksort, heapsort, insertionsort, introsort]
categories: 
  - 牛排的小笔记
---

## 前言

在C++标准库中，std::sort的底层实现通常使用的是**混合排序算法**，具体来说是**introsort**（内省排序）。

introsort结合了快速排序、堆排序和插入排序的优点：

1. **快速排序**：在一般情况下，std::sort使用快速排序，因为它平均情况下有很好的时间复杂度 `O(nlogn)` 。它通过选择一个基准（pivot），然后将数组分为两部分，一部分小于基准，另一部分大于基准，然后递归排序。

2. **堆排序**：快速排序的最坏情况时间复杂度是 `O(n²)` ，为避免这一情况，当递归深度超过某个阈值时，std::sort会切换到堆排序，确保时间复杂度为 `O(nlogn)` 。

3. **插入排序**：在数组规模较小的时候，std::sort会切换为插入排序，因为在小规模数据上，插入排序效率更高。

这种组合使得std::sort在处理不同规模和不同结构的数据时，既能保持高效的平均性能，又能避免最坏情况的性能退化。

<!-- more -->

## 正文

### 快速排序 (Quick Sort)

快速排序是一种分治的排序算法，基本步骤如下：

1. 从数列中挑出一个元素，称为 `基准`（pivot）；
2. 重新排序数列，所有比基准值小的元素摆放在基准前面，所有比基准值大的元素摆放在基准后面（相同的数可以放到任一边）。在这个分区退出之后，该基准就处于数列的中间位置。这个称为分区（partition）操作；
3. 递归地（recursive）把小于基准值元素的子数列和大于基准值元素的子数列排序。

```cpp
#include <iostream>
#include <vector>

int partition(std::vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; ++j) {
        if (arr[j] < pivot) {
            ++i;
            std::swap(arr[i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(std::vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    std::vector<int> arr = {10, 7, 8, 9, 1, 5};
    int n = arr.size();
    quickSort(arr, 0, n - 1);
    
    std::cout << "Quick Sorted array: ";
    for (int x : arr) std::cout << x << " ";
    return 0;
}
```

### 堆排序 (Heap Sort)

堆排序是一种树形选择排序，它的基本思想是：将待排序序列构造成一个大顶堆，此时整个序列的最大值就是堆顶的根节点。将它移走（其实就是将它与堆数组的末尾元素交换，此时末尾元素就是最大值），然后将剩余的 n-1 个序列重新构造成一个堆，这样就会得到 n 个元素中的次大值。如此反复执行，便能得到一个有序序列。

堆排序的基本步骤如下：

1. 构造初始堆。将给定无序序列构造成一个大顶堆（或小顶堆）；
2. 将堆顶元素与末尾元素进行交换，使末尾元素最大（或最小）；
3. 然后将剩余 n-1 个元素重新构造成一个堆，这样会得到 n 个元素中的次大值；
4. 如此反复执行，便能得到一个有序序列。

```cpp
#include <iostream>
#include <vector>

void heapify(std::vector<int>& arr, int n, int i) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;

    if (left < n && arr[left] > arr[largest])
        largest = left;

    if (right < n && arr[right] > arr[largest])
        largest = right;

    if (largest != i) {
        std::swap(arr[i], arr[largest]);
        heapify(arr, n, largest);
    }
}

void heapSort(std::vector<int>& arr, int n) {
    for (int i = n / 2 - 1; i >= 0; --i)
        heapify(arr, n, i);

    for (int i = n - 1; i > 0; --i) {
        std::swap(arr[0], arr[i]);
        heapify(arr, i, 0);
    }
}

int main() {
    std::vector<int> arr = {12, 11, 13, 5, 6, 7};
    int n = arr.size();
    
    heapSort(arr, n);

    std::cout << "Heap Sorted array: ";
    for (int x : arr) std::cout << x << " ";
    return 0;
}
```

### 插入排序 (Insertion Sort)

插入排序是一种简单直观的排序算法。它的基本思想是：将一个记录插入到已经排好序的有序表中，从而得到一个新的、记录数增 1 的有序表。

插入排序的基本步骤如下：

1. 从第一个元素开始，该元素可以认为已经被排序；
2. 取出下一个元素，在已经排序的元素序列中从后向前扫描；
3. 如果该元素（已排序）大于新元素，将该元素移到下一位置；
4. 重复步骤 3，直到找到已排序的元素小于或者等于新元素的位置；
5. 将新元素插入到该位置后；
6. 重复步骤 2~5。

```cpp
#include <iostream>
#include <vector>

void insertionSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 1; i < n; ++i) {
        int key = arr[i];
        int j = i - 1;

        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            --j;
        }
        arr[j + 1] = key;
    }
}

int main() {
    std::vector<int> arr = {12, 11, 13, 5, 6};
    insertionSort(arr);

    std::cout << "Insertion Sorted array: ";
    for (int x : arr) std::cout << x << " ";
    return 0;
}
```

## 最后

End of the post.
