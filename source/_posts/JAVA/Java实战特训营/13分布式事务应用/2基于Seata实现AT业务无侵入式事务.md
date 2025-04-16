---
title: 2基于Seata实现AT业务无侵入式事务
description: 2基于Seata实现AT业务无侵入式事务
date: 2024-11-24 15:35:30
tags:
---

学习目标
- 了解Seata的架构和功能
- 基于Seata实现AT模式的开发

常见的分布式事务开发模式中，AT模式是开发成本最低的一种

目录
- Seata框架简介
    - Seata框架总体架构
    - Seata逻辑角色类型
    - Seata部署架构
- AT模式实现
    - AT模式的两阶段流程
    - AT模式锁机制
    - AT模式应用方式

# Seata框架简介
开源分布式事务解决方案框架，提供高性能，简单易用分布式事务服务。
提供AT、TCC、SAGA、XA事务模式

**角色**
- TM 
事务管理器 Transaction Manager，全局事务的管理者，或者说是全局事务的发起方
控制全局事务begin/commit/rollback，XID全局事务ID

- RM 
资源管理器 Resources Manager，负责分支(本地)事务注册、提交和回滚（分支事务没有begin）
regist branch、branch commit/rollback
BranchID分支事务ID
- TC
事务协调器 Transaction Coordinate，全局事务的协调者，TM/RM启动时注册到TC

**角色交互**
<!-- ![](2-Seata角色交互.png) -->
TM 申请开启全局事务，注册TM到TC
TC 返回XID
TM 调用RM服务，附带XID
RM 向TC注册，附带XID，本地事务执行上报TC
TM 通知TC提交事务
TC 通知RM删除undolog
TC 通知TM全局事务完成

# AT模式实现
Auto Transaction 无代码入侵，注解即可
默认会读到脏数据，@GlobalLock注解实现读已提交（一阶段结束释放本地事务锁，本地事务可更新数据）

## AT模式锁机制

- 普通行锁的问题
行锁在本地事务提交时释放，若此时全局事务回滚，但本地数据已被修改，会存在找不到原始数据问题
- 全局行锁
全局事务提交后释放，不会存在普通行锁的问题 

## AT模式执行流程
- 阶段一
解析SQL
保存before image（快照） 生成undo_log
执行SQL
保存after image
- 阶段二
    - 事务成功
    删除锁和undo_log删除before image删除after image
    - 事务失败
    通过undo_log回退数据

## 应用
- 配置undo log表
- 启动seata服务


**需要主事务的开启方business-service，调用业务提供方**
**`@GlobalTransaction`注解**
`@GlobalTransactional(name ="XXX",rollbackFor=Exception.class)`
只要在全局事务“开始”的地方把这个注解添加上去就好了，并不需要在每个分支事务中都声明它
碰到任何 Exception 异常，都会触发全局事务回滚操作，这个行为通过rollbackFor方法进展指定。

**每个库都需，新建undo_log表**

启动类排除DataSourceAutoConfiguration类
`@SpringBootApplication(scanBasePackages=,exclude ={DataSourceAutoConfiguration.class})`

# 思考题
AT模式虽然使用方式非常简单，但你觉得它有什么缺点?


# 其他
> [下载地址](https://seata.apache.org/zh-cn/docs/next/release-notes/)
