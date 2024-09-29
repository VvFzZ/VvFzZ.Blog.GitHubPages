---
title: Java实战特训营-2.2基于SpringData实现数据访问
date: 2024-09-07 09:22:40
tags:
description: 基于SpringData实现数据访问
---

# Spring Data
## Repository架构模式
![](2-Reporsitory架构模式.png)
Spring Data JPA更多关注Repository架构模式的实现，关注业务模型和数据对象间的映射
领域对象，不是纯粹的数据库数据存储对象（技术数据），面向业务的对象。
### SpringData
![](2-Reporsitory架构模式-SpringData2.png) 
![](2-Reporsitory架构模式-SpringData1.png)
## Spring Data JPA
JPA有一套接口规范，类似JDBC

### JPA规范
![](2-SpringData-JPA规范.png)

### 查询
- @Query
- 方法名衍生查询
- QueryByExample
- Specification机制

### 应用
依赖和配置
```
      <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/customer_hangzhou?serverTimezone=UTC&useUnicode=true&characterEncoding=utf8
    username: root
    password: root
  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
```
# N + 1问题

## JoinFetch解决
特定场景可用，如下第二个方法，要先查出所有在做条件判断In
![](2-JoinFech.png)
### 优缺点分析
![](2-JoinFech-2.png)

# 数据访问优化策略
- 优化Fetch Size 和连接池配置
- 使用批处理和选择合适的提交模式
- 通过统计找到数据访问瓶颈
- 使用延迟加载数据库访问
- 使用多级缓存提升数据访问性能
## Fetch Size
指定一次从数据库检索的行数，合理设置大小，可减低网络通信次数带来性能提升。
不可硬编码，确保其可配置，根据不同环境，JVM堆内存大小配置。
配置过大，可能导致内存不足（大量请求同时获取数据时）
## 连接池
![](2-连接池优化.png)
- 连接池大小 
一般偏大设置，但过大会导致性能下降，根据实际用户并发量进行性能测试结果设置。
- 检查连接泄露 默认配置
- 验证链接 默认配置

*多系统访问同一个数据库时，根据应用本身的属性考虑如何分配连接*。

## 使用批处理和选择合适的提交模式

数据库驱动程序在每个sql操作后向数据库发送一个提交请求，引起一个网络调用。

每次提交需将事务更改写入数据库，涉及耗时的磁盘IO。
可以把自动提交关闭，但有些应用为确保数据完整性不可关闭。
![](2-批处理和自动提交.png)

## 使用统计和延迟加载机制
延迟加载关联数据
统计数据，分析原始数据，找到系统瓶颈
![](2-统计和延迟加载.png)

## 多级缓存提升数据访问性能
![](2-多级缓存.png) 

### mybatis
![](2-多级缓存-mybatis.png)

# 其他
## spring data jpa & h2
![](2-h2.png)
## 其他解决方式
- EntityGraph
