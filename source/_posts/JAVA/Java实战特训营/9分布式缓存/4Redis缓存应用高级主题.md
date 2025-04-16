---
title: 4Redis缓存应用高级主题
description: 4Redis缓存应用高级主题
date: 2024-10-19 15:26:46
tags:
---
- 缓存穿透
- 缓存击穿
- 缓存雪崩

redis提升性能：1.提升并发量、响应效率 2.减轻数据库压力

# 缓存穿透
缓存穿透(Cache Penetration)是指**查询缓存中和数据库中都不存在的数据**，导致每次查询这条数据都会透过缓存，直接查数据库并最终返回空值。
当用户使用这条不存在的数据疯狂发起查询请求的时候，对数据库造成的压力就非常大，可能压垮数据库。

**解决**
- 缓存空对象
优点：简单，维护方便
缺点：消耗额外内存，缓存与存储短期数据不一致

- 布隆过滤器

# 缓存击穿
某个热点数据过期后，重新载入缓存前，大量请求穿过缓存，直接查询数据库

1. 更新过期时间
    - 永不过期
    - 数据预热，提前存入缓存
    - 实时监控，调整过期时间
    定时任务，查询数据库是否存在，存在则刷新过期时间
2. 分布式锁
分布式锁保证同一时刻只能一个请求重新加载热点数据到缓存中，其他线程等待从Redis中获取数据，不再直接查询数据库

# 缓存雪崩
大量key同时过期，redis宕机

**击穿与雪崩的区别**
击穿是特定的热点数据来说
雪崩是全部数据

**应对策略**
1. key过期
    - 差异化设置过期时间
    初始化过期时间增加一个较小的随机数
    - 服务降级
    允许核心业务访问数据库，非核心业务直接返回预定义的信息
    - 过期时间更新
    实时监控数据，调整key过期时长
2. 宕机
    - Redis构建高可用集群
    通过主从节点的方式构建Redis高可用集群，避免缓存实例宕机
    - 请求限流
    控制每秒进入应用程序的请求数，避免过多的请求访问到数据库
    - 服务熔断
    暂停业务应用对缓存服务的访问，从而降低对数据库的压力

实现思路
- 差异化缓存过期时间 
`setWithLogicalExpire`
- 服务容错  
限流、熔断、降级
服务访问失败应对策略和Sentinel等开源框架

```
public void setWithLogicalExpire(String key, Object value, Long time, TimeUnit timeUnit){
    RedisData redisData =new RedisData();
    redisData.setData(value);
    redisData.setExpireTime(LocalDateTime.now().plusSeconds(timeUnit.toSeconds(time)));
    stringRedisTemplate.opsForValue(),set(key, JSON.toJsonString(redisData));
}
```

# 示例
```
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
</dependency>
```

# 思考题
应对缓存操作异常场景常见有哪些？有什么区别？
