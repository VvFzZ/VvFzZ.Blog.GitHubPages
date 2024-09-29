---
title: IO模型
description: IO模型
date: 2024-09-23 09:57:39
tags: IO模型
---

- bio
- nio
- nio多路复用
- 信号io
- aio

*io模型主要区别：什么时候阻塞，阻塞时间多长。*
*io的瓶颈：线程创建销毁开销，内核态用户态交换数据开销。*

nio多路复用，单线程通过多路复用器selector批量处理链接事件，selector批量检查链接内核数据状态。
两阶段进行。select()阻塞（检查就绪状态），检查到就绪态连接，阻塞处理数据。
# bio
![](BIO.png)

bio单线程只能处理一个连接（从连接建立到关闭只能处理这一个连接），全链路阻塞，性能低。两次阻塞，accept等待连接阻塞，read读取数据阻塞

## 性能问题
- 当个线程只能同时处理一个连接，全链路阻塞，高并发，大量线程创建销毁性能低
- read函数，两次进程切换。其一建立连接后，执行read函数会等待客户端数据写入内核缓冲区时放弃运行；其二，网卡将数据写入内核缓冲区，发出系统中断命令 唤醒进程

# nio
解决单线程只能处理一个连接问题
且不再全链路阻塞，当网卡将数据拷贝到内核缓冲区后才阻塞read方法

但带来问题，每次需遍历所有已建立的链接，查询内核状态，是否有数据接收到了。
高并发，大量连接需遍历性能低
且若不发消息，会充斥大量无用检查（访问内核态）
--- 
nio单线程处理多连接，内核缓冲区数据拷贝到socket数据接受队列时阻塞，数据到达用户缓冲区时解除阻塞。
问题1.高并发且长链接时，每次需要遍历全部链接是否有数据，与内核交换数据多性能低。
问题2.客户端发送一次数据，一次阻塞引起两次cpu进程切换影响性能。
![](NIO.png)
# 多路复用
使用selecotor多路复用器，批量检查连接事件状态，减少与内核数据交换次数


网卡收到客户端数据，执行中断程序，包含6个操作
1. DMA拷贝技术，网卡数据拷贝到内存缓冲区
2. 修改文件描述符为就绪态
3. 把内核缓冲区数据拷贝到channel数据接收队列
4. 修改内核态的文件描述符信息（修改为就绪态），返回给用户态
5. 唤醒进程等待队列中的进程a，进程a进入CPU运行队列（进程a在select方法调用且没有连接有数据时让出CPU运行队列，进入阻塞）


# 代码示例
## BIO
### server
```
package com.vvf.springboot1.demos.bio;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;

public class BioServer {
    public static void main(String[] args) throws IOException {
        single();
    }

    static void single() throws IOException {
        ServerSocket serverSocket = new ServerSocket(9002);


        while (true) {
            Socket s = serverSocket.accept();
            System.out.println("客户端发起连接");
            StringBuilder sb = new StringBuilder();
            byte[] buffer = new byte[128];
            int len = 0;

            while ((len = s.getInputStream().read(buffer, 0, buffer.length)) > 0) {
                String str = new String(buffer, 0, len);
                sb.append(str);
            }

            System.out.println(sb.toString());
        }
    }

    static void muilt() throws IOException {
        ServerSocket serverSocket = new ServerSocket(9002);

        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                while (true) {
                    Socket s = null;
                    long pid = Thread.currentThread().getId();
                    try {
                        System.out.println(pid + "启动监听");
                        s = serverSocket.accept();
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                    System.out.println(pid + "客户端发起连接");
                    StringBuilder sb = new StringBuilder();
                    byte[] buffer = new byte[128];
                    int len = 0;

                    while (true) {
                        try {
                            if (!((len = s.getInputStream().read(buffer, 0, buffer.length)) > 0)) break;
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                        String str = new String(buffer, 0, len);
                        sb.append(str);
                    }

                    System.out.println(sb.toString());
                }
            }
        };

        for (int i = 0; i < 10; i++) {
            new Thread(runnable).start();
        }

    }
}

```

### Client
```
package com.vvf.springboot1.demos.bio;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;

public class BioClient {
    public static void main(String[] args) throws IOException {
        Socket socket = new Socket("127.0.0.1", 9002);
        OutputStream outputStream = socket.getOutputStream();
        outputStream.write("client1".getBytes());
        socket.close();
    }
}

```

