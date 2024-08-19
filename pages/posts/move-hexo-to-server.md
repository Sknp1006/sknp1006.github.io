---
title: 将本地Hexo代码搬运至服务器
date: 2021-01-18 16:45:02
updated: 2024-08-18 16:45:02
tags: [hexo]
categories: 
  - 牛排的小笔记
---
因为刚好有时间，刚好有台服务器，刚好有个hexo博客
于是萌生了把本地的hexo代码移植到服务器的想法
以便随时~~水~~更新文章😁

> ~~总的来说参考 [云游的建站小指南](https://www.yunyoujun.cn/share/how-to-build-your-site/) 就OK了~~ 
>
> ~~不过仍有些需要注意的点~~
>
**⚠️现已迁移至全新博客框架[valaxy](https://valaxy.site/)!** 

<!-- more -->

>从这里开始默认你已经掌握hexo的搭建方法，否则老老实实去看👆建站指南
>
>其实200多天前我也是个小白😋多多记录，努力变强( •̀ ω •́ )✧

## 当前状况

- [x] 已有Github

- [x] 已有仓库
- [x] 仓库绑定域名

- [x] 安装Node.js
- [x] 安装hexo-cli
- [x] 安装Hexo-theme-yun
- [x] 覆盖_config.yml
- [x] 覆盖source目录
- [x] 覆盖package.json
- [x] 修改yun主题默认网站图标



## 需要强调

### 部署到Github

为了更方便的部署到 GitHub Pages，Hexo 提供了 `hexo-deployer-git` 插件。

```sh
npm install hexo-deployer-git
```

在 `_config.yml` 中配置。

```yaml
deploy:
  type: git
  repo: 你此前新建的仓库的链接 # 比如：git@github.com:Sknp1006/sknplz.git
  branch: master # 默认使用 master 分支
  message: Update Hexo Static Content # 你可以自定义此次部署更新的说明
```

```sh
hexo deploy
```

执行该代码，会在博客根目录下新建 **.deploy_git** 文件夹，之后便会部署到master分支

> P.S. 若配置了rsa，需要将 **.ssh** 文件夹下的 `id_rsa` 与 `id_rsa.pub` 复制到 服务器的 **root/.ssh** 目录下

### 与远程仓库建立关联

接下来我们将本地的仓库与此前在 GitHub 上建立的仓库建立关联。

```sh
git init # 初始化 Git 仓库，只需要执行一次即可
```

执行该代码，会在博客根目录下新建 **.git** 文件夹

在将其部署到 GitHub Pages 上之前，我们最好先建立一个分支。

> 什么是分支？
> Git 提供了版本管理功能，其中还有一个分支功能，你现在可以简单地将其理解为平行世界。

```sh
git checkout -b hexo
```

这时便成功建立了一个 hexo 分支。（此后的工作都将在 hexo 分支下进行）

你可以通过 `git branch -v` 来查看当前有哪些分支，使用 `git checkout 分支名` 来切换到对应的分支。

### 备份源代码

我们当前只是将生成的静态文件部署到了云端。

为了以防万一，我们应该将网站的源代码文件也推送到 GitHub 仓库备份。

```sh
# 与远程 Git 仓库建立连接，只此一次即可
git remote add origin https://github.com/你的用户名/你的名字.github.io
# git remote add origin https://github.com/Sknp1006/sknplz
```

接下来准备提交，这几句命令将是你以后每次备份所需要输入。

```sh
# 添加到缓存区
git add -A
git commit -m "这次做了什么更改，简单描述下即可"
# 推送至远程仓库
git push
# 第一次提交，你可能需设置一下默认提交分支
# git push --set-upstream origin hexo
```

每次推送都要输入这三条命令，你可能觉得有些麻烦。
那么你可以编写 bash 脚本。

譬如，在根目录下新建 `update.sh`。

```sh
# 如果没有消息后缀，默认提交信息为 `:pencil: update content`
info=$1
if ["$info" = ""];
then info=":pencil: update content"
fi
git add -A
git commit -m "$info"
git push origin hexo
```

> P.S. 此代码若是运行在linux环境，建议用vim手敲，此后更新的话，只需要在终端执行 `sh update.sh` 

> P.S. 如果你尝试过却不成功，可以试试在github上把hexo分支设置为default ，顺便多练几遍git命令
>
> 相信我，当你一筹莫展的时候，不妨静下心来看看 [Git 学习笔记](https://www.yunyoujun.cn/note/git-learn-note/)

成功后你将看到：

```sh
Last login: Tue Jan 19 08:59:33 2021 from 127.0.0.1
[root@VM-0-12-centos ~]# cd /home/github/sknplz.xyz
[root@VM-0-12-centos sknplz.xyz]# git add -A
[root@VM-0-12-centos sknplz.xyz]# git commit -m ":pencil update content"
[hexo ddc4ab2] :pencil update content
 1 file changed, 8 deletions(-)
 delete mode 100755 bash/backup.sh
[root@VM-0-12-centos sknplz.xyz]# git push origin hexo
Username for 'https://github.com': Sknp1006
Password for 'https://Sknp1006@github.com': 
Enumerating objects: 3, done.
Counting objects: 100% (3/3), done.
Delta compression using up to 2 threads
Compressing objects: 100% (2/2), done.
Writing objects: 100% (2/2), 226 bytes | 226.00 KiB/s, done.
Total 2 (delta 1), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (1/1), completed with 1 local object.
To https://github.com/Sknp1006/sknplz
   1806f2b..ddc4ab2  hexo -> hexo
```

## 通过actions-gh-pages自动部署

```yml
name: GitHub Pages
on:
  push:
    branches:
      - hexo
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          submodules: true

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: "14.x"

      - run: yarn install
      - run: yarn build

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
          publish_branch: master
          force_orphan: true
```

根据云游君的提示，去掉夹在 `yarn install` 与 `yarn build` 之间的 `algolia` 部分，直接粘贴到你的 `.github/workflows/` 文件夹（自己新建）下 `xxx.yml` 文件里。

## 添加yun主题子模块

在高高兴兴push到github之后，你或许会发现报错`No url found for submodule path 'themes/yun' in .gitmodules`，这是应为yun主题本身是另一个项目。想要在一个项目中添加另一个项目，就需要用到`git submodule`命令

```sh
git submodule add https://github.com/YunYouJun/hexo-theme-yun themes/yun

#跟clone命令很像，同时会创建 .gitmodule 文件
git clone -b master https://github.com/YunYouJun/hexo-theme-yun themes/yun
```

> P.S. 若提示路径已存在，则需要删除**yun**文件夹并运行第一条命令

成功后你将看到：

```sh
[root@VM-0-12-centos sknplz.xyz]# sh update.sh [hexo 0dbacec] :pencil: update content
 2 files changed, 4 insertions(+)
 create mode 100644 .gitmodules
 create mode 160000 themes/yun
Username for 'https://github.com': Sknp1006
Password for 'https://Sknp1006@github.com': 
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 2 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (4/4), 428 bytes | 428.00 KiB/s, done.
Total 4 (delta 1), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (1/1), completed with 1 local object.
To https://github.com/Sknp1006/sknplz
   688587d..0dbacec  hexo -> hexo
```

## 更新yun主题子模块

在`.gitmodules`所在路径运行以下代码：

```sh
git submodule update --remote
```

你也可以参考 Hexo 的官方文档 [将 Hexo 部署到 GitHub Pages](https://hexo.io/zh-cn/docs/github-pages)

推送后便可直接自动部署。

## 最后

现在我将这篇文章添加到**source/_post**目录下，执行`update.sh`脚本，即可将源码保存到`hexo`分支，触发actions-gh-pages自动部署网站👉 ~~[sknplz.xyz](https://sknplz.xyz)~~ 


