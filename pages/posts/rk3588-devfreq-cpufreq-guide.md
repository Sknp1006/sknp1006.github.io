---
title: 【RK3588】关于 devfreq 和 cpufreq 的记录
date: 2024-08-28 21:26:02
updated: 2024-08-28 21:26:02
tags: [aarch64, rk3588, devfreq, cpufreq, linux, nanopi-r6s]
categories: 
  - 牛排的小教程
---

## 前言

本文主要介绍了 `/sys/class/devfreq` 和 `/sys/devices/system/cpu/cpufreq` 目录，以及如何手动管理和监控设备频率和 CPU 频率。同时提供了简单的 Python 脚本，用于打印设备和 CPU 的频率信息。

环境信息：

- 硬件：Friendly NanoPi-R6S
- 固件：rk3588-usb-debian-bullseye-minimal-6.1-arm64-20240131

部分内容由 `Github Copilot` 自动生成，仅供参考。

<!-- more -->

## 正文

### `/sys/class/devfreq` 是什么目录？

`/sys/class/devfreq` 是 Linux 系统中的一个虚拟文件系统目录，用于管理和监控设备频率（Device Frequency）。`devfreq` 是 Linux 内核中的一个子系统，类似于 `cpufreq`，但它不仅限于 CPU，还可以用于其他设备，如 GPU、内存控制器等。

#### 主要功能

- **动态频率调整**：`devfreq` 子系统允许根据设备的负载动态调整设备的工作频率，以实现性能和功耗之间的平衡。
- **监控设备频率**：提供接口来监控设备的当前频率、最小和最大频率等信息。

#### 目录结构

在 `/sys/class/devfreq` 目录下，每个受 `devfreq` 管理的设备都会有一个子目录。每个子目录中包含多个文件，用于配置和监控设备频率。例如：

- `cur_freq`：当前设备频率。
- `min_freq`：设备允许的最小频率。
- `max_freq`：设备允许的最大频率。
- `available_governors`：可用的频率调节策略（governors）。
- `governor`：当前使用的频率调节策略。

#### 查看设备信息

可以通过读取 `/sys/class/devfreq` 目录下的文件，来查看设备的频率信息。以下是一个简单的 Python 脚本，用于打印设备的频率信息。

```python
import os

def read_file(file_path):
    try:
        with open(file_path, 'r') as file:
            return file.read().strip()
    except IOError:
        return None

def print_devfreq_info(devfreq_path):
    print(f"设备: {os.path.basename(devfreq_path)}")
    
    cur_freq = read_file(os.path.join(devfreq_path, 'cur_freq'))
    min_freq = read_file(os.path.join(devfreq_path, 'min_freq'))
    max_freq = read_file(os.path.join(devfreq_path, 'max_freq'))
    governor = read_file(os.path.join(devfreq_path, 'governor'))
    available_governors = read_file(os.path.join(devfreq_path, 'available_governors'))

    print(f"  当前频率: {cur_freq} Hz")
    print(f"  最小频率: {min_freq} Hz")
    print(f"  最大频率: {max_freq} Hz")
    print(f"  当前调节策略: {governor}")
    print(f"  可用调节策略: {available_governors}")
    print()

def main():
    devfreq_root = '/sys/class/devfreq'
    
    if not os.path.exists(devfreq_root):
        print(f"{devfreq_root} 目录不存在")
        return
    
    for device in os.listdir(devfreq_root):
        devfreq_path = os.path.join(devfreq_root, device)
        if os.path.isdir(devfreq_path):
            print_devfreq_info(devfreq_path)

if __name__ == "__main__":
    main()
```

运行该脚本，可以打印出设备的频率信息。例如：

```bash
设备: fdab0000.npu
  当前频率: 1000000000 Hz
  最小频率: 300000000 Hz
  最大频率: 1000000000 Hz
  当前调节策略: rknpu_ondemand
  可用调节策略: rknpu_ondemand dmc_ondemand userspace powersave performance simple_ondemand

设备: fb000000.gpu
  当前频率: 300000000 Hz
  最小频率: 300000000 Hz
  最大频率: 1000000000 Hz
  当前调节策略: simple_ondemand
  可用调节策略: rknpu_ondemand dmc_ondemand userspace powersave performance simple_ondemand

设备: dmc
  当前频率: 528000000 Hz
  最小频率: 528000000 Hz
  最大频率: 2112000000 Hz
  当前调节策略: dmc_ondemand
  可用调节策略: rknpu_ondemand dmc_ondemand userspace powersave performance simple_ondemand
```

#### 手动修改设备频率

**手动设置 npu 频率** 

```bash
# 设置 governor 为 userspace
echo userspace > /sys/class/devfreq/fdab0000.npu/governor

# 设置频率为 1GHz
echo 1000000000 > /sys/class/devfreq/fdab0000.npu/userspace/set_freq

# 查看当前频率
cat /sys/class/devfreq/fdab0000.npu/cur_freq
```

**手动设置 gpu 频率** 

```bash
# 设置 governor 为 userspace
echo userspace > /sys/class/devfreq/fb000000.gpu/governor

# 设置频率为 500MHz
echo 400000000 > /sys/class/devfreq/fb000000.gpu/userspace/set_freq

# 查看当前频率
cat /sys/class/devfreq/fb000000.gpu/cur_freq
```

**手动设置 dmc 频率** 

```bash
# 设置 governor 为 userspace
echo userspace > /sys/class/devfreq/dmc/governor

# 设置频率为 1GHz
echo 1000000000 > /sys/class/devfreq/dmc/userspace/set_freq

# 查看当前频率
cat /sys/class/devfreq/dmc/cur_freq
```

