---
title: 3使用SpringCloudStream重构消息通信机制
description: 3使用SpringCloudStream重构消息通信机制
date: 2024-11-02 16:46:25
tags:
---

学习目标
- 消息通讯平台化设计思想与结构
- 使用Spring Cloud Stream重构消息通信机制

目录
- Spring Cloud Stream整体架构
- Spring Cloud Stream应用方式


# 架构

## 系统集成和消息通信回顾
- 企业集成模式解决方案
Enterprise Integration Pattern，EIP
端点、消息、通道、路由、转换
- RocketMQ架构 
生产者集群、消费者集群、Broker集群、NameServer集群
- 平台化消息通信机制
提供一套通用API，整合不同消息中间件（ActiveMQ、RocketMQ、Kafka）

Spring消息通信技术体系
- Spring Cloud Stream
- Spring Integration
- Spring Messaging

## SpringCloudStream对称架构
![](3-SpringCloudStream架构.png)
## 核心组件
### Source/Sink
```
//生成消息
public interface Source {
    String OUTPUT ="output";
    @Output(Source.OUTPUT)
    MessageChannel output();
}
//消费消息
public interface Sink{
    String INPUT ="input";
    @Input(Source.INPUT)
    SubscribableChannel input();
}
```
### Channel
自定义
```
//定义一个输入通道和两个输出通道
public interface MyChannel{
    @Input
    SubscribableChannel input1();
    @Output
    Messagechannel output1();
    @Output
    MessageChannel output2();
}
```

### Binder
不同消息中间件提供不同的Binder实现
- RabbitMo Binder
- Kafka Binder
- RocketMQBinder

# 应用方式
## 发送消息
```
@Component
public class StreamProducer {
    //通过StreamBridge发送消息
    @Autowired
    private StreamBridge streamBridge;

    public static String CLUSTER MESSAGE OUTPUT = "cluster-out-0"；//不依赖具体消息中间件实现
    public void sendEvent(Event event){
        Message<Event> message = new GenericMessage<>(event);
        streamBridge,send(CLUSTER MESSAGE OUTPUT, message);
    }
}

public final class StreamBridge implements SmartInitializingSingleton {
    public boolean send(String bindingName, @Nullable String binderName, object data, MimeTypeoutputContentType){
        if(!(data instanceof Message)){
            data =MessageBuilder.withPayload(data).build();
        }

        Messagechannel messagechannel = this.resolveDestination(bindingName,producerProperties,binderName);

        if(data instanceof Message){
            data =MessageBuilder.fromMessage((Message)data).setHeader(MessageUtils,TARGET PROTOCOL, "streamBridge").build();
        }

        Message<byte[]>resultMessage = (Message)((Function)functionToInvoke).apply(data);
        //底层还是通过MessageChannel发送消息
        return messageChannel.send(resultMessage);
    }
}
```

配置
```
spring:
 cloud:
  stream:
   rocketmq:
    binder:
     name-server: localhost:9876 //指定NameServer
    bindings:
     cluster-out-0: //Source
      producer:
       group: output_0_group //指定生产者组
   bindings:
    cluster-out-0:
     destination: cluster //指定Topic
```
## 消费消息
```
@Component
public class StreamConsumer {
    @Bean
    public Consumer<Event> consume(){ //函数式
        return message -{
            System.out.println("Received message :+ message);
        }；
    }
}
```
配置
```
spring:
 cloud:
  stream:
   function:
    definition: cluster
   rocketmq:
    binder:
     name-server:localhost:9876 //NameServer
   bindings:
    cluster-in-0: //Sink
     destination: cluster //Topic
     group: cluster-group //分组
```

## 延迟消息
RocketMQ特有的延迟队列，会依赖RocketMQ组件，牺牲通用性实现特定功能
```
@Component
public class StreamDelayProducer {
    @Autowired
    private StreamBridge streamBridge;
    public static String CLUSTER_MESSAGE_OUTPUT ="cluster-out-0";

    public void sendEvent(Event event){
        Map<String,Object> headers = new HashMap<>();
        // MessageConst.PROPERTY_DELAY_TIME_LEVEL RocketMQ组件
        headers.put(MessageConst.PROPERTY_DELAY_TIME_LEVEL, 4);
        Message<Event> message = new GenericMessage<>(event, headers);
        streamBridge.send(CLUSTER_MESSAGE_OUTPUT, message);
    }
}
```

# 示例
引入spring-cloud-starter-stream-rocketmg组件（原有依赖可删除rocketmq-spring-boot-starter，保留不冲突）

通过StreamBridge发送消息、使用函数式编程方式响应消息

使用Binder配置控制发布和消费过程

# 思考题
你认为使用Spring Cloud stream如何简化了RocketMQ的开发过程?