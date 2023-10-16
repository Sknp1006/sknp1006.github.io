---
title: yun主题相册生成器
date: 2020-08-12 20:57:33
updated: 2020-9-17
tags: [Python, hexo-yun, PyQt5]
categories: 
  - 牛排的小项目
---
> 每次要更新相册总是很麻烦，虽然之前写了自动生成文件目录的脚本，但还是需要手动将结果粘贴进对应的md文件中。  
> 所以，本着一劳永逸的原则，再写一个全自动更新相册的脚本，解放双手🙌

> github: [GUI-with-PyQt5/yun_tools/albums_creater/](https://github.com/Sknp1006/GUI-with-PyQt5/tree/master/yun_tools/albums_creater) 

<!-- more -->

<details><summary>如果还不知道如何配置相册👀</summary>

## yun主题の相册配置

### 相册 albums

存在一个相册主页，放置多个相册，点击进入相册查看更多照片。

在 `yun.yml` 中开启相册功能。

```yaml
albums:
  enable: true
```

[相册示例](https://www.yunyoujun.cn/albums/)

[配置示例](https://github.com/YunYouJun/yunyoujun.github.io/blob/hexo/source/albums/index.md)

如果想要让相册显示在侧边栏中，你还需要配置一下导航 [侧边栏 - 页面链接](https://yun.yunyoujun.cn/guide/config.html#页面链接)。

### 相册集

相册集是相册的导航页面，你可以在此放置多个相册。

新建相册集页面

```sh
hexo new page albums
```

进入 `source/albums/index.md`，设置 `type`，和添加相册链接、封面等。

- `caption`: 相册标题
- `url`: 相册链接
- `cover`: 相册封面
- `desc`: 相册描述

```yaml
---
type: albums
albums:
  - caption: 夕阳西下
    url: /albums/sunset.html
    cover: https://interactive-examples.mdn.mozilla.net/media/examples/elephant-660-480.jpg
    desc: 我想起那天夕阳下的奔跑
---
```

### 相册页

[相册页示例](https://www.yunyoujun.cn/albums/sunset.html)

相册页，才是你真正存放照片的地方。

> 使用 [lightgallery.js](https://github.com/sachinchoolur/lightgallery.js/) 实现，仅在相册页才会加载该类库。

新建相册页面。

你只需在上面新建好的 `albums` 文件夹中，继续创建 `md` 文件，譬如新建 `sunset.md`。

或通过命令行新建：

```sh
hexo new page --path albums/sunset "夕阳"
```

进入 `sunset.md` 文件，进行修改。

> 注意：这里是 `layout` 而不是 `type`。

TIP

你还可以设置 `gallery_password` 来对相册进行加密。（记得将你的仓库设置为私有。）

没有直接命名为 `password` 以防止与 [hexo-blog-encrypt](https://github.com/MikeCoder/hexo-blog-encrypt) 插件关键字 `password` 冲突。

> 因为使用了 [crypto-js](https://github.com/brix/crypto-js)，所以你还需要 `npm install crypto-js`。

测试页面：https://www.yunyoujun.cn/albums/sunset.html 测试密码：test

> 如果你发现在 `hexo s` 并开启了 PJAX 时，无法正常解密相册，不用担心，这是 Hexo 作为服务器时，对链接又重新加密了一遍，生成静态文件部署时是没有问题的。

```yaml
---
title: 夕阳
date: 2020-04-18 16:27:24
updated: 2020-04-18 16:27:24
layout: gallery
password: test
photos:
  - caption: 我
    src: https://interactive-examples.mdn.mozilla.net/media/examples/elephant-660-480.jpg
    desc: 我想起那天夕阳下的奔跑
  - caption: 想起
    src: https://i.picsum.photos/id/198/510/300.jpg
    desc: 那是我逝去的青春
---
```

> 为什么使用相册集作为 `albums`，`gallery` 作为相册 ？ [What is the Difference Between Albums vs Galleries in WordPress](https://enviragallery.com/what-is-the-difference-between-albums-vs-galleries-in-wordpress/)

</details>

## 相册生成工具

### 前言

> 图片的加载统一采用cdn方式，详见[https://www.jsdelivr.com/](https://www.jsdelivr.com/)

> ❗本工具适用无密码相册，如有设置密码，请到文章中单独开启❗
>
> 工具较简易，如有其他需求，请留言~

### 文件夹结构

- Github
  - [cdn](https://github.com/Sknp1006/cdn)
  - hexo_source

#### setting.py

> 将下列参数改为你的即可，
>
> ❗若已有相册，请注意文件路径不要填错，以免文件内容丢失❗

```python
# tree.py
source_path = r"C:\Users\SKNP\Documents\GitHub"
cdn_url = "https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master"

# gen_albums.py
albums_path = r"C:\Users\SKNP\Documents\GitHub\hexo_source\SKNPLZ\source\albums"
tree_path = r"C:\Users\SKNP\Documents\GitHub\cdn"
```

#### tree.py

> 生成图片目录

```python
from pathlib import Path
from setting import cdn_url, source_path

exclude_dir = ['.git', '.idea', '.txt']
exclude_file = ['txt', 'py', 'gitignore']  # 以"."开头的文件去掉"."



def is_not_txt(file):
    sp = file.split(".")
    if sp[-1] not in exclude_file:
        return 1


def write(file_list, path, type):
    name = '&'.join(str(file_list[0]).split('\\')[-3:-1])
    if type == 'albums':
        print(name)
        with open('{}.txt'.format(name), mode='w') as f:
            for img in file_list:
                caption = str(img).split("\\")[-1]
                src = "/".join([cdn_url, str(path).replace('\\', '/'), caption])
                f.writelines("  - caption: " + caption + '\n')
                f.writelines("    src: " + src + '\n')
    elif type == 'ordinary':
        with open('{}.txt'.format(name), mode='w') as f:
            for img in file_list:
                caption = str(img).split("\\")[-1]
                src = "/".join([cdn_url, str(path).replace('\\', '/'), caption])
                f.writelines(src + '\n')
    elif type == 'likes':
        pass


def tree(dir_name):
    if Path(dir_name).is_dir():
        path = Path(dir_name)
    else:
        path = Path("\\".join([source_path, dir_name]))
        if not path.exists():
            raise Exception('"{}" not exist'.format(path))

    path_list = [dir for dir in path.iterdir() if dir.is_dir()]
    file_list = [dir for dir in path.iterdir() if dir.is_file() and is_not_txt(str(dir))]
    if path_list:
        for path in path_list:
            if path.name not in exclude_dir:
                # print("path:", path)
                # print("dir_name:", dir_name)
                tree(path)

    if file_list:
        if 'albums' in str(file_list[0]).split('\\'):
            write(file_list, path, 'albums')
        else:
            write(file_list, path, 'ordinary')
```

albums类的生成结果: 

```markdown
示例：albums&arknights.txt

  - caption: Amiya_1.jpg
    src: https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/albums/arknights/Amiya_1.jpg
  - caption: Amiya_2.jpg
    src: https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/albums/arknights/Amiya_2.jpg
```

普通相册生成结果: 

```markdown
示例：img&bg.txt

https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/bg/bg_0_babel.png
https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/bg/bg_0_babel2.png
```

#### gen_albums.py

> 修改对应相册的md文件

```python
import glob
import time
import random
from pathlib import Path
from tree import tree
from setting import cdn_path, albums_path


def create_albums(albums_dict, album, title=None, passwd=None,
                  cover="https://cdn.jsdelivr.net/gh/Sknp1006/cdn/img/avatar/none.jpg", desc=None):  # 创建新相册
    print("creating {}".format(album))
    md = "\\".join([albums_path, "{}.md".format(album)])  # 新建的md文件路径
    with open(md, 'w+', encoding='utf-8') as f:
        f.write('---\n')
        if title:
            f.write('title: {}\n'.format(title))
        else:
            f.write('title: {}\n'.format(album))
        f.write('date: {}\n'.format(time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time()))))
        f.write('layout: gallery\n')
        if passwd:
            f.write('password: {}\n'.format(passwd))  # 设置密码
        f.write('photos:\n')
        f.writelines(albums_dict[album])
        f.write('---\n')
    with open("\\".join([albums_path, 'index.md']), 'r', encoding='utf-8') as f:  # 读取原来的index.md
        txt = f.readlines()[:-1]
    with open("\\".join([albums_path, 'index.md']), 'w', encoding='utf-8') as f:  # 在index.md添加新album
        f.writelines(txt)
        f.write('  - caption: {}\n'.format(title))
        f.write('    url: /albums/{}.html\n'.format(album))
        f.write('    cover: {}\n'.format(cover))
        f.write('    desc: {}\n'.format(desc))
        f.write('---\n')


def update_albums(albums_dict):  # 更新相册
    for album in albums_dict:
        md = "\\".join([albums_path, "{}.md".format(album)])  # 对应album的md文件
        if not Path(md).is_file():  # 找不到，则新建一个相册
            cover = random.choice(albums_dict[album][1::2]).strip()[5:]  # 随机选取封面
            create_albums(albums_dict, album, cover=cover)
        with open(md, 'w+', encoding='utf-8') as f:
            f.write('---\n')
            f.write('title: {}\n'.format(album))
            f.write('date: {}\n'.format(time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time()))))
            f.write('layout: gallery\n')
            f.write('photos:\n')
            f.writelines(albums_dict[album])
            f.write('---\n')
        print("{} updated done!".format(album))


def read_txt(tree_path):
    albums_dict = {}
    txt_list = glob.glob(tree_path + "\\" + "*.txt")
    albums_txt = [txt for txt in txt_list if txt.split("\\")[-1].split("&")[0] == "albums"]
    for file in albums_txt:
        with open(file, 'r') as f:
            albums_dict[file.split("&")[-1].split(".")[0]] = f.readlines()
    return albums_dict


def update_tree(dir_name):
    tree(dir_name)
    return "update done"


if __name__ == '__main__':
    update_tree('img/albums')
    dict = read_txt(cdn_path)
    update_albums(dict)
```

### 使用说明

- 当前不支持设置密码，请在文章内手动开启
- 新相册部分参数请到index.md修改
  - `caption`: 默认为空
  - `url`: 默认为`/albums/[相册文件名].html`
  - `cover`: 该相册下随机选取的一张图片
  - `desc`: 默认为空

运行过程: 

- `update_tree('img/albums')`: 扫描albums文件夹，将最新文件配置写入记事本
- `dict = read_txt(cdn_path)`: 读取txt文件的配置，结果存入字典
- `update_albums(dict)`: 根据albums字典修改对应md，如有新相册则添加进index.md

### 运行结果

albums&test.txt

```
  - caption: Amiya_1.jpg
    src: https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/albums/test/Amiya_1.jpg
  - caption: Amiya_2.jpg
    src: https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/albums/test/Amiya_2.jpg
  - caption: Angelina_1.jpg
    src: https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/albums/test/Angelina_1.jpg
  - caption: Ansel_1.jpg
    src: https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/albums/test/Ansel_1.jpg

```

index.md

```
---
type: albums
comments: false
albums:  
  - caption: None
    url: /albums/test.html
    cover: https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/albums/test/Amiya_1.jpg
    desc: None
---

```

test.md

```
---
title: test
date: 2020-08-12 23:44:02
layout: gallery
photos:
  - caption: Amiya_1.jpg
    src: https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/albums/test/Amiya_1.jpg
  - caption: Amiya_2.jpg
    src: https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/albums/test/Amiya_2.jpg
  - caption: Angelina_1.jpg
    src: https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/albums/test/Angelina_1.jpg
  - caption: Ansel_1.jpg
    src: https://cdn.jsdelivr.net/gh/Sknp1006/cdn@master/img/albums/test/Ansel_1.jpg
---

```

## GUI版本
> 船新版本，操作便捷

<img src="https://bucket.sknp.top/2023/07/7158cdb836a031f0447703725ba59ca6.png" style="zoom:80%;" />



### 更新日志

> 2020/8/12 可以自动生成文件目录，自动更新md
> 2020/9/16 船新GUI版本

---

![](https://bucket.sknp.top/2023/07/2fbd058327fd1f595863683f895e1782.jpg)

