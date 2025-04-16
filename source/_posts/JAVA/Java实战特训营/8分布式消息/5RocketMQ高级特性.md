---
title: 5RocketMQ高级特性
description: 5RocketMQ高级特性
date: 2024-10-16 17:07:11
tags:
---

学习目标
- 消息处理的高级特性
- 消息发送和消费的高级开发技巧

目录 
- 事务消息
- 延迟消息
- 消息过滤

# 事务消息
|发送方|接收方|
|---|---|
|解决本地事务与发送消息原子性|解决接收消息与本地事务原子性|
|保证事务成功，消息发送成功|保证消息接收成功，事务执行成功|
事务消息完美解决分布式交互过程中可能出现的问题

**半消息**：broker确认前，消息对消费者不可见
![](5-事务消息.png)


# 延迟消息
消息写入broker后，等待指定时间才可被消费

**使用场景**
- 订单超时未支付
支付超时时延时消息被消费，自动执行取消订单等约逻辑
- 各种活动场景
延时消息处理活动结束

![](5-延时消息.png)

# 消息过滤
- 表达式过滤
    - Tag过滤
    - SQL过滤
- 类过滤
    - Filter Server过滤
## Tag过滤
broker、消费者都可过滤tag
```
//Tag过滤:消息发送
String[] tags = new string[]{"TagA", "TagB", "Tagc", "TagD", "TagE"};
for(int i=0;i< 10;i++){
    String tag = tags[i % tags.length];
    String msg ="hello，这是第"+(i + 1)+“条消息";
    Message message = new Message("FilterMessageTopic", tag,msg.getBytes(RemotingHelperDEFAULT CHARSET));SendResult sendResult = producer.send(message);
    System.out.println(sendResult);
}

//Tag过滤:消息消费
pushConsumer.subscribe("FilterMessageTopic", "TagA | TagC | TagD" );
```

## SQL过滤
推模式才可用

```
//生效配置
conf/broker.confenablePropertyFilter=true


//SQL过滤:消息发送
Message msg = new Message("topic a",("test").getBytes());“40");
msg.putUserProperty("age"msg.putUserProperty("name""tianyalan");producer.send(msg);


//SQL过滤:消息消费
consumer.subscribe("topic a", Messageselector,bySql("age > 35 and name = 'tianyalan'"));
```

## Filter Server过滤
在 Broker端运行1个或多个消息过滤服务器(FilterServer),RocketMQ允许消息消费者自定义消息过滤实现类并将其代码上传到 Filter Server 上。
消息消费者向 Filter Server拉取消息，Filterserver将消息消费者的拉取命令转发到Broker，然后对返回的消息执行消息过滤逻辑，最终将消息返回给消费端。
由于FilterServer与Broker运行在同一台机器上，消息的传输是通过本地回环通信，不会浪费Broker端的网络资源

# 示例


# 思考题
列举你所经历过的可以使用延迟消息来解决的技术问题?