---
title: 2RPC架构
description: 2RPC架构
date: 2024-09-19 21:20:55
tags: RPC
---
- RPC架构的基本结构
- 核心组件
也是RPC架构提供的基础功能
- 网络通信
- 传输协议
- 远程调用
- 序列化
![](1-RPC架构.png)
# RPC架构基本结构
Remote Process Call远程过程调用
分布式系统基础功能组件：传输协议，网络通信，服务调用，序列化
一切分布式系统的基础

## 架构演进
![](1-RPC架构演进1.png)
![](1-RPC架构演进2.png)
![](1-RPC架构演进3.png)

- 客户端组件-职责
RPCClient 负责导入远程接口的代理类
RPCProxy 透明化调用，调用远程接口的代理实现
RPCCaller 负责编码，序列化反序列化和发送请求到服务端并等待结果
RPCConnector 负责网络通信，维持链接通道和发送数据到服务端
- 服务端组件-职责
RPCServer 
RPCInvoker 调用服务端接口具体实现并返回结果
RPCProcessor 控制调用过程，包括管理调用线程池
RPCAcceptor 接受客户端请求并返回结果（转发，包装结果返回）
- 通用组件-职责
RPCProtocol 负责协议编码解码
RPCChannel 数据传输通道

## 示例-自定义RPC架构
![](1-RPC架构-Demo.png)
### Protocol
```
package com.vvf.springboot1.demos.rpc.protocol;

import java.io.Serializable;

public class Protocl implements Serializable {
    private String interfaceName;
    String methodName;
    Class[]paramsTypes;
    Object[]parameters;

    public Protocl() {
        super();
    }

    public Protocl(String interfaceName, String methodName, Class[] paramsTypes, Object[] parameters) {
        this.interfaceName = interfaceName;
        this.methodName = methodName;
        this.paramsTypes = paramsTypes;
        this.parameters = parameters;
    }

    public String getInterfaceName() {
        return interfaceName;
    }

    public void setInterfaceName(String interfaceName) {
        this.interfaceName = interfaceName;
    }

    public String getMethodName() {
        return methodName;
    }

    public void setMethodName(String methodName) {
        this.methodName = methodName;
    }

    public Class[] getParamsTypes() {
        return paramsTypes;
    }

    public void setParamsTypes(Class[] paramsTypes) {
        this.paramsTypes = paramsTypes;
    }

    public Object[] getParameters() {
        return parameters;
    }

    public void setParameters(Object[] parameters) {
        this.parameters = parameters;
    }
}

```