### `/sys/devices/system/cpu/cpufreq` 是什么目录？

`/sys/devices/system/cpu/cpufreq` 是 Linux 系统中的一个虚拟文件系统目录，用于管理和监控 CPU 频率（CPU Frequency）。`cpufreq` 是 Linux 内核中的一个子系统，专门用于动态调整 CPU 的工作频率，以实现性能和功耗之间的平衡。

#### 主要功能

- **动态频率调整** ：`cpufreq` 子系统允许根据 CPU 的负载动态调整 CPU 的工作频率，以优化性能和功耗。
- **监控 CPU 频率** ：提供接口来监控 CPU 的当前频率、最小和最大频率等信息。

#### 目录结构

在 `/sys/devices/system/cpu/cpufreq` 目录下，每个 CPU 都会有一个子目录。每个子目录中包含多个文件，用于配置和监控 CPU 频率。例如：

- `affected_cpus` ：列出受此策略影响的 CPU 核心。
- `related_cpus` ：列出与此策略相关的 CPU 核心。
- `scaling_cur_freq` ：当前 CPU 频率。
- `scaling_min_freq` ：CPU 允许的最小频率。
- `scaling_max_freq` ：CPU 允许的最大频率。
- `scaling_governor` ：当前使用的频率调节策略（governor）。
- `scaling_available_governors` ：可用的频率调节策略。
- `cpuinfo_cur_freq` ：当前 CPU 频率（从硬件读取）。
- `cpuinfo_min_freq` ：CPU 支持的最小频率。
- `cpuinfo_max_freq` ：CPU 支持的最大频率。

#### 查看 CPU 信息

可以通过读取 `/sys/devices/system/cpu/cpufreq` 目录下的文件，来查看 CPU 的频率信息。以下是一个简单的 Python 脚本，用于打印 CPU 的频率信息。

```python
import os

def read_file(file_path):
    try:
        with open(file_path, 'r') as file:
            return file.read().strip()
    except IOError:
        return None

def print_policy_info(policy_path):
    print(f"Policy: {os.path.basename(policy_path)}")
    
    affected_cpus = read_file(os.path.join(policy_path, 'affected_cpus'))
    related_cpus = read_file(os.path.join(policy_path, 'related_cpus'))
    cur_freq = read_file(os.path.join(policy_path, 'scaling_cur_freq'))
    min_freq = read_file(os.path.join(policy_path, 'scaling_min_freq'))
    max_freq = read_file(os.path.join(policy_path, 'scaling_max_freq'))
    governor = read_file(os.path.join(policy_path, 'scaling_governor'))
    available_governors = read_file(os.path.join(policy_path, 'scaling_available_governors'))

    print(f"  受影响的 CPU 核心: {affected_cpus}")
    print(f"  相关的 CPU 核心: {related_cpus}")
    print(f"  当前频率: {cur_freq} Hz")
    print(f"  最小频率: {min_freq} Hz")
    print(f"  最大频率: {max_freq} Hz")
    print(f"  当前调节策略: {governor}")
    print(f"  可用调节策略: {available_governors}")
    print()

def main():
    cpufreq_root = '/sys/devices/system/cpu/cpufreq'
    
    if not os.path.exists(cpufreq_root):
        print(f"{cpufreq_root} 目录不存在")
        return
    
    for policy in os.listdir(cpufreq_root):
        policy_path = os.path.join(cpufreq_root, policy)
        if os.path.isdir(policy_path):
            print_policy_info(policy_path)

if __name__ == "__main__":
    main()

```

运行该脚本，可以打印出 CPU 的频率信息。例如：

```bash
Policy: policy6
  受影响的 CPU 核心: 6 7
  相关的 CPU 核心: 6 7
  当前频率: 2304000 Hz
  最小频率: 408000 Hz
  最大频率: 2304000 Hz
  当前调节策略: ondemand
  可用调节策略: conservative ondemand userspace powersave performance schedutil

Policy: policy4
  受影响的 CPU 核心: 4 5
  相关的 CPU 核心: 4 5
  当前频率: 600000 Hz
  最小频率: 408000 Hz
  最大频率: 2304000 Hz
  当前调节策略: ondemand
  可用调节策略: conservative ondemand userspace powersave performance schedutil

Policy: policy0
  受影响的 CPU 核心: 0 1 2 3
  相关的 CPU 核心: 0 1 2 3
  当前频率: 1800000 Hz
  最小频率: 1800000 Hz
  最大频率: 1800000 Hz
  当前调节策略: performance
  可用调节策略: conservative ondemand userspace powersave performance schedutil
```

#### 手动修改 CPU 频率

**手动设置 CPU0 频率** 

```bash
# 设置 governor 为 userspace
echo userspace > /sys/devices/system/cpu/cpufreq/policy0/scaling_governor

# 设置频率为 1.8GHz
echo 1800000 > /sys/devices/system/cpu/cpufreq/policy0/scaling_setspeed

# 查看当前频率
cat /sys/devices/system/cpu/cpufreq/policy0/scaling_cur_freq
```

其他 CPU 核心的设置方法类似，只需替换 `policy0` 为相应的目录名即可。

## 最后

通过以上步骤，我们可以手动调整 RK3588 平台上 CPU 的频率，以满足不同的性能需求。希望这篇指南对你有所帮助。如果有任何问题或建议，欢迎反馈。感谢阅读！
