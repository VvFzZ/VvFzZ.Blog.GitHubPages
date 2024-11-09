---
title: 2利用ShardingSphere实现分库分表
description: 2利用ShardingSphere实现分库分表
date: 2024-10-07 15:05:15
tags:
---
学习目标
- 系统集成ShardingSphere的方式
- ShardingSphere配置体系
- ShardingSphere数据分片实现方式

目录
- 集成方式
- 配置体系
- 数据分片

# 集成方式


# 配置体系
## 行表达式
主键管理策略：生成策略、配置分片列 
## 核心配置
### 分片策略 ShardingStrategyConfiguration
NoneShardingStrategyConfiguration:不分片
HintShardingStrategyConfiguration:强制路由分片
ComplexShardingStrategyconfiguration:多分片键复杂分片
StandardShardingStrategyConfiguration:标准分片
# 数据分片
## 开发步骤
1. 初始化数据源
2. 配置分片策略
3. 设置绑定表和广播表

4. 设置分片规则

### 初始化数据源
```
//yaml配置
spring:
    shardingsphere :
        dataSources:
            dswrite:!!com.alibaba.druid.pool.DruidDataSource
                driverClassName: com.mysql.jdbc.Driver
                url: jdbc:mysql://127.0.0.1:3306/dswrite
                username: root
                password: root
            dsread0:!!com.alibaba.druid.pool.DruidDataSource
                driverClassName:com.mysql.jdbc.Driver
                url: jdbc:mysql://127.0.0.1:3306/dsreado
                username:root
                password: root

//Properties配置
spring.shardingsphere.datasource.dswrite.url=jdbc:mysql://127.0.0.1:3306/dswrite
spring.shardingsphere.datasource.dswrite.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.dswrite.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.dswrite.username=root
spring.shardingsphere.datasource.dswrite.password=root

spring.shardingsphere.datasource.dsread0.url=jdbc:mysgl://127.0.0.1:3306/dsread0
spring.shardingsphere.datasource,dsread0.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.dsread0.driver-class-name=com.mysql.idbc.Driver
spring.shardingsphere.datasource.dsread0.username=root
spring.shardingsphere.datasource.dsread0.password=root
```
### 配置分片策略

```
spring.shardingsphere.rules.sharding.default-database-strategy.standard.sharding-column=user_id
spring.shardingsphere.rules.sharding.default-database-strategy.standard.sharding-algorithm-name=database-inline

spring.shardingsphere.rules.sharding.sharding-algorithms.database-inline.type=INLINE
spring.shardingsphere.rules.sharding.sharding-algorithms.database-inline.props.algorithm-expression=ds$->{user_id % 2}
```
`default-database-strategy.standard` 默认分库策略.标准分片
`sharding-algorithm-name`分片算法名：`database-inline`是自定义的名字
`sharding-column`分片键
`algorithm-expression`：分片表达式，分片算法
分片键user_id与分片表达式中的字段一致

### 设置绑定表和广播表
- 绑定表
指分片规则一致的一组关联的主数据表和子数据表
互为绑定表多表关联查询不会做笛卡尔积，提升效率
互为绑定表需分片键完全相同
```
//设置绑定表spring.shardingsphere.rules.sharding.binding-tables[0]=health_record, health_task
```
- 广播表
所有分片数据源中都存在的表
```
spring.shardingsphere.rules.sharding.broadcast-tables=health_level
```
#### 举例说明绑定表
```
//原始SQL
SELECT record.remark name FROM health record record JOIN health task task ON record.record_id=task.record_id WHERE record.record_id in (1,2);

//不设置绑定表场景(两张分表 共四张表record0 record1 task0 task1)
//四次JOIN ：
//record0 JOIN task0
//record0 JOIN task1
//record1 JOIN task0
//record1 JOIN task1

SELECT record.remark name FROM health record0 record JOIN health task0 task ON record.record_id=task.record_id WHERE record.record_id in (1, 2);

SELECT record.remark name FROM health record0 record JOIN health task1 task ON record.record_id=task.record_id WHERE record.record_id in (1, 2);

SELECT record.remark name FROM health record1 record JOIN health task0 task ON record.record_id=task.record_id WHERE record.record_id in (1, 2);

SELECT record.remark name FROM health record1 record JOIN health task1 task ON record.record_id=task.record_id WHERE record.record_id in (1, 2);

//设置绑定表场景(两张分表 共四张表)
//设置了绑定表，根据record_id分片，则可明确得知不需要
join record0 task1 、record1 task0


SELECT record.remark name FROM health record0 record JOIN health task0 task ONrecord.record_id=task.record_id WHERE record.record_id in (1, 2);
SELECT record.remark name FROM health, record1 record JOIN health task1 task ON record.record_id=task.record_id WHERE record.record_id in(1,2)
```


