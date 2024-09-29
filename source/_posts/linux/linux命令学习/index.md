---
title: linux命令学习
date: 2024-08-28 10:50:57
tags:
description: linux命令学习-msb
---
echo $$ 打印当前进程Id
# bash shell定义变量
普通变量`a=1`
数组 定义：`arr=(1 2 3)`  取值：`echo ${arr[0]}`
# man
查看帮助文档
`man ipconfig`,回车一行一行加载，空格一页页加载，q退出 
内部命令用help
外部命令用man
# 内部命令/外部命令
定义：shell自带的命令
shell是一个程序（软件）常用bash shell，使用bash shell操作系统
type查看是否是内部命令
file查看文件类型（ELF是二进制文件）
whereis 查找文件
find / -name *.txt 查找文件
cat查看文件
外部命令先找到可执行文件（PATH中查找）再执行。

# linux文件系统
bin 可执行命令（用户命令）
sbin 管理相关命令
boot 系统启动相关文件，如内核，initrd，以及grub（booloader）
dev 设备文件（鼠标键盘）
home 用户的家目录 （直接使用cd命令进入该目录）
root 管理员的家目录（直接使用cd命令进入该目录）
lib 库文件（操作系统或第三方软件的库文件）
media 挂载点目录，移动设备
mnt 挂载点目录，临时的文件系统
opt 可选目录，第三方程序安装目录
proc 伪文件系统，内核映射文件 如：echo $$ 输出当前bash shell进程Id，可进入/proc/id 查看bash shell相关的映射文件，bash shell 进程关闭此文件夹会删除。
sys 伪文件系统，跟硬件设备相关的属性映射文件
tmp 临时文件 ，/var/tmp
var 可变化文件（日志，要处理的数据）
# 配置虚拟机网络服务
## 找到网卡位置
cd /etc/sysconfig/network-scripts
vim ifcfg-eth0 （第0个网卡）
## 配置协议
删除网卡物理地址和uuid（方便后期克隆虚拟机，不至于多虚拟机有相同物理地址出现网络问题）

配置IPADDR NETMASK（掩码） GATWAY DNS1 DNS2

重启网络服务 service newwork restart

ping测试

# vi
## 编辑模式
vi进入编辑模式 i进出输入模式
vi +5 file 打开文件并定位第5行 （vi + file 定位到末尾）
gg文件第一行
G文件末尾 3G第三行
ctrl f,b 翻页
x删除字符（向前） 3x删除3个字符
r替换
dd删除行
dw删除单词
yw 复制单词
yy复制行
p粘贴 P在光标上方粘贴
u撤销
ctrl r 恢复
.重复上一步
## 输入模式
i 在光标后
a 光标前
A 行位
o 下一行
O 上一行
## 末行模式
### 进入末行模式
：进入末行模式（:!wq 强行保存退出，shift z z 等同于:wq）
### 设置行号
:set nu 显示行号（set number，set nonu）
:set readonly 设置只读模式
### 查找
:/word  按n键一个一个查找word位置 N向上查找
### 执行命令
:!ls -l /  编辑模式下执行ls命令
### 查找替换  
:s/word1/word2 替换光标所在行的word1成word2（替换一个）
:s/word1/word2/g 替换所有
:s/word1/word2/gi 替换所有不区分大小写
:.,+2s/word1/word2/gi 替换当前行及向下两行(.代表光标所在行，+2代表下两行)
:12s/word1/word2/gi 替换12行
:%s/word1/word2/gi 全局替换 （:0,$s/word1/word2/gi）

/是分隔符可以用@ # 替代
### 删除
:0,$d删除0到最后一行（删除所有）
:.,2d删除当前行和下两行（共3行）
:3,5d删除3到5行
:$-1d删除倒数第2行
### 复制
:1,3y复制1到3行，（0,$y 复制全部） 


# 文本操作命令
## 查看文件
cat  查看文件内容  (cat file1 file2 打印出file1 file2的内容)
more 分页显示内容 (more file1 显示一屏内容，空格显示下一屏，enter显示下一行，回看只能通过滑轮)
less file （空格下一页，b上一页，enter下一行） 存储在缓存中，大文件不适用，大文件使用more，回看用滚轮。
head file -5 打印前5行 默认10行
tail file -5 打印末尾5行 默认10行
tail -f 实时滚动显示末尾
## 管道符
xargs 从输入流中构建命令，打印/下的文件，echo "/" |xargs ls -l
xargs 接受echo 输出的/ 拼接到ls -l后面
取文件第5行数据：head -5 file|tail -1
## cd等命令
pwd 显示目录
cd 回到家目录

mkdir dic 创建文件夹, -p 级联创建，上级不存在时
mkdir a/b1 a/b2 a/b3 在a下创建三个文件夹 (mkdir a/b{1,2,3})
touch file 创建file文件，写入"123"  echo "123" >> file（touch也可以统一access，modify，change三个时间）
cp 拷贝 ，拷贝目录（包含里面内容）：cp -r a s 拷贝a文件夹到s文件夹
mv 移动/修改名称
# 文件系统相关命令
df 查看磁盘信息 df -h(磁盘分区情况)
du 文件系统情况 df -h dic dic目录下子目录的文件情况
ls 
- -a 显示全部，包括隐藏文件
- -l 以长列表显示 
ll 显示信息显示（-i显示文件号）
- 显示内容解释
    - 第一个字符：-代表普通文件，d代表文件夹，l代表软连接（类似快捷方式），b块设备文件，c字符设备文件；p命令管道文件，s套接字文件
    - 9位：三个一组，分别是创建者权限，所在组权限，其他人权限；r读w写执x行权限，
    - .分隔符，
    - 文件硬链接数
    - 属主（创建者）名
    - 属主所在组
    - 文件大小（字节）
    - 时间戳（最后一次修改）

ln 硬链接（-s 软连接）
ln file1 file2 （file1本身存在，file2是硬链接创建的，file2的内容与file1相同，若修改file1，file2内容同步改变，删除file1，file2仍保留）
ln file1 file2 （file1本身存在，file2是软链接创建的，删除file1，则file2无法查看）

state 查看文件详细信息 比ll更详细
access访问时间
change代表文件元数据修改时间（比如权限）
modify代表文件内容修改时间
touch 统一时间，会改变以上三个时间成当前时间，

chmod o+w file 给其他人写权限

## sed行编辑器
以行为单位进行处理，可将数据替换，新增，删除，选取等

file内容
哈哈
123tttint:

sed "s/8/3/" file


