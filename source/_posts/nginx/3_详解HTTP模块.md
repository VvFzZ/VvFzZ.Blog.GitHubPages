---
title: 3_详解HTTP模块
date: 2024-06-13 14:37:25
tags: Nginx
description: 详解HTTP模块
---

# 冲突的配置指令
<img src="配置块的嵌套.png" />

# Listen指令

# 处理HTTP请求头的流程
## 接收请求事件模块
<img src="接收请求事件模块.png" />
clinet_header_buffer_size 从链接内存池中分配，用于接收内核中的请求数据

## 接收请求HTTP模块
<img src="接收请求HTTP模块.png" />

# Nginx中的正则表达式
<img src="常用正则表达式.png" />

检测正则表达式工具：pcretest，下载源码安装
<img src="常用正则表达式2.png" />

# 如何找到处理请求的server指令块

<img src="server_name指令.png" />

<img src="server_name指令_匹配规则.png" />

<img src="server匹配顺序.png" />

# 详解HTTP请求的11个阶段

# 11个阶段的顺序处理

# postread阶段：获取真实客户端地址的realip模块

# rewrite阶段的rewrite模块：return指令

## return指令
<img src="rewrite模块return指令.png" />

## error_page指令
<img src="rewrite模块return指令与error_page.png" />

## return与errpr_page指令优先级
<img src="return示例.png" />

- 上图中location块return 语句优先级高于server块 error_page
- server块 return语句优先级高于 location块return语句

# rewrite阶段的rewrite模块：重写URL
## rewrite指令
<img src="rewrite模块_rewrite指令.png" />

## rewrite示例 

<img src="rewrite示例.png">

- 访问/first/3.txt  输出 third!
- 去掉 break后 访问/first/3.txt  输出 second!

<img src="rewrite示例2.png">

- 访问 /redirect1/ 返回301 
- 访问 /redirect2/ 返回302 
- 访问 /redirect3/ 返回302 
- 访问 /redirect4/ 返回301 

rewrite_log on; //默认关闭  ，开启重定向日志，写入error_log文件

# rewrite阶段的rewrite模块：条件判断

## if指令
<img src="if指令.png">

## if条件表达式
<img src="if条件表达式.png">

## if条件表达式实例
<img src="if条件表达式实例.png">


# find_config截断：找到处理请求的location指令块

## location指令
<img src="location指令.png">
merge_slashes 合并连续/ , 启用base64等时需要关闭

## location匹配规则
<img src="location匹配规则_仅匹配URI忽略参数.png">

## location匹配顺序
1. 精确匹配
2. ^~匹配上后不再进行正则匹配
3. 正则匹配
4. 最长前缀匹配

<img src="location匹配顺序.png">
<img src="location示例.png">

- 示例1
访问 http://domain/Test1/Test2 
无精确匹配，无^~匹配，前缀正则匹配成功，所以输出longest regular expressions match
- 示例2
访问 http://domain/Test1/Test2/
无精确匹配，无^~匹配，前缀正则匹配不成功，前缀匹配成功，所以输出 longest prefix string match


# preaccess阶段：对连接做限制的limit_conn模块
限制并发连接数

# preaccess阶段：对请求做限制的limit_req模块
限制链接请求数

# access阶段：对ip做限制的access模块
<img src="限制IP地址访问权限.png">

# access阶段：对ip做限制的access模块
进入access阶段前不生效

<img src="限制IP地址的访问权限.png">
192.168.1.0/24子网掩码
2001:0db8::/32 ipv6子网掩码

引入黑名单配置文件：新建blocksip.conf ,并引入inclue blocksip.conf

# access阶段：对用户名密码做限制的auth_basic模块
## auth_basic模块的指令
<img src="auth_basic模块的指令.png">

## 生成密码文件
工具 httpd-tools
命令 htpasswd -c file -b user pwd
文件内容格式如下：
```
# commet
name1:pwd1
name2:pwd2:comment  # comment是注释
```
当提供一些简单的页面服务时，快捷得对他们做安全保护可使用auth_basic（如goaccess页面）

# access阶段：使用第三方做权限控制的auth_request模块
可配置提供统一的第三方鉴权系统
<img src="auth_request配置示例.png">
说明：

1. 访问http://access.taohui.tech页面
2. 转发到第三方权限控制模块http://127.0.0.1:8090/auth_upstream 
3.  - 若返回200，则返回访问html/文件夹下的index.html
    - 若返回403，则返回第三方模块返回的错误

# access阶段的satisfy指令
控制指令的行为

## satisfy指令说明
<img src="satisfy指令说明.png">
satisfy any任意一个指令成功即成功
satisfy all任意一个指令失败则失败

## 问题
<img src="access_satisfy指令.png">

1. 不会生效，return指令在rewrite阶段已执行，return，access配置的先后顺序无关
2. 有影响，
3. 可以访问，satisfy any表示 access模块任何一个成功则通过access模块验证
4. 配置文件指令顺序无关
5. 没有机会

# precontent阶段：按序访问资源的try_files模块
<img src="procontent_try_files指令.png">

<img src="procontent_try_files指令示例.png">

# 实时拷贝流量：precontent阶段的mirror模块
<img src="precontent_mirror模块.png">

<img src="precontent_mirror模块_配置示例.png">

# content阶段：详解root和alias指令
<img src="root和alias指令.png" />

# static 模块提供的三个变量
request_filename、document_root、realpath_root

## 生成待访问文件的三个相关变量
<img src="生成待访问文件的三个相关变量.png" />

<img src="生成待访问文件的三个相关变量_Conf.png" />

<img src="生成待访问文件的三个相关变量_ll.png" />
realpath是软连接，指向first文件夹
<img src="生成待访问文件的三个相关变量_r.png" />

# static模块对url不以斜杠结尾访问目录的做法
<img src="重定向跳转的域名.png" />

# index和autoindex模块的用法
## 指定index文件
<img src="指定index文件.png" />

index模块先于autoindex模块执行，所以有时访问目录会返回目录下的index页面

## autoindex
可通过`--without-http_autoindex_module`禁用autoindex
<img src="autoindex指令.png" />

# 提升多个小文件性能的concat模块

# access日志的详细用法
## 日志配置
<img src="配置日志文件路径.png">
buffer 减少磁头旋转，减少寻址时间

## 日志文件包含变量时的优化
<img src="日志文件包含变量时的优化.png">

# HTTP过滤模块的调用流程
content模块之后，log模块之前

# 用过滤模块更改响应中的字符串：sub模块

# 用过滤模块在http响应的前后添加内容：addition模块

# 使用变量防盗链的referer模块

<img src="referer模块指令.png">

<img src="valid_referers指令.png">
经过反向代理或防火墙等可能出现有referer头没有值的情况

<img src="invalid_referer示例.png">

# 使用变量实现防盗链功能实践：secure_link模块

# 为复杂的业务生成新的变量：map模块

# 通过变量指定少量用户实现AB测试：split_client模块

# 根据IP地址范围的匹配生成新变量：geo模块

