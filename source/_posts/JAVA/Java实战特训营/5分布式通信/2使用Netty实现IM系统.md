---
title: 2使用Netty实现IM系统
description: 2使用Netty实现IM系统
date: 2024-09-28 21:34:08
tags:
---

# IM系统简介
IM（Instant Messaging，即时通讯）又叫做实时通信

- 单聊
- 群聊

## IM和Netty - 客户端实现逻辑
![](2-IM客户端实现逻辑.png)

## IM和Netty - 服务端实现逻辑
![](2-IM服务端实现逻辑.png)

# Pipeline与ChannelHandler

## Netty中的管道-过滤器
Channel+ChannelPipeline+ChannelHandlerContext
![](2-Netty中的管道-过滤器.png)

## ChannelHandler
![](2-ChannelHandler.png)

## Netty内置ChannelHandlerAdapter
### MessageToByteEncoder
```
public abstract class MessageToByteEncoder<I> extends ChannelOutboundHandlerAdapter { 

protected abstract void encode(ChannelHandlerContext ctx, I msg, ByteBuf byteBuf) throws 	Exception;
}

public class PacketEncoder extends MessageToByteEncoder<MyMessage> {

    @Override
    protected void encode(ChannelHandlerContext ctx, MyMessage message, ByteBuf byteBuf) 			throws Exception {

        //完成自定义编码
        ByteBuf byteBuf = ...
    }
}
```
### ByteToMessageDecoder
```
public abstract class ByteToMessageDecoder extends ChannelInboundHandlerAdapter {

protected abstract void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws 	Exception;
}

public class PacketDecoder extends ByteToMessageDecoder {

    @Override
    protected void decode(ChannelHandlerContext channelHandlerContext, ByteBuf byteBuf, List list) 			throws Exception {

        //完成自定义解码
        MyMessage message = ...;
        list.add(message);
    }
}

```
### SimpleChannelInboundHandler
```
public abstract class SimpleChannelInboundHandler<I> extends ChannelInboundHandlerAdapter {

protected abstract void channelRead0(ChannelHandlerContext ctx, I msg) throws Exception;
}

public class LoginResponseHandler extends SimpleChannelInboundHandler<MyMessage> {

  @Override
    protected void channelRead0(ChannelHandlerContext channelHandlerContext, MyMessage message) 		throws Exception {
        //针对MyMessage处理登录逻辑
    }
}
```
### AuthenticationHandler

```
public class AuthenticationHandler extends ChannelInboundHandlerAdapter {

@Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        //如果认证通过则继续执行，否则直接断开连接        
    }

    @Override
    public void handlerRemoved(ChannelHandlerContext ctx) throws Exception {
        //打印日志
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        //执行下线
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        //异常时断开连接
    }
}
```

# IM单聊的原理与实现
## 设计通信协议
*为了实现定制化和扩展性，通常都需要定义一套私有协议，例如Dubbo框架*
![](2-IM自定义通信协议.png)

