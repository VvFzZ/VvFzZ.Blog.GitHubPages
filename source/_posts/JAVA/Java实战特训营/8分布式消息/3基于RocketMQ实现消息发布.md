---
title: 3基于RocketMQ实现消息发布
description: 3基于RocketMQ实现消息发布
date: 2024-10-16 17:06:59
tags:
---

学习目标
- RocketMQ消息抽象
- RocketMQ架构
- RocketMQ发送消息的实现

目录
- RocketMQ基本概念
- RocketMQ架构
- RocketMQ消息发送方式


# RocketMQ基本概念
**消息**
**主题topic**
一类消息的集合，包含多条消息，消息只属于一个主题
一个生产者可生产多种topic消息
一个消费者只订阅和消费一种topic消息
**队列queue**
也称为分区，存储消息的物理实体。
一个topic中可包含多个queue，队列中存放消息。
一个queue中的消息只能被一个消费者组中的一个消费者消费，不允许同一消费者组中多个消费者同时消费
**标签tag**
同一主题下消息的分类
同一业务单元的消息，根据不同业务目的在同一主题下设置不同标签。
标签能够有效地保是贝持代码的清晰度和连贯性，并优化RocketMQ提供的查询系统。消费者可以根据Tag实现对不同子主题的不同消费逻辑，实现更好的扩展性。
Topic是消息的一级分类，Tag是消息的二级分类
**生产者-生产者组**
生产者以生产者组形式出现
生产者组中的生产者发送相同topic类型的消息。
一个生产者组可同时发送不同主题消息
**消费者-消费者组**
消息消费者从Broker服务器获取消息并处理。
消费者组中的消费者消费相同topic类型消息。
**Broker**
存储转发消息，存储消息元数据（消费进度偏移量，主题，队列）。
负责接收并存储从生产者发送来的消息，同时为消费者的拉取请求作准备。
**Name Server**
Broker管理：管理Broker实例注册，心跳检查Broker是否存活
路由信息管理：生产者通过NameServer获取应发送消息到那个broker，消费者通过NameServer获取应从哪个broker拉消息。

## 执行流程
1. 启动NameServer:NameServer监听端口，等待Broker、生产者、消费者连接，相当于一个路由控制中心
2. 启动Broker:跟NameServer 保持长连接，定时发送心跳包
3. 创建Topic:创建Topic时需要指定该Topic要存储在哪些Broker上，也可以在发送消息时自动创建Topic
4. 发送消息：与NameServer建立长连接，获取topic，与topic队列所在的broker建立长连接，发送消息
5. 消费消息：与NameServer建立长连接，获取topic，与topic队列所在的broker建立通道，消费消息

# RocketMQ消息发送方式

## 普通消息
分类
- 单项消息
sendOneway，不关心结果
- 同步消息
send,阻塞等待结果,可设置超时
- 异步消息
通过回调，异步通知；
- 批量消息
同时支持同步/异步

比较
|发送方式|发送性能|发送反馈|发送可靠性|
|---|---|---|---|
|单向|最快|无|可能丢失|
|同步|快|有|不会丢失|
|异步|快|有|不会丢失|

# 示例
```
<dependency>
	<groupId>org.apache.rocketmq</groupId>
	<artifactId>rocketmq-spring-boot-starter</artifactId>
</dependency>

rocketmq:
    producer:
        group: produ_imcer_group
    name-server:127.0.0.1:9876
```
启动NameServer、broker

验证是否成功 工具：rocketMQ控制台
修改端口、nameserverAddr,打包启动


```
    @Autowired
    private RocketMQTemplate template;

    @Override
    public void saveMessage(ImMessage imMessage) {
        MessageCreatedEvent event = new MessageCreatedEvent();
        event.setMessage(Message);
        event.setType("ms");
        event.setOperation("CREATE");
        template.convertAndSend("topic", event);
    }
```
# 思考题
- 与netty区别
MQ是以消息为媒介的通讯框架，增加了存储转发功能
本质也是通讯框架
- 当使用RocketMO发送消息时，应该如何选择所发送消息的类型?