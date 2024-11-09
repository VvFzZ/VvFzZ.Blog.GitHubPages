---
title: 4利用ShardingSphere实现敏感数据加解密
description: 4利用ShardingSphere实现敏感数据加解密
date: 2024-10-07 15:06:15
tags:
---

学习目标
- 数据脱敏的基本概念和设计思想
- 掌握ShardingSphere数据加解密的实现方法

目录
- 数据脱敏的场景和应用
- ShardingSphere加解密机制

# 数据脱敏的场景和应用
医疗健康领域、电子消费领域、银行保险领域
身份证号、手机号、卡号、用户姓名、账号密码

如何抽象出一套通用的脱敏解决方案？
- 如何存储
两种策略：只有密文列；明文列和密文列
- 如何加解密
对称加密（DES AES）、非对称加密（RSA DSA）
- 业务代码如何嵌入
目标：减少入侵性，自动化
自动化：自动将字段映射到明文列和密文类
配置化：灵活指定脱敏过程中所采用的各种加解密算法

# ShardingSphere加解密机制
## 存储
- 明文列 plainColumn
- 密文列 cipherColumn
- 逻辑列 logicColumn

设置分库分片，逻辑列虽然内容是明文，但独立于明文列存在,分离职责，明文列有时会有特殊处理（不存储等）
- 查询列 assistedQueryColumn
用于查询操作

## 加解密
`EncryptAlgorithm`接口
类：`SM3EncryptAlgorithm`、`SM4EncryptAlgorithm`、`RC4EncryptAlgorithm`、`AESEncryptAlgorithm`、`MD5EncryptAlgorithm`

## 嵌入
应用程序访问逻辑列如user_name 数据库存储user_name_cipher、user_name_plain
user_name 自动映射user_name_cipher、user_name_plain

### ShardingSphere加解密基本原理
**SQL改写**
基于脱敏配置对原始sql改写，把逻辑列转换为数据库列，自动映射明文和密文

### 加解密配置
```
# 指定敏感数据列
spring.shardingsphere.rules.encrypt.tables.t user.columns.username.cipher-column=username
spring.shardingsphere.rules.encrypt.tables.t user.columns.pwd.cipher-column=password
# 设置列的加解密器名称
spring.shardingsphere.rules.encrypt.tables.t user.columns.username.encryptor-name=name-encryptor
spring.shardingsphere.rules.encrypt.tables.t user.columns.pwd.encryptor-name=password-encryptor
# 加解密器类型
spring.shardingsphere.rules.encrypt.encryptors.name-encryptor.type=AES
spring.shardingsphere,rules.encrypt.encryptors.password-encryptor.type=AES
# 加解密秘钥
spring.shardingsphere.rules.encrypt.encryptors.name-encryptor.props.aes-key-value=123456abc
spring.shardingsphere.rules.encrypt.encryptors.password-encryptor.props.aes-key-value=123456abc

# true查询密文解密后返回，false返回密文
spring.shardingsphere.props.query-with-cipher-column=true
```

#### 示例

```
spring.shardingsphere.datasource.names=ds4

spring.shardingsphere.datasource.ds4.type=com.alibaba.druid.pool.DruidDataSource
spring.shardingsphere.datasource.ds4.driver-class-name=com.mysql.jdbc.Driver
spring.shardingsphere.datasource.ds4.url=jdbc:mysql://127.0.0.1:3306/ds4?serverTimezone=UTC&useSSL=false&useUnicode=true&characterEncoding=UTF-8
spring.shardingsphere.datasource.ds4.username=root
spring.shardingsphere.datasource.ds4.password=root

spring.shardingsphere.rules.encrypt.encryptors.username-encryptor.type=AES
spring.shardingsphere.rules.encrypt.encryptors.username-encryptor.props.aes-key-value=123456abc

spring.shardingsphere.rules.encrypt.tables.im_message.columns.from_username.cipher-column=from_username # 只有一列密文列
spring.shardingsphere.rules.encrypt.tables.im_message.columns.from_username.encryptor-name=username-encryptor
spring.shardingsphere.rules.encrypt.tables.im_message.columns.to_username.cipher-column=to_username
spring.shardingsphere.rules.encrypt.tables.im_message.columns.to_username.encryptor-name=username-encryptor

spring.shardingsphere.props.query-with-cipher-column=true # 默认true

spring.shardingsphere.props.sql-show=true
```




