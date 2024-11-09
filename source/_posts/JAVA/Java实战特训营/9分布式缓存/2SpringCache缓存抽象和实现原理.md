---
title: 2SpringCache缓存抽象和实现原理
description: 2SpringCache缓存抽象和实现原理
date: 2024-10-19 15:26:07
tags:
---

集成缓存工具

- 理解Spring对缓存的抽象过程和实现原理
- 掌握SpringCache使用方法

掌握分布式缓存的基础是理解缓存的组成结构和抽象过程

目录
- Spring缓存的抽象和使用过程
- Spring缓存实现原理

# Spring缓存的抽象和使用过程
Spring Cache组件的核心优势：
设计并实现了抽象层，提供统一的缓存API
![](2-springCache统一API.png)

## 缓存抽象

- 缓存注解，自动启用缓存机制
- 缓存配置
### 缓存注解
通过配置集成缓存工具（Redis、Guava、Hazelcast、EhCache、Caffeine）或自定义缓存

**@Cacheable**
condition="# id%2==0"  id模2为0时才缓存

**@CachePut** 
替换
**@CacheEvict** 
删除
**@Caching**
符合注解

**自定义缓存注解**
id和name都可作为缓存键，可根据id或name更新缓存

**缓存键**
自定义缓存键

默认键

### 缓存配置

**CacheManager**
配置类注解@EnableCaching启动SpringCache功能

EhCache配置示例
```

```

#### 使用
SpringSecurity 认证缓存 


# Spring缓存实现原理？？？???
**Cache**

**CachManager**
多平台适配
不同的Manager实现，管理内存的方式不同

**@EnableCaching**


**CacheInterceptor**
 Autoconfig类中的CachInterceptor
 execute方法，生成key，获取缓存对象，
何时执行的？





