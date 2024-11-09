---
title: 3利用ShardingSphere实现强制路由和读写分离
description: 3利用ShardingSphere实现强制路由和读写分离
date: 2024-10-07 15:05:22
tags:
---
学习目标
- 理解数据库强制路由和读写分离架构的基本概念
- 使用ShardingSphere实现强制路由和读写

目录
- ShardingSphere强制路由
- ShardingSphere读写分离

# 强制路由
（不建议使用）
不使用分片键和分片策略实现路由访问某张表
关系型数据库中，Hint允许用户通过相关语法改变SQL的执行计划而实现对SQL进行特殊的优化。很多数据库工具也提供了特殊的Hint语法。
举例说明：
MySQL为例，对索引的强制和忽略机制。
强制使用索引`SELECT*FROM TABLE1 FORCE INDEX(FIELD1)`
强制取消索引`SELECT*FROM TABLE1 IGNORE INDEX(FIELD1,FIELD2)`

`HintManager`
`HintShardingAlgorithm`

# 读写分离
负载均衡策略完成从库选取并读取
当主从数据不一致时，采用强制路由访问主库 `HintManager.masterRouteOnly`设置强制访问主库
*ShardingSphere不能支持主从数据同步，数据同步需数据库实现*

## 未分库主从读写分离配置
```
spring.shardingsphere.rules.readwrite-splitting.data-sources.readwrite_ds.type=Static 
## 写库配置
spring.shardingsphere.rules.readwrite-splitting.data-sources.readwrite_ds.props.write-data-source-name=dswrite
## 读库配置
spring.shardingsphere.rules.readwrite-splitting.data-sources.readwrite_ds.props.read-data-source-names=dsread0,dsread1
# 从库轮训读取
spring.shardingsphere.rules.readwrite-splitting.data-sources,readwrite_dsload-balancer-name=round_robin
spring.shardingsphere.rules.readwrite-splitting.load-balancers.round robin.type=ROUND_ROBIN
```
`readwrite-splitting` 读写分离配置结点
`Static` 一主多从

## 分库主从读写分离配置
```

spring.shardingsphere.datasource.names=dswrite0,dswrite1,dswrite0read0,dswrite0read1,dswrite1read0,dswrite1read1

spring.shardingsphere.datasource.dswrite0.url=jdbc:mysql://127.0.0.1:3306/dswrite0?serverTimezone=UTC&useSSL=false&useUnicode=true&characterEncoding=UTF-8
spring.shardingsphere.datasource.dswrite0.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.dswrite0.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.dswrite0.username=root
spring.shardingsphere.datasource.dswrite0.password=root
spring.shardingsphere.datasource.dswrite0.max-active=16

spring.shardingsphere.datasource.dswrite0read0.url=jdbc:mysql://127.0.0.1:3306/dswrite0read0?serverTimezone=UTC&useSSL=false&useUnicode=true&characterEncoding=UTF-8
spring.shardingsphere.datasource.dswrite0read0.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.dswrite0read0.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.dswrite0read0.username=root
spring.shardingsphere.datasource.dswrite0read0.password=root
spring.shardingsphere.datasource.dswrite0read0.max-active=16

spring.shardingsphere.datasource.dswrite0read1.url=jdbc:mysql://127.0.0.1:3306/dswrite0read1?serverTimezone=UTC&useSSL=false&useUnicode=true&characterEncoding=UTF-8
spring.shardingsphere.datasource.dswrite0read1.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.dswrite0read1.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.dswrite0read1.username=root
spring.shardingsphere.datasource.dswrite0read1.password=root
spring.shardingsphere.datasource.dswrite0read1.max-active=16

spring.shardingsphere.datasource.dswrite1.url=jdbc:mysql://127.0.0.1:3306/dswrite1?serverTimezone=UTC&useSSL=false&useUnicode=true&characterEncoding=UTF-8
spring.shardingsphere.datasource.dswrite1.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.dswrite1.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.dswrite1.username=root
spring.shardingsphere.datasource.dswrite1.password=root
spring.shardingsphere.datasource.dswrite1.max-active=16

spring.shardingsphere.datasource.dswrite1read0.url=jdbc:mysql://127.0.0.1:3306/dswrite1read0?serverTimezone=UTC&useSSL=false&useUnicode=true&characterEncoding=UTF-8
spring.shardingsphere.datasource.dswrite1read0.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.dswrite1read0.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.dswrite1read0.username=root
spring.shardingsphere.datasource.dswrite1read0.password=root
spring.shardingsphere.datasource.dswrite1read0.max-active=16

spring.shardingsphere.datasource.dswrite1read1.url=jdbc:mysql://localhost:3306/dswrite1read1?serverTimezone=UTC&useSSL=false&useUnicode=true&characterEncoding=UTF-8
spring.shardingsphere.datasource.dswrite1read1.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.dswrite1read1.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.dswrite1read1.username=root
spring.shardingsphere.datasource.dswrite1read1.password=root
spring.shardingsphere.datasource.dswrite1read1.max-active=16


spring.shardingsphere.rules.sharding.default-database-strategy.standard.sharding-column=to_user_id
spring.shardingsphere.rules.sharding.default-database-strategy.standard.sharding-algorithm-name=database-inline
spring.shardingsphere.rules.sharding.broadcast-tables=im_business_type

spring.shardingsphere.rules.sharding.tables.im_message.actual-data-nodes=ds$->{0..1}.im_message
spring.shardingsphere.rules.sharding.tables.im_message.key-generate-strategy.column=id
spring.shardingsphere.rules.sharding.tables.im_message.key-generate-strategy.key-generator-name=snowflake

spring.shardingsphere.rules.sharding.key-generators.snowflake.type=SNOWFLAKE

spring.shardingsphere.rules.sharding.sharding-algorithms.database-inline.type=INLINE
spring.shardingsphere.rules.sharding.sharding-algorithms.database-inline.props.algorithm-expression=ds$->{to_user_id % 2}

# 配置逻辑数据源ds0 ds1与物理数据源的对应关系
spring.shardingsphere.rules.readwrite-splitting.data-sources.ds0.type=Static
spring.shardingsphere.rules.readwrite-splitting.data-sources.ds0.props.write-data-source-name=dswrite0
spring.shardingsphere.rules.readwrite-splitting.data-sources.ds0.props.read-data-source-names=dswrite0read0, dswrite0read1
spring.shardingsphere.rules.readwrite-splitting.data-sources.ds1.type=Static
spring.shardingsphere.rules.readwrite-splitting.data-sources.ds1.props.write-data-source-name=dswrite1
spring.shardingsphere.rules.readwrite-splitting.data-sources.ds1.props.read-data-source-names=dswrite1read0, dswrite1read1

spring.shardingsphere.props.sql-show=true

```
## 分库分表主从读写分离配置