### 设置分片规则
#### 分库规则
```
spring.shardingsphere.rules.sharding.default-database-strategy.standard.sharding-column=patient_id
spring.shardingsphere.rules.sharding.default-database-strategy.standard.sharding-algorithm-name=database-inline

spring.shardingsphere.rules.sharding.sharding-algorithms.database-inline.type=INLINE
spring.shardingsphere.rules.sharding.sharding-algorithms.database-inline.props.algorithm-expression=ds$->{patient_id % 2}
```
#### 分表规则
//未分库
```
spring.shardingsphere.rules.sharding.tables.t_consultation.actual-data-nodes=ds.t_consultation$->{0..2}
spring.shardingsphere.rules.sharding.tables.t_consultation.table-strategy.standard.sharding-column=consultation_id
spring.shardingsphere.rules.sharding.tables.t_consultation.table-strategy.standard.sharding-algorithm-name=t_consultation-inline

spring.shardingsphere.rules.sharding.sharding-algorithms.t_consultation-inline.type=INLINE
spring.shardingsphere.rules.sharding.sharding-algorithms.t_consultation-inline.props.algorithm-expression=t_consultation$->{consultation id % 3}
```

`ds.t_consultation$->{0..2}` *设置表名，ds代表数据源，表分三个t_consultation0，t_consultation1，t_consultation2*
`spring.shardingsphere.rules.sharding.tables.t_consultation` *t_consultation 数据库表名*
`{consultation id % 3}`分片算法 需与前面配置表名相对应（`ds.t_consultation$->{0..2}`），%3对应分3张表

#### 分库分表规则
```
//设置分库分片键
spring.shardingsphere.rules.sharding.default-database-strategy.standard.sharding-column=patient_id
spring.shardingsphere.rules.sharding.default-database-strategy.standard.sharding-algorithm-name=database-inline

//设置分表表名和分片键
spring.shardingsphere.rules.sharding.tables.t consultation.actual-data-nodes=ds$->{2..3}.t_consultation$->{0..2}
spring.shardingsphere.rules.sharding.tables.t_consultation.table-strategy.standard.sharding-column=consultation id
spring.shardingsphere.rules.sharding.tables.t_consultation.table-strategy.standard.sharding-algorithm-name=t_consultation-inline

//设置分库分片算法
spring.shardingsphere.rules.sharding.sharding-algorithms.database-inline.type=INLINE
spring.shardingsphere.rules.sharding.sharding-algorithms.database-inline.props.algorithm-expression=ds$->{patient_id % 2}
//设置分表分片算法
spring.shardingsphere.rules.sharding.sharding-algorithms.t_consultation-inline.type=INLINE
spring.shardingsphere.rules.sharding.sharding-algorithms.t_consultation-inline.props.algorithm-expression=t_consultation$->{consultation_id % 3}
```

### 示例
分库+分表
```
spring.shardingsphere.datasource.names=ds2,ds3

spring.shardingsphere.datasource.ds2.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.ds2.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.ds2.url=jdbc:mysql://127.0.0.1:3306/ds2?serverTimezone=UTC&useSSL=false&useUnicode=true&characterEncoding=UTF-8
spring.shardingsphere.datasource.ds2.username=root
spring.shardingsphere.datasource.ds2.password=root

spring.shardingsphere.datasource.ds3.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.ds3.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.ds3.url=jdbc:mysql://127.0.0.1:3306/ds3?serverTimezone=UTC&useSSL=false&useUnicode=true&characterEncoding=UTF-8
spring.shardingsphere.datasource.ds3.username=root
spring.shardingsphere.datasource.ds3.password=root

spring.shardingsphere.rules.sharding.default-database-strategy.standard.sharding-column=to_user_id
spring.shardingsphere.rules.sharding.default-database-strategy.standard.sharding-algorithm-name=database-inline
spring.shardingsphere.rules.sharding.broadcast-tables=im_business_type


spring.shardingsphere.rules.sharding.tables.im_message.actual-data-nodes=ds$->{2..3}.im_message$->{0..2}
spring.shardingsphere.rules.sharding.tables.im_message.table-strategy.standard.sharding-column=to_user_id
spring.shardingsphere.rules.sharding.tables.im_message.table-strategy.standard.sharding-algorithm-name=im_message-inline

spring.shardingsphere.rules.sharding.tables.im_message.key-generate-strategy.column=id
spring.shardingsphere.rules.sharding.tables.im_message.key-generate-strategy.key-generator-name=snowflake

spring.shardingsphere.rules.sharding.sharding-algorithms.database-inline.type=INLINE

spring.shardingsphere.rules.sharding.sharding-algorithms.database-inline.props.algorithm-expression=ds$->{from_user_id % 2 + 2}
spring.shardingsphere.rules.sharding.sharding-algorithms.im_message-inline.type=INLINE
spring.shardingsphere.rules.sharding.sharding-algorithms.im_message-inline.props.algorithm-expression=im_message$->{to_user_id % 3}

spring.shardingsphere.rules.sharding.key-generators.snowflake.type=SNOWFLAKE

spring.shardingsphere.props.sql-show=true

```