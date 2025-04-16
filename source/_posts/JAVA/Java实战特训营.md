---
title: Java实战特训营
description: Java实战特训营
date: 2024-09-18 21:56:17
tags:
---
> 大纲：https://shimo.im/docs/NcHLJu7Q2C8iZD75/read

## 单体架构案例分析实现
1. {%post_link JAVA/Java实战特训营/单体架构案例分析实现/1SpringBoot开发WebAPI 'SpringBoot开发WebAPI' %}
2. {%post_link JAVA/Java实战特训营/单体架构案例分析实现/2对WebAPI进行性能优化 '对WebAPI进行性能优化' %}
3. {%post_link JAVA/Java实战特训营/单体架构案例分析实现/3基于SpringJDBC实现数据访问 '基于SpringJDBC实现数据访问' %}
4. {%post_link JAVA/Java实战特训营/单体架构案例分析实现/4JDBCTemplate实现原理剖析 'JDBCTemplate实现原理剖析' %}
5. {%post_link JAVA/Java实战特训营/单体架构案例分析实现/5基于MyBatis实现数据访问 '基于MyBatis实现数据访问' %}
6. {%post_link JAVA/Java实战特训营/单体架构案例分析实现/6Mybatis和Spring集成原理剖析 'Mybatis和Spring集成原理剖析' %}

## 系统扩展、测试、监控
1. {%post_link JAVA/Java实战特训营/2系统扩展测试监控/1使用Mybatis-Plus对数据访问进行扩展 '使用Mybatis-Plus对数据访问进行扩展' %}
2. {%post_link JAVA/Java实战特训营/2系统扩展测试监控/2基于SpringData实现数据访问 '基于SpringData实现数据访问' %}
3. {%post_link JAVA/Java实战特训营/2系统扩展测试监控/3使用HATEOAS构建自解释WebAPI '使用HATEOAS构建自解释WebAPI' %}
4. {%post_link JAVA/Java实战特训营/2系统扩展测试监控/4使用WebFlux构建响应式WebAPI  '使用WebFlux构建响应式WebAPI' %}
5. {%post_link JAVA/Java实战特训营/2系统扩展测试监控/5使用GraphQL开发前后端分离WebAPI '使用GraphQL开发前后端分离WebAPI ' %}
6. {%post_link JAVA/Java实战特训营/2系统扩展测试监控/6SpringBoot测试解决方案和实践 'SpringBoot测试解决方案和实践' %}
7. {%post_link JAVA/Java实战特训营/2系统扩展测试监控/7使用SpringBootAdmin监控服务运行 '使用SpringBootAdmin监控服务运行' %}

## 租户机制和服务集成
1. {%post_link JAVA/Java实战特训营/3租户机制和服务集成/1构建多租户机制 '构建多租户机制' %}
2. {%post_link JAVA/Java实战特训营/3租户机制和服务集成/2实现跨服务HTTP请求和响应 '实现跨服务HTTP请求和响应' %}
3. {%post_link JAVA/Java实战特训营/3租户机制和服务集成/3RestTemplate实现原理剖析 'RestTemplate实现原理剖析' %}
4. {%post_link JAVA/Java实战特训营/3租户机制和服务集成/4基于xxljob实现数据同步机制  '基于xxl-job实现数据同步机制' %}
5. {%post_link JAVA/Java实战特训营/3租户机制和服务集成/5xxljob高级特性和执行原理解析 'xxl-job高级特性和执行原理' %}
6. {%post_link JAVA/Java实战特训营/3租户机制和服务集成/6基于总线机制重构集成系统 '基于总线机制重构集成系统 ' %}


## 分布式服务
1. {%post_link JAVA/Java实战特训营/4分布式服务/1分布式服务体系 '分布式服务体系' %}
2. {%post_link JAVA/Java实战特训营/4分布式服务/2RPC架构 'RPC架构' %}
3. {%post_link JAVA/Java实战特训营/4分布式服务/3使用Dubbo发布分布式服务 '使用Dubbo发布分布式服务' %}
4. {%post_link JAVA/Java实战特训营/4分布式服务/4Zookeeper服务发布和订阅机制解析  'Zookeeper服务发布和订阅机制解析' %}
5. {%post_link JAVA/Java实战特训营/4分布式服务/5使用Dubbo消费分布式服务 '使用Dubbo消费分布式服务' %}
6. {%post_link JAVA/Java实战特训营/4分布式服务/6Dubbo服务端与客户端通信原理解析 'Dubbo服务端与客户端通信原理解析 ' %}
7. {%post_link JAVA/Java实战特训营/4分布式服务/7实现分布式服务的容错 '实现分布式服务的容错 ' %}

