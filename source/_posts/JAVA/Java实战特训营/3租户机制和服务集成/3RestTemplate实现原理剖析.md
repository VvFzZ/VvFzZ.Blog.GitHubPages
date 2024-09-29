---
title: 3RestTemplate实现原理剖析
description: RestTemplate实现原理剖析
date: 2024-09-12 16:02:03
tags:
---

远程调用是分布式架构的基础

# RestTemplate设计思想
![](3-RestTemplate定义.png)

为什么要设计RestOperations、HttpAccessor两个类呢，在一个类中实现不行吗（在一个对象内构建对象，拦截请求）？
![](3-RestTemplate设计思想.png)

# RestTemplate执行流程

## exchange切入
![](3-RestTemplate执行流程-exchange.png)

## doexcute
![](3-RestTemplate执行流程-doexcute.png)

### 创建请求对象
![](3-RestTemplate执行流程-doexcute-1.png)

### 执行回调
![](3-RestTemplate执行流程-doexcute-2.png)

### 执行远程调用
#### ClientHttpRequest
![](3-RestTemplate执行流程-doexcute-3.png)

![](3-RestTemplate执行流程-doexcute-4.png)
### 处理结果
![](3-RestTemplate执行流程-doexcute-5.png)
![](3-RestTemplate执行流程-doexcute-6.png) 


# 设计模式总结
![](3-RestTemplate-设计模式.png)

模版方法模式：定制化处理过程

# 问题
RestTemplate和JdbcTemplate在设计上有什么相似性？