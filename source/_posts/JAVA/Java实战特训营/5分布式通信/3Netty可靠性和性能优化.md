---
title: 3Netty可靠性和性能优化
description: 3Netty可靠性和性能优化
date: 2024-09-28 21:34:15
tags:
---

- 可靠性分析和实现
    - 空闲检测 
    - 心跳保活
- 性能优化
    - 避免线程阻塞操作
    - 共享Handler(单例)
    - 合并编解码器、合并平行Handler

# Netty可靠性分析和实现
网络通信异常不可避免，提升可靠性应尽可能减少异常出现。
## 服务端空闲检测 
链接空闲后关闭，避免资源闲置
IdleStateHandler
```
public class ServerIdleHandler extends IdleStateHandler {
    private static int HERT_BEAT_TIME = 150;

    public ServerIdleHandler() {
        super(0, 0, HERT_BEAT_TIME);
    }

    @Override
    protected void channelIdle(ChannelHandlerContext ctx, 				IdleStateEvent evt) throws 	Exception {
        //系统出现问题，关闭连接
        ctx.channel().close();
    }
}

bootstrap.group(boss,worker)
      .channel(NioServerSocketChannel.class) 
     .childHandler(new ChannelInitializer<NioSocketChannel>() {
          @Override
          protected void initChannel(NioSocketChannel ch) throws Exception {
 //放在Pipeline的最前面
              ch.pipeline().addLast(new ServerIdleHandler());
 ...
          }
     });

```

## 客户端心跳
IdleStateHandler
### 客户端发送
```
public class ClientIdleHandler extends IdleStateHandler {

    private static Logger logger = LoggerFactory.getLogger(ClientIdleHandler.class);

    private static final int HEART_BEAT_TIME = 50;

    public ClientIdleHandler() {
        super(0, 0, HEART_BEAT_TIME);
    }

    @Override
    protected void channelIdle(ChannelHandlerContext ctx, IdleStateEvent evt) throws 				Exception {
        logger.info("发送心跳....");
        ctx.writeAndFlush(new HeartBeatPacket());
    }
}
```
### 服务端回复
```
public class HeartBeatHandler extends SimpleChannelInboundHandler<HeartBeatPacket> {

    private static Logger logger = LoggerFactory.getLogger(HeartBeatHandler.class);

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, HeartBeatPacket heartBeatPacket) 		throws Exception {
        logger.info("收到心跳包：{}", JSON.toJSONString(heartBeatPacket));
        ctx.writeAndFlush(heartBeatPacket);
    }
}
```

## 客户端断线重连
？？？
```
public class ReConnectHandler extends ChannelInboundHandlerAdapter {

    private int retryCount;

    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        IdleStateEvent event = (IdleStateEvent)evt;
        if(event.state() == IdleState.READER_IDLE) {
            if(++retryCount > 3) {
                closeAndReconnection(ctx.channel());
            } else {
                ctx.writeAndFlush(MyHeartbeat.getHeartbeatPingBuf());
            }
        }
    }

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        retryCount=0;
        super.channelRead(ctx, msg);
    }
}
```

# Netty性能优化
- **避免线程阻塞操作** 不可处理耗费时间的代码 
- 共享Handler
- 合并编解码器
- 合并平行Handler
## 避免线程阻塞操作
NIO，非阻塞IO但channelRead0是阻塞处理的
### 通过线程池进行异步化

```
//同步阻塞主线程的耗时操作
@Override
protected void channelRead0(ChannelHandlerContext ctx, T msg) throws Exception {
    //针对消息的业务处理
    //执行数据库持久化
    ctx.writeAndFlush(msg);
    //执行其他业务处理
}

//异步化
@Override
protected void channelRead0(ChannelHandlerContext ctx, T msg) throws Exception {
    threadPool.submit(new Runable() {
        //针对消息的业务处理
        //执行数据库持久化
        ctx.writeAndFlush(msg);
        //执行其他业务处理
    });
}
```
### 消息中间件异步化
```
@Override
protected void channelRead0(ChannelHandlerContext ctx, T msg) throws Exception {

    //创建事件
    MyEvent event = createEvent(msg);
        
    //生成消息对象
    Message<String> message = MessageBuilder.withPayload(event ).build();

    //发送信息
    rocketMQTemplate.sendMessage("event_group", "topic_chat", message, null);
}
```
## 共享Handler
一个Channel新建立时会执行initHandler方法并组装Pipeline
对于无状态类，使用单例模式可以节省类的创建成本
多channel共享一个handler

```
@ChannelHandler.Sharable //设置该Handler为全局共享
public class MyMessageHandler extends SimpleChannelInboundHandler<MyMessage> {

    private static MyMessageHandler instance = new MyMessageHandler();//单利对象

    public static MyMessageHandler getInstance(){
        return instance;
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, MyMessage msg) throws Exception {
        ...
    }
}
```

## 合并编解码器
减少依赖对象的创建
```
@ChannelHandler.Sharable
public class PacketCodecHandler extends MessageToMessageCodec<ByteBuf,Packet> {

    private static PacketCodecHandler instance = new PacketCodecHandler();

    public static PacketCodecHandler getInstance(){
        return instance;
    }

    protected void encode(ChannelHandlerContext ctx, Packet packet, List<Object> list) throws Exception {
        ByteBuf byteBuf = ctx.channel().alloc().ioBuffer();
        PacketCodeC.getInstance().encode(byteBuf,packet);
        list.add(byteBuf);

    }

    protected void decode(ChannelHandlerContext ctx, ByteBuf buf, List<Object> list) throws Exception {
        list.add(PacketCodeC.getInstance().decode(buf));
    }
}
```

## 合并平行Handler
???合并Handler，减少对象创建过程
```
@ChannelHandler.Sharable
public class ServerHandler extends SimpleChannelInboundHandler<MyMessage> {

    private static ServerHandler instance = new ServerHandler();
    public static ServerHandler getInstance(){
        return instance;
    }

    private static Map<Byte,SimpleChannelInboundHandler<? extends MyMessage>> handlerMap = new 					ConcurrentHashMap<>();
    static{
        handlerMap.putIfAbsent(CASE1, Case1Handler.getInstance());
        handlerMap.putIfAbsent(CASE2, Case2Handler.getInstance());
        handlerMap.putIfAbsent(CASE3, Case3Handler.getInstance());
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, MyMessage msg) throws Exception {//合并Handler，减少对象创建过程,减少对象创加了吗？
        SimpleChannelInboundHandler handler = handlerMap.get(msg.getCommand());
        handler.channelRead(ctx, msg);
    }
}
```

## 添加日志
在Netty中，writeAndFlush方法是一个异步操作，调用之后会直接返回
```
@Override
protected void channelRead0(ChannelHandlerContext ctx, T msg) throws Exception {
Long startTime = System.currentTimeMillis();

//针对消息的业务处理
//执行数据库持久化
ctx.writeAndFlush(msg).addListener(future -> {
   if(future.isDone()) {
      //执行其他业务处理
      Long timeConsumed = System.currentTimeMillis() - startTime;	 }
});
}
```