### API
```
public interface UserService {
    public String getUserNameByCode(String userCode);
}
```
### Server
```
package com.vvf.springboot1.demos.rpc.server;

import com.vvf.springboot1.demos.rpc.protocol.Protocl;
import jdk.internal.org.objectweb.asm.TypeReference;
import org.aspectj.lang.ProceedingJoinPoint;


import javax.naming.ldap.SortKey;
import java.io.IOError;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class RpcServer {
    private int threadSize = 10;
    private ExecutorService threadPool;
    private Map<String, Object> servicePool;
    private int port = 9901;

    public int getThreadSize() {
        return threadSize;
    }

    public void setThreadSize(int threadSize) {
        this.threadSize = threadSize;
    }

    public ExecutorService getThreadPool() {
        return threadPool;
    }

    public void setThreadPool(ExecutorService threadPool) {
        this.threadPool = threadPool;
    }

    public Map<String, Object> getServicePool() {
        return servicePool;
    }

    public void setServicePool(Map<String, Object> servicePool) {
        this.servicePool = servicePool;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public RpcServer() {
        super();
        synchronized (this) {
            threadPool = Executors.newFixedThreadPool(this.threadSize);
        }
    }

    public RpcServer(int threadSize, int port) {
        this.threadSize = threadSize;
        this.port = port;
        synchronized (this) {
            threadPool = Executors.newFixedThreadPool(this.threadSize);
        }
    }

    public RpcServer(Map<String, Object> servicePool, int threadSize, int port) {
        this.threadSize = threadSize;
        this.port = port;
        this.servicePool = servicePool;
        synchronized (this) {
            threadPool = Executors.newFixedThreadPool(this.threadSize);
        }
    }

    /**
     * 1.实现Socket监听:RpcAcceptor
     * @throws IOException
     */
    public void service() throws IOException {
        ServerSocket serverSocket = new ServerSocket(this.port);
        while (true) {
            Socket receiveSocket = serverSocket.accept();
            final Socket socket = receiveSocket;

            //执行请求
            threadPool.execute(new Runnable() {
                @Override
                public void run() {
                    try {
                        //处理请求
                        process(socket);
                        socket.close();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });
        }
    }

    /**
     *处理请求：RpcProcessor`
     */
    private void process(Socket receiveSocke) throws IOException, ClassNotFoundException, InvocationTargetException, InstantiationException, IllegalAccessException, NoSuchMethodException {
        ObjectInputStream objectInputStream = new ObjectInputStream(receiveSocke.getInputStream());
        Protocl transportMessage = (Protocl) objectInputStream.readObject();
        //调用服务
        Object result = call(transportMessage);
        ObjectOutputStream objectOutputStream = new ObjectOutputStream(receiveSocke.getOutputStream());
        objectOutputStream.writeObject(result);
        objectOutputStream.close();
    }

    /**
     * 3.执行方法调用，RpcInvoker
     */
    private Object call(Protocl protocl) throws ClassNotFoundException, InstantiationException, IllegalAccessException, NoSuchMethodException, InvocationTargetException {
        if (servicePool == null) {
            synchronized (this) {
                servicePool = new HashMap<>();
            }
        }

        String interfaceName = protocl.getInterfaceName();
        Object service = servicePool.get(interfaceName);
        Class<?> serviceClass = Class.forName(interfaceName);

        if (service == null) {
            synchronized (this) {
                service = serviceClass.newInstance();
                servicePool.put(interfaceName, service);
            }
        }

        Method method = serviceClass.getMethod(protocl.getMethodName(), protocl.getParamsTypes());

        Object result = method.invoke(service, protocl.getParameters());
        return result;
    }
}

```
#### serviceImpl
```
package com.vvf.springboot1.demos.rpc.service.impl;

import com.vvf.springboot1.demos.rpc.service.UserService;

public class UserServiceImpl implements UserService {
    @Override
    public String getUserNameByCode(String userCode) {
        return "hello:" + userCode;
    }
}
```

### Client
```
package com.vvf.springboot1.demos.rpc.client;

import com.vvf.springboot1.demos.rpc.protocol.Protocl;

import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.net.Socket;
import java.net.UnknownHostException;

public class RpcClient {
    private String serverAddress;
    private int serverPort;

    public RpcClient(String serverAddress, int serverPort) {
        this.serverAddress = serverAddress;
        this.serverPort = serverPort;
    }

    public Object sendAndRecevie(Protocl protocl) {
        Object result = null;

        try {
            Socket socket = new Socket(this.serverAddress, this.serverPort);
            ObjectOutputStream objectOutputStream = new ObjectOutputStream(socket.getOutputStream());
            objectOutputStream.writeObject(protocl);

            ObjectInputStream objectInputStream = new ObjectInputStream(socket.getInputStream());
            result = objectInputStream.readObject();
        } catch (UnknownHostException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }

        return result;
    }
}

```

### 测试

#### Server
```
package com.vvf.rpc.server;

import com.vvf.springboot1.demos.rpc.server.RpcServer;
import com.vvf.springboot1.demos.rpc.service.impl.UserServiceImpl;

import java.util.HashMap;
import java.util.Map;

