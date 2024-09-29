---
title: 6Dubbo服务端与客户端通信原理解析
description: 6Dubbo服务端与客户端通信原理解析
date: 2024-09-19 21:21:16
tags:
---
# Dubbo网络通信组件架构

## 网络通信组件通用设计方法和架构
![](1-Dubbo-通用网络通信组件架构.png)

架构方面通常使用加一层解决问题。

请求响应层：完成网络层的调度，完成请求处理过程（心跳，时效性处理，复杂业务耦合处理）

## Dubbo网络通信架构
- Protocol层  业务层
- Exchange层  信息交换层，用来封装请求-响应模式（心跳处理）
- Transport层 网络传输层，抽象Netty等框架作为统一的接口
- Serialize层 序列化层，主要完成数据的序列化和反序列化过

### Protocol
export 服务端对外暴露服务
refer 客户端对远程服务进行引用
```
@SPI("dubbo")
public interface Protocol {
      int getDefaultPort();

        @Adaptive
        <T> Exporter<T> export(Invoker<T> invoker) throws RpcException;

        @Adaptive
        <T> Invoker<T> refer(Class<T> type, URL url) throws RpcException;

        void destroy();
}
```

### Exchanger 

```
@SPI(HeaderExchanger.NAME)
public interface Exchanger {

    @Adaptive({Constants.EXCHANGER_KEY})
    ExchangeServer bind(URL url, ExchangeHandler handler) throws RemotingException;

    @Adaptive({Constants.EXCHANGER_KEY})
    ExchangeClient connect(URL url, ExchangeHandler handler) throws RemotingException;
}
```

### Transporter 
```
@SPI("netty")
public interface Transporter {

    @Adaptive({Constants.SERVER_KEY, Constants.TRANSPORTER_KEY})
    Server bind(URL url, ChannelHandler handler) throws RemotingException;

    @Adaptive({Constants.CLIENT_KEY, Constants.TRANSPORTER_KEY})
    Client connect(URL url, ChannelHandler handler) throws RemotingException;
}
```

# Dubbo服务端通信机制
Dubbo服务端集成Netty服务，启动服务监听
典型的多层架构

![](1-Dubbo-服务端网络通信流程.png)

## DubboProtocol创建ExchangeServer
```
// 根据传入的服务请求URL来创建ExchangeServer 
private void openServer(URL url) {
        String key = url.getAddress();
        boolean isServer = url.getParameter(Constants.IS_SERVER_KEY, true);
        if (isServer) {
            ExchangeServer server = serverMap.get(key);
            if (server == null) {
                serverMap.put(key, createServer(url));
            } else {
                server.reset(url);
            }
        }
}

// 通过Exchanger接口创建ExchangeServer
private ExchangeServer createServer(URL url) {         
        ExchangeServer server;
        try {
            server = Exchangers.bind(url, requestHandler);
        } 
        return server;
}
```

## HeaderExchanger 
```
public class HeaderExchanger implements Exchanger {
    public static final String NAME = "header";

    public ExchangeClient connect(URL url, ExchangeHandler handler) throws RemotingException {
        return new HeaderExchangeClient(Transporters.connect(url, 
new DecodeHandler(new HeaderExchangeHandler(handler))), true);
    }




    public ExchangeServer bind(URL url, ExchangeHandler handler) throws RemotingException {
        return new HeaderExchangeServer(Transporters.bind(url, 
new DecodeHandler(new HeaderExchangeHandler(handler))));
    }
}
```

### 心跳
```
//心跳检测功能
private void startHeatbeatTimer() {
        stopHeartbeatTimer();
        if (heartbeat > 0) {
            heatbeatTimer = scheduled.scheduleWithFixedDelay(
                new HeartBeatTask(new HeartBeatTask.ChannelProvider() {
                    public Collection<Channel> getChannels() {
                        return Collections.unmodifiableCollection(
                                    HeaderExchangeServer.this.getChannels());
                    }
                }, heartbeat, heartbeatTimeout),
                heartbeat, heartbeat, TimeUnit.MILLISECONDS);
        }
}
```

## NettyServer
```
public class NettyTransporter implements Transporter {
    public static final String NAME = "netty4";

    public Server bind(URL url, ChannelHandler listener) throws RemotingException {
        return new NettyServer(url, listener);
    }

    public Client connect(URL url, ChannelHandler listener) throws RemotingException {
        return new NettyClient(url, listener);
    }
}
```
##
```
protected void doOpen() throws Throwable {
        ...
        bootstrap = new ServerBootstrap(channelFactory);

        final NettyHandler nettyHandler = new NettyHandler(getUrl(), this);
        channels = nettyHandler.getChannels();
        bootstrap.setPipelineFactory(new ChannelPipelineFactory() {
            public ChannelPipeline getPipeline() {
                NettyCodecAdapter adapter = new NettyCodecAdapter(getCodec(), getUrl(), NettyServer.this);
                ChannelPipeline pipeline = Channels.pipeline();
                pipeline.addLast("decoder", adapter.getDecoder());
                pipeline.addLast("encoder", adapter.getEncoder());
                pipeline.addLast("handler", nettyHandler);
                return pipeline;
            }
        });
        channel = bootstrap.bind(getBindAddress());
}

public void send(Object message, boolean sent) throws RemotingException {
        Collection<Channel> channels = getChannels();
        for (Channel channel : channels) {
            if (channel.isConnected()) {
                channel.send(message, sent);
            }
        }
}
```

# Dubbo客户端通信机制
![](1-Dubbo-客户端核心类.png)
## DubboProtocol
Exchangers.connect 获取ExchangeClient
```
private ExchangeClient initClient(URL url) {
        ExchangeClient client;
        try {
            if (url.getParameter(Constants.LAZY_CONNECT_KEY, false)) {
                client = new LazyConnectExchangeClient(url, requestHandler);
            } else {
                client = Exchangers.connect(url, requestHandler);
            }
        } 

        return client;
}
```



# 问题


分层架构，单一职责，扩展性，
兼容性、维护性








