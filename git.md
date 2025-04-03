# 🚀 Git开发教程

开始项目开发前务必！！！仔细阅读。涉及分支管理重要内容

---

## ✅ 第一次使用项目：克隆仓库



```bash
git clone https://github.com/klearnin/SiuHub.git
cd SiuHub
code .
```
此时在vscode的终端中输入
```bash
git branch
```
应该可以看到main和dev两个分支（不需要管）

## ✅ 组内开发分支管理
首先注意，开发过程都分为本地仓库和远程仓库（GitHub），需要管理好这两个仓库。

建议组长（下用A表示）先建立分支并push，组员（下用B表示）“拉取该分支”。具体操作：
### 组长操作

A首先在本地仓库创建分支
```bash
git checkout -b feature-你的功能名
```
然后将分支push到远程仓库中
```bash
git push -u origin feature-你的功能名
```
-u参数解释：-u相当于让git记住你之后要推送到远端的哪个分支，写了-u的话后面要push/pull就直接git push/pull就可以了。不然每次都需要git push origin feature-你的功能名。之后换分支的话，在第一次push的时候同样加上-u就行。

此时git branch应该可以看到自己在功能分支上。

之后就可以正常开发，每次写完功能就add -> commit -> push
```bash
git add .
git commit -m "xxx"
git push origin feature-你的功能名 / git push # 前面设置了-u参数
```
其中add和commit操作都可以在vscode上完成，push也可以在vscode上完成，但为了确保分支没有问题，最好在终端操作。

### 组员操作
组长创建了分支后，组员只需要在本地同样创建分支，并且连接上组长在远端仓库的分支即可。操作如下：
```bash
git fetch  # 获取远程所有分支的信息（但不切换）
git checkout -b feature-你的功能名 origin/feature-你的功能名
```
之后正常在该分支开发就行，看组长部分就能理解。需要注意的就是在第一次push的时候：
```bash
git push -u origin feature-你的功能名
```