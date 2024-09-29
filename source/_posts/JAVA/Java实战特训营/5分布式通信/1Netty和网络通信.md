---
title: 1Netty和网络通信
description: 1Netty和网络通信
date: 2024-09-28 21:34:05
tags:
---

# Netty框架简介
## NIO的问题
- 编程模型复杂，对开发人员不友好
- 功能支持不够，简单的拆包操作都需要手工实现
- 底层基于操作系统的Epoll实现，存在线程空轮询bug
- 维护成本较高，容易出现开发上的漏洞
## Netty的解决方案
- 高效API 
内置一组辅助类，简化开发难度
- 多协议支持  
TCP、UDP、自定义协议
- 内置编解码
Java序列化、ProtoBuf等
- Listenter机制
异步操作集成监听器回调
- 管道-过滤器
可插拔、高扩展架构


## netty逻辑架构
- 服务编排层
负责组装各类服务，它是 Netty 的核心处理链，用以实现网络事件的动态编排和有序传播
ChannelPipeline
ChannelHandler
ChannelHandlerContext

- 事件调度层
通过 Reactor 模型对各类事件进行聚合处理，通过 Selector 主循环线程集成多种事件
EventLoopGroup
EventLoop

- 网络通信层
执行网络I/O操作，并触发各种网络事件，这些网络事件会分发给事件调度层进行处理
BootStrap
ServerBootStrap
Channel

![](1-Netty-逻辑架构.png)

## 功能特性
- 编解码
- 粘包拆包
- 多协议
- 可靠性

### 编解码
- 编码解码器(Codec)
MessageToMessageCodec
ByteToMessageCodec
- 编码器(Encoder)
MessageToByteEncoder
MessageToMessageEncoder
- 解码器(Decoder)
ByteToMessageDecoder
MessageToMessageDecoder
### 粘包拆包
为什么会出现粘包拆包，TCP是流式无边界协议
![](1-Netty-粘包拆包.png)
- FixedLengthFrameDecoder
基于固定长度划分业务包
- LengthFieldBasedFrameDecoder
使用特定协议头划分业务包
- LineBasedFrameDecoder
基于换行符划分业务包
- DelimiterBasedFrameDecoder
使用自定义的分隔符划分业务包

### 多协议
- HTTP
- FTP
- SSH
- TCP
- UDP
- 自定义

### 可靠性
- 超时控制
异步连接超时配置 ChannelConfig 配置超时时间
- 心跳检测
IdleStateHandler
- 流量整形
自定义流量处理器 AbstractTrafficShapingHandler 


# 启动Netty客户端和服务端

# 实现Netty客户端和服务端双向通信

## 双向通信流程
客户端发送数据到服务端，服务端读取客户端数据
服务端返回数据到客户端，客户端读取服务端数据

### 客户端发送数据到服务端
```
public class NettyClientHandler extends ChannelInboundHandlerAdapter {

    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        logger.info("客户端与服务端链接成功");

//准备数据
ByteBuf byteBuf = ctx.alloc().buffer();
byte[] bytes = "你好，我是郑天民".getBytes(StandardCharsets.UTF_8);
byteBuf.writeBytes(bytes);

//写入数据
ctx.channel().writeAndFlush(byteBuf);
    }}
```

### 服务端读取客户端数据
```
public class NettyServerHandler extends ChannelInboundHandlerAdapter {

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        logger.info("服务端收到来自客户端消息");

        //转换收到的消息内容
        ByteBuf byteBuf = (ByteBuf) msg;

        //在客户端输出接收到的消息内容
        System.out.println("收到客户端端数据：" + byteBuf.toString(StandardCharsets.UTF_8));
}
}
```

### 服务端返回数据到客户端
```
public class NettyServerHandler extends ChannelInboundHandlerAdapter {

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        logger.info("服务端收到来自客户端消息");
...

//向客户端输出内容        
ByteBuf byteBufToClient = ctx.alloc().buffer();
byte[] bytes = "你好，我是服务端：".getBytes(StandardCharsets.UTF_8);
byteBufToClient.writeBytes(bytes);
ctx.channel().writeAndFlush(byteBufToClient);
    }
}
```


### 客户端读取服务端数据
```
public class NettyClientHandler extends ChannelInboundHandlerAdapter {

   public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        logger.info("客户端读取服务端数据");

        //转换接收到的消息内容
        ByteBuf byteBuf = (ByteBuf) msg;

        //在服务端输出接收到的消息内容
        System.out.println("收到服务端数据：" + byteBuf.toString(StandardCharsets.UTF_8));
    }
}
```