梳理插件化架构及其实现原理？（目标：掌握 SPI 机制的功能特性以及在 Dubbo 框架中的应用方式和改进点）

JDKSPI
- 定义服务接口
- 在META-INF/services目录中创建服务接口命名的文件，配置实现类
- 通过META-INF/services/目录下的配置文件找到具体实现类并实例化

## 分布式通信
1. {%post_link JAVA/Java实战特训营/5分布式通信/1Netty和网络通信 'Netty和网络通信' %}
2. {%post_link JAVA/Java实战特训营/5分布式通信/2使用Netty实现IM系统 '使用Netty实现IM系统' %}
3. {%post_link JAVA/Java实战特训营/5分布式通信/3Netty可靠性和性能优化 'Netty可靠性和性能优化' %}
4. {%post_link JAVA/Java实战特训营/5分布式通信/4打造高伸缩性IM系统 '打造高伸缩性IM系统' %}

## 分布式数据库
1. {%post_link JAVA/Java实战特训营/6分布式数据库/1ShardingSphere '1引入ShardingSphere' %}
2. {%post_link JAVA/Java实战特训营/6分布式数据库/2利用ShardingSphere实现分库分表 '利用ShardingSphere实现分库分表' %}
3. {%post_link JAVA/Java实战特训营/6分布式数据库/3利用ShardingSphere实现强制路由和读写分离 '利用ShardingSphere实现强制路由和读写分离' %}
4. {%post_link JAVA/Java实战特训营/6分布式数据库/4利用ShardingSphere实现敏感数据加解密 '利用ShardingSphere实现敏感数据加解密' %}
5. {%post_link JAVA/Java实战特训营/6分布式数据库/5ShardingSphere分片引擎执行流程解析 'ShardingSphere分片引擎执行流程解析' %}



## 分布式搜索
1. {%post_link JAVA/Java实战特训营/7分布式搜索/1使用ElasticStack构建搜索能力 '使用ElasticStack构建搜索能力' %}
2. {%post_link JAVA/Java实战特训营/7分布式搜索/2构建底层索引和搜索机制 '构建底层索引和搜索机制' %}
3. {%post_link JAVA/Java实战特训营/7分布式搜索/3打造企业级搜索词库管理体系 '打造企业级搜索词库管理体系' %}
4. {%post_link JAVA/Java实战特训营/7分布式搜索/4使用ElasticSearch构建搜索服务 '使用ElasticSearch构建搜索服务' %}
5. {%post_link JAVA/Java实战特训营/7分布式搜索/5定制化搜索场景设计和实现 '定制化搜索场景设计和实现' %}

## 分布式消息
1. {%post_link JAVA/Java实战特训营/8分布式消息/1事件驱动架构和原理 '事件驱动架构和原理' %}
2. {%post_link JAVA/Java实战特训营/8分布式消息/2消息通信机制和中间件 '消息通信机制和中间件' %}
3. {%post_link JAVA/Java实战特训营/8分布式消息/3基于RocketMQ实现消息发布 '基于RocketMQ实现消息发布' %}
4. {%post_link JAVA/Java实战特训营/8分布式消息/4基于RocketMQ实现消息消费 '基于RocketMQ实现消息消费' %}
5. {%post_link JAVA/Java实战特训营/8分布式消息/5RocketMQ高级特性 'RocketMQ高级特性' %}

## 分布式缓存
1. {%post_link JAVA/Java实战特训营/9分布式缓存/1Redis 'Redis' %}
2. {%post_link JAVA/Java实战特训营/9分布式缓存/2SpringCache缓存抽象和实现原理 'SpringCache缓存抽象和实现原理' %}
3. {%post_link JAVA/Java实战特训营/9分布式缓存/3基于Redis实现分布式锁 '基于Redis实现分布式锁' %}
4. {%post_link JAVA/Java实战特训营/9分布式缓存/4Redis缓存应用高级主题 'Redis缓存应用高级主题' %}

