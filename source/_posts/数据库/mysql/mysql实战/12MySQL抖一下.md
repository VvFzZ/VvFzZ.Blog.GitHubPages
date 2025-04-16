---
title: 12MySQL抖一下
description: 12MySQL抖一下
date: 2025-03-14 16:21:31
tags: mysql
---
# 脏页
WAL会出现内存和磁盘数据不一致情况，此时称内存页为"脏页"。
内存数据写入磁盘，数据一致后，称为"干净页"

刷盘操作会引发数据库"抖"一下
- 内存不足
- redo log空间不足


刷脏页是常态，但以下情况会导致性能问题:（控制脏页比例避免）
- 要淘汰脏页太多，导致查询查询响应时间变长
- redo log满了，更新全部阻塞


# InnoDB刷脏页的控制策略

## innodb_io_capacity参数
innodb_io_capacity 主机IO能力参数，InnoDB识别通过此参数识别主机IO能力
- 设置太小
并发写多时，刷页速度慢，导致sql写入速度慢，TPS低，但主机的IO却压力不大（不能充分利用主机的IO能力）.
- 设置太大
脏页刷新太积极，争抢磁盘IO，影响其他操作。

## 影响脏页刷新的因素
- 脏页比例
 innodb_max_dirty_pages_pct 
- redo log剩余空间

innodb_flush_neighbors 邻居脏页一并刷新，机械硬盘时代可减少随机IO
若使用SSD建议设置0，此类硬盘IOPS不是瓶颈，应只刷新自己，快速完成任务，减少响应时间。
MySQL8默认0

## 问题
如果一个高配的机器，redo log 设置太小，会发生什么情况？
redo log很快写满，暂停刷盘，服务器IO压力很小，但服务间歇性性能下跌