public class ServerTest {
    public static void main(String[] args) {
        Map<String, Object> servicePool = new HashMap<>();
        servicePool.put("com.vvf.springboot1.demos.rpc.service.UserService", new UserServiceImpl());

        RpcServer server = new RpcServer(servicePool, 4, 9001);
        try {
            server.service();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

```

#### Client
```
package com.vvf.rpc.client;

import com.vvf.springboot1.demos.rpc.client.RpcClient;
import com.vvf.springboot1.demos.rpc.protocol.Protocl;

public class ClientTest {
    public static void main(String[] args) {
        String serverAddress = "127.0.0.1";
        int serverPort = 9001;
        RpcClient client = new RpcClient(serverAddress, serverPort);
        Object result = client.sendAndRecevie(buildProtocol("vvf1"));
        System.out.println(result);


    }

    private static Protocl buildProtocol(String userCode) {
        String interfaceName = "com.vvf.springboot1.demos.rpc.service.UserService";
        Class[] paramsTypes = {String.class};
        Object[] parameters = {userCode};
        String methodName = "getUserNameByCode";

        Protocl transportMessage = new Protocl(interfaceName, methodName, paramsTypes, parameters);
        return transportMessage;
    }
}
```

# 核心组件-网络通信
## 网络连接
- 长连接
TCP链接建立后，可以连续发送多个数据包。
节省资源，时延小（节省重复创建链接的时间和资源消耗）
相对复杂，需管理心跳以维持链接状态
RPC框架一般选择长连接，倾向于高性能
- 短连接
TCP链接建立后，数据包传输完成后关闭
结构简单
## IO模型
- bio
- nio
- I/O多路复用
- 信号驱动I/O
- 异步I/O aio
### 阻塞I/O  bio 
单线程只能同时处理一个链接，（客户端断开才能处理下一个，全流程阻塞）
accept 等待客户端请求时阻塞，
read 阻塞等待客户端发送数据从网卡写入到内核缓冲区，再由内核缓冲区拷贝到用户态，
网卡将数据写入到内核缓冲区后发出中断命令，修改socket文件描述符为就绪态
把内核缓冲区数据拷贝到用户态
read 返回数据继续处理（解除阻塞）
###  非阻塞I/O nio
接收请求时不阻塞，执行时阻塞

单线程保持多链接，但数据从内核缓冲区拷贝到用户态时阻塞。
线程检查多个链接是否有数据，
当网卡将用户数据拷贝到内核缓冲区时（socket文件描述符变为就绪态），此时read函数检测到数据
read 阻塞，等待内核缓冲区拷贝数据到用户态
返回数据解除阻塞，继续处理数据。
*read就是将内核缓冲区就绪数据读取到用户态。*
*网卡将数据拷贝到内核缓冲区时，发出系统中断命令，修改socket文件描述符为就绪态，read此时阻塞读取数据*
###  I/O多路复用
selector多路复用器
channel

### 信号驱动I/O
### 异步I/O aio   
非阻塞
### 对比
![](1-RPC架构-常见IO模型对比.png)
![](1-RPC架构-NIO.png)
![](1-RPC架构-BIO.png)



NIO模型依赖于操作系统的I/O多路复用技术，如select、poll、epoll模型

问题：NIO BIO AIO区别？select、poll、epoll区别？

为什么选择linux系统？
linux windows底层线程模型不同，windows某些操作无法完成，某些方面表现不如linux。

# 核心组件-序列化·
序列化：对象 -> 字节数组（用于网络传输，持久化等）
反序列化：把网络或磁盘读取的字节数组 -> 对象

## 方式
- 文本类
XML JSON
- 二进制类
Protocol Buffer、Thrift
## 跨语言
常见的跨语言支持序列化工具：Hession、Protocol Buffer、Thrift、Avro
- 支持数据结构种类
是否支持泛型和Map/List （C语言无Map/List）
- 接口开发友好性
是否需要中间语言，Protocol Buffer需要.proto文件、Thrift需要.thrift中间语言


## 性能
![](1-RPC架构-序列化-性能.png)
protobuf 序列化后小适合网络传输
fastjson 速度快

> java序列化工具对比：https://github.com/eishay/jvm-serializers


# 核心组件-传输协议
- HTTP
http协议通用性强，使用于各种场景，相对对于特定场景特定需求会复杂，扩展性也不好(对于需要的扩展性不支持)

- TCP
- 自定义协议
## 自定义协议
性能与扩展性
- 自定义协议的通信模型和消息定义（自定义传输对象消息头消息体）
- 支持点对点长连接通信
- 使用NIO模型进行异步通信
- 提供可扩展的编解码框架，支持多种序列化方式

在已有协议基础上做扩展

![](1-RPC架构-自定义协议消息.png)

### Dubbo协议
![](1-RPC架构-自定义协议-Dubbo协议.png)
通过自定义消息头，根据消息头标志位做定制化开发，优化性能

# 核心组件-远程调用
## 服务调用基本方式
- 同步
- 异步
- 并行调用
- 泛化调用
![](1-RPC架构-服务调用基本方式.png)
实心箭头代表同步

![](1-RPC架构-服务调用扩展方式.png)