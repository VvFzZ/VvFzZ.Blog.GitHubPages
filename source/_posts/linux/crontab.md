---
title: crontab
date: 2024-05-16 22:39:33
tags: 
    - crontab
    - 定时任务
description: 
---

crontab文件中，每一行都代表一项任务，每行的每个字段代表一项设置，它的格式共分为六个字段，前五段是时间设定段，第六段是要执行的命令段：minute hour day month week command
<!--more-->
其中：
minute：表示分钟，可以是从0到59之间的任何整数。
hour：表示小时，可以是从0到23之间的任何整数。
day：表示日期，可以是从1到31之间的任何整数。
month：表示月份，可以是从1到12之间的任何整数。
week：表示星期几，可以是从0到7之间的任何整数，这里的0或7代表星期日。
command：要执行的命令，可以是系统命令，也可以是自己编写的脚本文件。

# 安装crontab
yum install crontabs

# 常用命令
service crond start         //启动服务
service crond stop          //关闭服务
service crond restart       //重启服务
service crond reload        //重新载入配置
crontab -e                  // 编辑任务
crontab -l                  // 查看任务列表
service crond status		//查看服务状态

# 常用表达式
*/1 * * * *   //每分钟执行一次

59 23 * * *   //每天23：59分执行一次

0 1 * * *     //每天凌晨一点执行一次

* 23,00-07/1 * * *  //当天23点，第二天0点到凌晨7点 每隔1分钟执行一次

# 添加任务
执行 crontab -e 
添加命令行 `*/1 * * * * /usr/local/nginx/sbin/cut_my_log.sh`