## NIO
### Server
```
package com.vvf.springboot1.demos.nio;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class NioServer {
    static List<SocketChannel> channelList = new ArrayList<>();

    public static void main(String[] args) throws IOException, InterruptedException {
        ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
        serverSocketChannel.socket().bind(new InetSocketAddress(9001));

        serverSocketChannel.configureBlocking(false);

        System.out.println("服务器启动");

        while (true) {
            //System.out.println("check accept");
            SocketChannel socketChannel = serverSocketChannel.accept();//有客户端连接则不为空（即使没发送数据也不为空）

            if (socketChannel != null) {
                System.out.println("有客户端连接");
                socketChannel.configureBlocking(false);
                channelList.add(socketChannel);
            }

            Iterator iterator = channelList.iterator();//迭代已建立的连接

            while (iterator.hasNext()) {//若连接有数据传输则处理数据
                SocketChannel s = (SocketChannel) iterator.next();

                ByteBuffer buffer = ByteBuffer.allocate(128);

                int len = s.read(buffer);

                if (len > 0) {
                    String msg = new String(buffer.array(), 0, len);
                    System.out.println(Thread.currentThread().getName() + "客户端消息：" + msg);
                    Thread.sleep(20 * 1000);
                    if (msg.equals("q")) {
                        iterator.remove();
                        System.out.println("已退出");
                    }
                }
            }
        }

    }
}

```

### Client
```
package com.vvf.springboot1.demos.nio;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;

public class NioClient {
    public static void main(String[] args) throws IOException {
        Socket socket = new Socket("127.0.0.1", 9001);
        OutputStream outputStream = socket.getOutputStream();
        outputStream.write("client1".getBytes());
        socket.close();
    }
}

```

## IO多路复用

### Server
```
package com.vvf.springboot1.demos.nio.selector;

import com.sun.java.swing.plaf.windows.WindowsRadioButtonMenuItemUI;
import org.apache.ibatis.annotations.SelectKey;
import org.apache.tomcat.util.net.WriteBuffer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

public class NioSelectorServer {

    public static void main(String[] args) throws IOException {

        ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
        serverSocketChannel.socket().bind(new InetSocketAddress(9001));

        serverSocketChannel.configureBlocking(false);

        Selector selector = Selector.open();
        serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT);//注册到连接事件

        System.out.println("服务器启动");

        while (true) {
            int selected = selector.select();//查询通道中的就绪状态,返回就绪channel个数
            System.out.println("接收到请求:" + selected);
            Set<SelectionKey> selectionKeys = selector.selectedKeys();
            Iterator<SelectionKey> iterator = selectionKeys.iterator();
            ByteBuffer buffer = ByteBuffer.allocate(128);
            //若连接有数据传输则处理数据
            while (iterator.hasNext()) {

                SelectionKey key = iterator.next();

                if (key.isAcceptable()) {
                    ServerSocketChannel channel = (ServerSocketChannel) key.channel();
                    SocketChannel socketChannel = channel.accept();
                    socketChannel.configureBlocking(false);
                    //注册读事件
                    SelectionKey selKey = socketChannel.register(selector, SelectionKey.OP_READ);
                    System.out.println("客户端连接");
                } else if (key.isReadable()) {
                    SocketChannel channel = (SocketChannel) key.channel();
                    buffer.clear();
                    int len = channel.read(buffer);

                    buffer.flip();
                    if (buffer.hasRemaining()) {
                        String str = new String(buffer.array(), 0, len);
                        System.out.println("客户端消息：" + str);
                    }
                    channel.register(selector, SelectionKey.OP_WRITE);
                } else if (key.isWritable()) {

                    buffer.clear();
                    buffer.put("hello client I am server".getBytes());
                    buffer.flip();
                    SocketChannel channel = (SocketChannel) key.channel();
                    channel.write(buffer);
                    channel.register(selector, SelectionKey.OP_READ);
                }

                iterator.remove();
            }
        }

    }
}

```

### Client
```
package com.vvf.springboot1.demos.nio.selector;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;

public class NioSelectClient {
    public static void main(String[] args) throws IOException {
        Socket socket = new Socket("127.0.0.1", 9001);
        InputStream is = socket.getInputStream();
        OutputStream os = socket.getOutputStream();

        // 先向服务端发送数据
        os.write("Hello, Server!\0".getBytes());
        //os.write("0".getBytes());

        // 读取服务端发来的数据
        int b;
        while ((b = is.read()) != 0) {
            System.out.print((char) b);
        }
        System.out.println();

        socket.close();
    }
}

```