## 微服务架构体系
1. {%post_link JAVA/Java实战特训营/10微服务架构体系/1微服务架构体系 '微服务架构体系' %}
2. {%post_link JAVA/Java实战特训营/10微服务架构体系/2使用新一代注册中心 '使用新一代注册中心' %}
3. {%post_link JAVA/Java实战特训营/10微服务架构体系/3使用OpenFeign重构远程调用过程 '使用OpenFeign重构远程调用过程' %}
4. {%post_link JAVA/Java实战特训营/10微服务架构体系/4使用SpringCloudLoadBalancer重构服务在均衡 '使用SpringCloudLoadBalancer重构服务在均衡' %}
5. {%post_link JAVA/Java实战特训营/10微服务架构体系/5SpringCloudLoadBalancer负载均衡架构解析 'SpringCloudLoadBalancer负载均衡架构解析' %}


## 微服务技术组件
1. {%post_link JAVA/Java实战特训营/11微服务技术组件/1使用Nacos实现集中式配置管理 '使用Nacos实现集中式配置管理' %}
2. {%post_link JAVA/Java实战特训营/11微服务技术组件/2Nacos核心技术解析 'Nacos核心技术解析' %}
3. {%post_link JAVA/Java实战特训营/11微服务技术组件/3使用SpringCloudStream重构消息通信机制 '使用SpringCloudStream重构消息通信机制' %}
4. {%post_link JAVA/Java实战特训营/11微服务技术组件/4SpringCloudStream和消息中间件整合机制解析 'SpringCloudStream和消息中间件整合机制解析' %}
5. {%post_link JAVA/Java实战特训营/11微服务技术组件/5使用SpringCloudGateway实现API网关 '使用SpringCloudGateway实现API网关' %}

## SpringCloudSecurity
1. {%post_link JAVA/Java实战特训营/12SpringCloudSecurity/1SpringSecurity认证授权 'SpringSecurity认证授权' %}
2. {%post_link JAVA/Java实战特训营/12SpringCloudSecurity/2SpringSecurity核心原理 'SpringSecurity核心原理' %}
3. {%post_link JAVA/Java实战特训营/12SpringCloudSecurity/3SpringSecurity扩展 'SpringSecurity扩展' %}
4. {%post_link JAVA/Java实战特训营/12SpringCloudSecurity/4SpringCloudSecurity和OAuth2协议 'SpringCloudSecurity和OAuth2协议' %}

## 分布式事务应用

1. {%post_link JAVA/Java实战特训营/13分布式事务应用/1分布式事务的实现策略和模式 '分布式事务的实现策略和模式' %}
2. {%post_link JAVA/Java实战特训营/13分布式事务应用/2基于Seata实现AT业务无侵入式事务 '基于Seata实现AT业务无侵入式事务' %}
3. {%post_link JAVA/Java实战特训营/13分布式事务应用/3基于Seata实现TCC分布式事务 '基于Seata实现TCC分布式事务' %}
4. {%post_link JAVA/Java实战特训营/13分布式事务应用/4Seata分布式事务模式选型 'Seata分布式事务模式选型' %}
5. {%post_link JAVA/Java实战特训营/13分布式事务应用/5基于RocketMQ实现可靠事件模式 '基于RocketMQ实现可靠事件模式' %}

## 系统可用性
1. {%post_link JAVA/Java实战特训营/14系统可用性/1系统可用性常见策略及实现01 '系统可用性常见策略及实现01' %}
2. {%post_link JAVA/Java实战特训营/14系统可用性/3基于Sentinel实现流量控制01 '基于Sentinel实现流量控制01' %}
3. {%post_link JAVA/Java实战特训营/14系统可用性/7基于Sentinel实现服务降级01 '基于Sentinel实现服务降级01' %}
4. {%post_link JAVA/Java实战特训营/14系统可用性/10Sentinel限流和降级扩展01 'Sentinel限流和降级扩展01' %}

## 能力模型建设
1. {%post_link JAVA/Java实战特训营/15能力模型建设/1技术原理相通性的应用 '技术原理相通性的应用' %}

