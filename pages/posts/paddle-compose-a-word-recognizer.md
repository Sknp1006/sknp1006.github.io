---
title: 【Paddle】用docker打包paddle文字识别服务
date: 2021-11-23 18:16:02
tags: [docker, paddle]
categories: 
  - 牛排的小教程
---

## 前言

少废话，今天来搭基于paddle的 `chinese_ocr_db_crnn_server` 模型的文字识别服务，力求开箱即用...

<!-- more -->

## 正文

### 认识docker

**基础知识：** 

- [Docker--从入门到实践](https://yeasy.gitbook.io/docker_practice/) 
- [Docker--菜鸟教程](https://www.runoob.com/docker/docker-tutorial.html) 
- [Docker--W3Cschool](https://www.w3cschool.cn/docker/) 

**其他知识：**

- [Docker镜像详解（分层理解）](https://blog.csdn.net/myjess/article/details/109380948) 

### 构建镜像

#### 编写Dockerfile

> 构建的Dockerfile代码可以在github的 [anaconda仓库](https://github.com/ContinuumIO/docker-images) 中找到，这里它基础上做些客制化；

```dockerfile
FROM ubuntu

LABEL maintainer="SKNP"

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8

# hadolint ignore=DL3008
RUN apt-get update -q && \
    apt-get install -q -y --no-install-recommends \
        bzip2 \
        ca-certificates \
        git \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
        mercurial \
        openssh-client \
        procps \
        subversion \
        wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV PATH /opt/conda/bin:$PATH

# Leave these args here to better use the Docker build cache
ARG CONDA_VERSION=py39_4.10.3

RUN set -x && \
    UNAME_M="$(uname -m)" && \
    if [ "${UNAME_M}" = "x86_64" ]; then \
        MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-${CONDA_VERSION}-Linux-x86_64.sh"; \
        SHA256SUM="1ea2f885b4dbc3098662845560bc64271eb17085387a70c2ba3f29fff6f8d52f"; \
    elif [ "${UNAME_M}" = "s390x" ]; then \
        MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-${CONDA_VERSION}-Linux-s390x.sh"; \
        SHA256SUM="1faed9abecf4a4ddd4e0d8891fc2cdaa3394c51e877af14ad6b9d4aadb4e90d8"; \
    elif [ "${UNAME_M}" = "aarch64" ]; then \
        MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-${CONDA_VERSION}-Linux-aarch64.sh"; \
        SHA256SUM="4879820a10718743f945d88ef142c3a4b30dfc8e448d1ca08e019586374b773f"; \
    elif [ "${UNAME_M}" = "ppc64le" ]; then \
        MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-${CONDA_VERSION}-Linux-ppc64le.sh"; \
        SHA256SUM="fa92ee4773611f58ed9333f977d32bbb64769292f605d518732183be1f3321fa"; \
    fi && \
    wget "${MINICONDA_URL}" -O miniconda.sh -q && \
    echo "${SHA256SUM} miniconda.sh" > shasum && \
    if [ "${CONDA_VERSION}" != "latest" ]; then sha256sum --check --status shasum; fi && \
    mkdir -p /opt && \
    sh miniconda.sh -b -p /opt/conda && \
    rm miniconda.sh shasum && \
    ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \
    echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc && \
    echo "conda activate base" >> ~/.bashrc && \
    find /opt/conda/ -follow -type f -name '*.a' -delete && \
    find /opt/conda/ -follow -type f -name '*.js.map' -delete && \
    /opt/conda/bin/conda clean -afy && \
    python -m pip install paddlepaddle -i https://mirror.baidu.com/pypi/simple && \
    python -m pip install paddlehub -i https://mirror.baidu.com/pypi/simple && \ 
    python -m pip install shapely -i https://pypi.tuna.tsinghua.edu.cn/simple && \
    python -m pip install pyclipper -i https://pypi.tuna.tsinghua.edu.cn/simple && \
    apt update && apt install libgl1-mesa-glx -y

ENTRYPOINT [ "hub", "serving", "start", "-m" ]
CMD [ "chinese_ocr_db_crnn_server" ]

EXPOSE 8866

```

#### 构建镜像

> 在Dockerfile文件的目录下运行命令：

```shell
docker build -t paddleser:v1 .
```

#### 启动容器

```shell
docker run -t -i --name mypaddleser -p 8866:8866 paddleser:v1
```

#### 使用服务

> python请求示例：

```python
import requests
import json
import cv2
import base64

def cv2_to_base64(image):
    data = cv2.imencode('.jpg', image)[1]
    return base64.b64encode(data.tostring()).decode('utf8')

# 发送HTTP请求
data = {'images':[cv2_to_base64(cv2.imread("/PATH/TO/IMAGE"))]}
headers = {"Content-type": "application/json"}
url = "http://127.0.0.1:8866/predict/chinese_ocr_db_crnn_server"
r = requests.post(url=url, headers=headers, data=json.dumps(data))

# 打印预测结果
print(r.json()["results"])
```

#### 识别结果

```json
[{'data': [{'confidence': 0.9985803365707397, 'text': '题卡名称手阅dp0623', 'text_box_position': [[637, 121], [1017, 121], [1017, 158], [637, 158]]}, {'confidence': 0.999457061290741, 'text': '姓名：', 'text_box_position': [[116, 258], [193, 265], [191, 301], [110, 296]]}, {'confidence': 0.9995811581611633, 'text': '班级：', 'text_box_position': [[420, 265], [495, 265], [495, 296], [420, 296]]}, {'confidence': 0.9991462230682373, 'text': '考号', 'text_box_position': [[1215, 265], [1267, 265], [1267, 296], [1215, 296]]}, {'confidence': 0.9980509877204895, 'text': '考场/座位号：', 'text_box_position': [[118, 311], [294, 311], [294, 348], [118, 348]]}, {'confidence': 0.984246551990509, 'text': '1.答题前请将姓名、班级、考场、准考证号填写清楚', 'text_box_position': [[126, 367], [712, 367], [712, 396], [126, 396]]}, {'confidence': 0.9982198476791382, 'text': '2.客观题答题，必须使用2B铅笔填涂，修改时擦干净', 'text_box_position': [[126, 401], [712, 401], [712, 430], [126, 430]]}, {'confidence': 0.9995695352554321, 'text': '3.主观题答题，必须使用黑色签字笔书写。', 'text_box_position': [[126, 440], [591, 438], [591, 467], [126, 469]]}, {'confidence': 0.9992306232452393, 'text': '4.必须在题号对应的答题区域内作答，超出答题区域书写', 'text_box_position': [[129, 474], [756, 474], [756, 503], [129, 503]]}, {'confidence': 0.9997410178184509, 'text': '无效。', 'text_box_position': [[131, 508], [191, 508], [191, 540], [131, 540]]}, {'confidence': 0.9975578188896179, 'text': '5.保持答卷清洁、完整', 'text_box_position': [[126, 547], [389, 547], [389, 576], [126, 576]]}, {'confidence': 0.9963907599449158, 'text': '正确填涂', 'text_box_position': [[129, 645], [232, 645], [232, 676], [129, 676]]}, {'confidence': 0.995934247970581, 'text': '缺考标记', 'text_box_position': [[518, 645], [624, 645], [624, 676], [518, 676]]}, {'confidence': 0.9811494946479797, 'text': '客观题（单选题1-5）', 'text_box_position': [[129, 759], [387, 764], [387, 800], [129, 796]]}, {'confidence': 0.9948947429656982, 'text': '2', 'text_box_position': [[152, 871], [170, 888], [152, 908], [134, 890]]}, {'confidence': 0.9998996257781982, 'text': '3', 'text_box_position': [[139, 898], [165, 898], [165, 944], [139, 944]]}, {'confidence': 0.996778666973114, 'text': '4', 'text_box_position': [[144, 954], [162, 954], [162, 981], [144, 981]]}, {'confidence': 0.9997808933258057, 'text': '简答题', 'text_box_position': [[129, 1083], [227, 1083], [227, 1122], [129, 1122]]}, {'confidence': 0.9994387626647949, 'text': '第1页', 'text_box_position': [[291, 2176], [348, 2176], [348, 2200], [291, 2200]]}], 'save_path': ''}]
```

### 报错汇总

- [ImportError: libGL.so.1: cannot open shared object file: No such file or directory](https://blog.csdn.net/agonysome/article/details/108985079)
- [ERROR: pip‘s dependency resolver does not currently take into account all the packages that are inst](https://blog.csdn.net/weixin_43582443/article/details/111478698) 
- 启动镜像后发现：{"msg":"This module requires the shapely, pyclipper tools. The running environment does not meet the requirements. Please install the two packages.","results":"","status":"101"} ，需要安装shapely、pyclipper模块

## 最后

以上就是一次docker的打包教程啦，当然现在仅仅是使用paddlehub自带的服务端，后续会完善它的整体架构~

好了，你已经学会打包一个docker镜像啦，快去试试吧！
