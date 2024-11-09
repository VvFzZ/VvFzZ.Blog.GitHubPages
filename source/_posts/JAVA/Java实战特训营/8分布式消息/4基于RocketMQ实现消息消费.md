---
title: 4基于RocketMQ实现消息消费
description: 4基于RocketMQ实现消息消费
date: 2024-10-16 17:07:05
tags:
---
学习目标
- 消息消费方式
- 可靠性设计

# RocketMQ消息消费方式
- 推 push
push from topic

- 拉 pull
from queue pull

**区别**
- 推，实时性高，增加服务端负载；对消费端能力要求高（推太快消费端出现限流问题）

- 拉，主动权在客户端（定时任务拉取），可控性好，PULL的时机很重要，间隔过短则空请求会多浪费资源，隔太长则消息不能及时处理

## 消费者的实现代码分析
![](4-消费者类图.png)
**MQConsumer**
- `sendMessageBack`： 如果消费失败，消息会被重新发送到Broker并在一定时间之后再次被消费
- `fetchSubscribeMessageQueues`： 基于Topic从消费者缓存中获取消息队列信息

`MQPullConsumer`
抓取消息需要开发自己实现，基于topic获取MessageQueue集合并遍历，针对每一个MessageQueue批量取消息。取消息时记录队列下次取的开始偏移量（偏底层），直到取完该队列切换到下一个。
`pullBlockIfNotFound`拉取时，没有消息则阻塞，直到有消息可拉取

`MQPushconsumer`
封装轮询过程，注册MessageListener监听器获取消息，唤醒MessageListener的consumeMessage方法进行消费。

registerMessageListener注册监听器
- MessageListenerConcurrently并发监听器（同时处理）
- MessaqeListenerOrderly顺序监听器（一个一个处理）
subscribe订阅主题


## 示例
```
rocketmq:
  name-server: 127.0.0.1:9876
```

- 添加注解`RocketMOMessageListener`
- 实现`RocketMoListener<Event>`接口
- 实现消费方法`onMessage`

```
@Component
@RocketMQMessageListener(consumerGroup = "consumer_group", topic = "topic")
public class ImMessageConsumer implements RocketMQListener<MessageCreatedEvent> {

    @Override
    public void onMessage(MessageCreatedEvent message) {
        System.out.println("Received message : " + message);
    }
}

```
# RocketMQ消息可靠性机制
消息丢失情况
1. 生产者发送消息到Broker
2. Broker内部存储消息到磁盘、主从同步时
3. Broker把消息推送给消费者、消费者拉去消息时

## 保证可靠性
### 生产者
- 单项发送
不建议使用（无法判断是否发送成功，不可靠消息发送方式）
- 同步发送 
发送消息后检查返回状态，判断是否持久化成功，如果超时或失败，重试，注意幂等性
- 异步发送
根据回调函数结果判断是否重试，来保证消息的可靠性，注意幂等性

重试策略
- 同步
轮转到下一个Broker重试，最多重试2次
- 异步
只在当前Broker重试，最多重试2次
- 自定义
定制化重试逻辑，如存储消息后定时发送到broker

### broker
丢失场景：刷盘、主从同步
#### 刷盘
- 同步刷盘
消息写入内存的 PageCache后，立刻通知刷盘线程刷盘，然后等待刷盘完成，刷盘线程执行完成后唤醒等待的线程，返回消息写成功的状态
- 异步刷盘（默认）
消息写入到内存的 PageCache就立刻给客户端返回写操作成功，当PageCache中的消息积累到一定的量或定时触发一次写磁盘操作

优缺点
同步刷盘，数据安全保证持久化，但吞吐量不大
异步刷盘，吞吐量大性能高，但PageCache中数据可能丢失，不保证数据绝对安全

吞吐量与安全性权衡
#### 主从同步
- 同步复制(推荐)
Master和Slave均写成功后才反馈给客户端写成功状态
若Master故障，Slave有全量备份，易恢复，但同步复制会增大数据写入延迟，降低系统吞吐量
- 异步复制
只要Master写成功，即可反馈给客户端写成功状态
系统拥有较低的延迟和较高的吞吐量，但是如果Master出了故障，有些数据因为没有被写入Slave，有可能会丢

### 消费者
重试策略
- 只有返回CONSUME SUCCESS才算消费完成
- 返回CONSUME LATER则会按照不同的messageDelayLevel时间进行再次消费，最长时间为2个小时后再次进行消费重试
- 如果消费满16次之后还是未能消费成功则不再重试，会将消息发送到死信队列
- 通过RocketMQ提供的相关接口从死信队列获取到相应的消息

死信队列：消息会存放在死信队，不消费会一直存在，也可通过API从死信队取数据消费，不会自动消费。
### 可靠性总结

- 消息发送方 
通过不同的重试策略保证了消息的可靠发送
- Broker服务端
通过不同的刷盘机制以及主从复制来保证消息的可靠存储
- 消息消费方
通过至少消费成功一次以及消费重试机制来保证消息的可靠消费


# 思考题
如何选择合适的策略保证RocketMQ消息通信的可靠性？

能做到不丢消息吗？不丢消息考虑哪些方面，如何选择？