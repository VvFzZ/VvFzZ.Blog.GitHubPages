---
title: 1使用Nacos实现集中式配置管理
description: 1使用Nacos实现集中式配置管理
date: 2024-11-02 16:46:06
tags:
---
学习目标
- 配置中心基本模型
- Nacos作为配置中心的功能特性

# 配置中心模型
**配置中心基本概念**
应对多服务、多环境、集群化提供集中式管理
需考虑隔离性、一致性、安全性、易管理

**配置中心组成结构**
客户端：嵌入微服务
配置服务器：与客户端配置交互
配置仓库：存放配置信息

**相关工具**
Etcd
Consul
Nacos
Disconf
Apollo
Diamond
Spring Cloud config

**配置中心关键技术**
- 变更通知机制
长轮训
![](1-长轮训机制.png)

# Nacos作为配置中心的功能特性
## DataId
配置中心的Datald等同于注册中心的Service，所有关于注册中心的分级模型都适用于配置中心

资源分级：Namespace -> Group -> Service/DataId
**DataId命名规则**
可以采用自定义的命名规则推荐命名规则:
`${prefix}-${spring.profile.active}.${file-extension}`

- prefix
默认为所属服务配置spring.application.name的值，也可以通过配置项spring.cloud.nacos.config.prefix进行设置
- spring.profiles.active
为当前环境对应的Profile。注意:当 spring.profiles.active为空时，对应的连接符-也将不存在，Datald的拼接格式变成 ${prefix}.${file-extension}
- file-exetension
为配置内容的数据格式，可以通过配置项spring.cloud.nacos.config.file-extension来配置，推荐使用yaml格式


- 配置文件格式 
.yml+.properties 
- 配置文件加载顺序
bootstrap.yml先加载，application.yml后加载
- 配置文件内容组织
bootstrap.yml:系统级别参数配置，一般不会变动
application.yml:用来定义应用级别的参数配置
- 配置文件格式一致性
配置文件的后缀必须与Datald的后缀保持一致，
如:本地使用.yml则Nacos中配置文件必须也应该是.yml

## 配置信息隔离
非生产环境 Profile区分环境
生产环境 使用独立的Nacos

## 配置共享
抽取共用配置单独进行维护,避免重复创建和管理
![](1-配置共享示例.png)
**shared-configs**
```
spring:
 application:
  name: demo-service
 cloud:
  nacos:
   config:
    server-addr: local:8848
    namespace: dev
    group: demo_group
    ...
    shared-configs[3]: #shared-configs数组 
     #不能设置自定义的Group，只能为DEFAULT_GROUP
     data-id: mysql.yaml 
     refresh: true  #默认true
```
**extension-configs**
覆盖共享配置项时可使用
```
spring:
 application:
name: demo-service
 cloud:
  nacos:
   config:
   server-addr: local:8848
   namespace:dev
   group:emo_group
   ...
   shared-configs[3]:
    data-id: mysql.yaml
    refresh: true
   ...
   extension-configs[3]: # 覆盖共享datald的属性可以使用
    data-id: mysql.yaml
    group: demo #必须指定Group
    refresh: true
```
**优先级**
- 不同种类配置优先级
主配置 > 扩展配置(extension-configs) > 共享配置(shared-configs)
- 同种类配置优先级
数组元素对应的下标越大，优先级越高，如:extension-config[2] > extension-configs[1]
> extension-configs[0]
- 不同环境配置优先级
![](1-不同环境配置优先级.png)
## 配置灰度发布
让配置先在部分实例生效，如果效果理想全量发布到所有实例，如果效果不理想就可以放弃当前的发布内容。
如:
对于影响大的配置，可先在一个或者多个实例生效，观察一段时间没问题再全量发布;
对于一些需要调优的配置参数，可以通过灰度发布功能来实现A/B测试。

## 配置热更新
- 无法热更新
影响应用运行状态的配置
例如:数据库连接配置
需要重新创建数据库连接
会影响Spring Bean的自动装载

- 可以热更新
业务运行所需的数据
例如:用户默认密码
直接修改配置数据
只修改配置数据本本身

### 实现
**@Value**
使用`@Refreshscope`
```
#自定义配置性cs.customer.point = 10
@Component
@Refreshscope
public class Customconfig {
@Value("${cs.customer.point}")
    private int point;
}
```

**@ConfigurationProperties**
自动支持热更新，不需代码改造

# 示例
1. 新建`bootstrap.ymal`
需引入依赖
```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-startebootstrap</artifactId>
</dependency>
```

```
spring:
  application:
    name: customer-task
  profiles:
    active: @spring.profiles.active@
  cloud:
    nacos:
      config:
        server-addr: @spring.cloud.nacos.config.server-addr@
        file-extension: yml
        refresh-enabled: true
      discovery:
        server-addr: @spring.cloud.nacos.discovery.server-addr@
  main:
    allow-bean-definition-overriding: true
```

2. 在nacos创建配置文件
DataId规则：applicationName-profile.extension



# 思考题
## 什么是长轮训？实现机制？实现方式？

## 结合日常开发中的具体场景，谈谈你对如何基于Nacos合理组织系统配置信息的经验和教训？



