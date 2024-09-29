---
title: 基于SpringJDBC实现数据访问
date: 2024-09-04 20:09:05
tags:
description: 基于SpringJDBC实现数据访问
---

# 数据持久化和JDBC规范

## 数据持久化开发

![](1-数据持久化.png)
JDBC：底层开发规范
SpringJDBC： 封装JDBC 但还是偏底层，不能称作ORM

## JDBC规范
### 整体架构
![](1-整体架构.png)
JDBC Driver Manager 驱动管理器，包含针对各种数据库封装不同驱动

### 原生API
DataSource
Connection
Statement
ResultSet

![](1-JDBC规范-原生API.png)

#### 存在问题
- 过于底层且复杂，很多重复异常处理，资源回收操作
- 业务与数据访问代码耦合
引入SpringJDBC解决这些问题

## SpringJDBC组件
### Spring JDBC
提供两个工具类
- jdbcTemplate
- SimplejdbcInsert(完善jdbcTemplate插入弱问题)
![](1-SpringJDBC定位.png)

#### jdbcTemplate
![](1-SpringJDBCTemplate.png)

#### SimpleJdbcInsert
![](1-SimpleJdbcInsert.png)
使用SimpleJdbcInsert插入时，非空字段即使有默认值也需要赋值


## 问题
相比jdbcTemplate ，SimplejdbcInsert如何简化数据插入操作？
利用类似模版方法和回调方法，封装重复操作（获取链接、创建statement、关闭资源等），回调方法收集结果集。