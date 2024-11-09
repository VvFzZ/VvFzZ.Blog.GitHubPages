---
title: 1Redis
description: 1Redis
date: 2024-10-19 15:22:05
tags:
---
# 分布式缓存和Redis
REDIS REmote DIctionary Server

- NoSQL
- 数据结构
- 单线程
事件驱动的单线程应用程序
- 高性能
- 持久化
RDB AOF
- 高可用
哨兵机制，集群，主从

## 键过期策略
- 定时删除
主动 针对键设置定时器，占用CPU时间
- 惰性删除
被动 获取键时判断是否过期，占用内存
- 定期删除
主动 隔一段时间扫描数据库，折中方案

配合使用三种策略

## 事件驱动模型
redis是事件驱动程序
事件类型
- 文件类型 套接字抽象
- 时间类型 定时操作抽象

文件事件
reactor架构模式
![](1-reactor模式.png)
利用操作系统事件分离器（IO多路复用器）支持单线程在一系列事件源上同步等待事件，再将事件逐个分发给对应的事件处理程序（同步处理）


时间事件
serverCron：更新服务器缓存、更新LRU时间、更新服务器每秒执行命令次数、管理客户端资源、管理数据库资源、检查持久化运行状态

## 持久化
RDB、AOF

AOF相对完整取决于刷盘策略，定时刷盘可能会丢失某段时间的数据，实时刷盘不会丢失但性能低。

AOF重写，合并计算过程，只记录最终结果日志会消耗性能

## 集群
Redis集群通信协议Gossip
MEET 加入集群
PING/PONG 检测是否在线
FAIL 下线
PUBLISH 广播

# Redis数据类型
- String
- List
- Set
- ZSet (Sorted Set)
- Hash

# String

# List
队列支持很好 
# Set
不重复、无序
# ZSet (Sorted Set)
有序
- Hash
适合映射业务对象


# 客户端工具
- Jedis
- Lettuce
- Redisson

# Jedis
同步阻塞IO，不支持异步

# Lettuce
支持异步通信，线程安全
# Redisson
不仅仅是工具了。
集成性框架，提供开箱即用的分布式相关操作，如分布式锁，分布式集合

## Spring Data Redis
集成性框架。集成其他Redis客户端工具。

### 连接工厂和序列化
jdkSerializationRedis
JacksonJsonRedisSerializer 常用，功能丰富

### RedisTemplate

创建配置类
```
@Configuration
public class RedisConfig{
    @Bean
    RedisTemplate<string,string> redisTemplate=new RedisTemplate<>();
    ...
}
```
key操作 redisTemplate.*()
value 操作redisTemplate.opsForValue.*()






# 示例








