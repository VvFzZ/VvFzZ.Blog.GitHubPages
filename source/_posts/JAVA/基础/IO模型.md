---
title: IO模型
description: IO模型
date: 2024-09-23 09:57:39
tags: IO模型
---
[参考1](https://www.bilibili.com/video/BV1vv4y1o7pu/?spm_id_from=333.337.search-card.all.click&vd_source=48aa85f492f591ebfb25b9416f44cb84)
- bio
全链路阻塞，单线程处理一个链接（线程阻塞不占用CPU）
- nio
单线程处理多个链接，网卡将数据复制到内核缓冲区时read才阻塞，需轮训read状态消耗CPU
- nio多路复用
与非阻塞类似，内核线程轮训socket中文件描述符fd状态，采用事件回调机制，批量处理fd在内核态与用户态的交换
- 信号io

- aio

*io模型主要区别：什么时候阻塞，阻塞时间多长。*
*io的瓶颈：线程创建销毁开销，内核态用户态交换数据开销。*

nio多路复用，单线程通过多路复用器selector批量处理链接事件，selector批量检查链接内核数据状态。
两阶段进行。select()阻塞（检查就绪状态），检查到就绪态连接，阻塞处理数据。
# bio
![](BIO.png)

bio单线程只能处理一个连接（从连接建立到关闭只能处理这一个连接），全链路阻塞，性能低。两次阻塞，accept等待连接阻塞，read读取数据阻塞
---
单线程只能同时处理一个链接，（客户端断开才能处理下一个，全流程阻塞）
accept 等待客户端请求时阻塞，
read （检查数据是否到达内核缓冲区，无数据阻塞等待）阻塞等待客户端发送数据从网卡写入到内核缓冲区（1.发起中断命令，2.修改文件描述符状态：读已就绪），再由内核缓冲区拷贝到用户态（此时read函数返回数据，解除阻塞）

## 性能问题
- 当个线程只能同时处理一个连接，全链路阻塞，高并发，大量线程创建销毁性能低
- read函数，两次进程切换。其一建立连接后，执行read函数会等待客户端数据写入内核缓冲区时放弃运行；其二，网卡将数据写入内核缓冲区，发出系统中断命令 唤醒进程

# nio
解决了单线程只能处理一个连接问题
read且不再全链路阻塞，数据未到达内核缓冲区时read函数返回-1不再阻塞，当网卡将数据拷贝到内核缓冲区后才阻塞read方法（数据拷贝到用户缓冲区接触阻塞）

但带来问题，每次需遍历所有已建立的链接，查询内核状态，是否有数据接收到了。
高并发，大量连接需遍历性能低
且若不发消息，会充斥大量无用检查（访问内核态）
--- 
nio单线程处理多连接，内核缓冲区数据拷贝到socket数据接收队列时阻塞，数据到达用户缓冲区时解除阻塞。
问题1.高并发且长链接时，每次需要遍历全部链接是否有数据，与内核交换数据多性能低。
问题2.客户端发送一次数据，一次阻塞引起两次cpu进程切换影响性能。
![](NIO.png)


---
接收请求时不阻塞，执行时阻塞

单线程保持多链接，但数据从内核缓冲区拷贝到用户态时阻塞。
线程检查多个链接是否有数据，
当网卡将用户数据拷贝到内核缓冲区时（socket文件描述符变为就绪态），此时read函数检测到数据
read 阻塞，等待内核缓冲区拷贝数据到用户态
返回数据解除阻塞，继续处理数据。
read就是将内核缓冲区就绪数据读取到用户态。
网卡将数据拷贝到内核缓冲区时，发出系统中断命令，修改socket文件描述符为就绪态，read此时阻塞读取数据

# 多路复用
## select
使用selecotor多路复用器，批量检查连接事件状态
执行原理：
1. 将当前进程的所有文件描述符，一次性的从用户态拷贝到内核态。
2. 在内核中快速的无差别遍历每个fd，判断是否有数据达到。
3. 将所有fd状态，从内核态拷贝到用户态，并返回已就绪fd的个数
4. 在用户态遍历判断具体哪个fd已就绪，然后进行相应的事件处理

限制与不足
1.  文件描述符表为 bitma装且有长度为 1024 的限制
2. fdset 无法重用，每次循环必须重新创建（内核态拷贝到用户态后覆盖）
3. 频繁内核态拷贝，性能开销较大。虽然是批量拷贝但次数太多，包括很多无用fd
4. 需要对文件描述符表进行遍历，0(n)的轮询时间复杂度，
**缺点**
- 相对nio减少了与内核数据交换次数但还是频繁交换
- 可监听文件描述符数量限制
- 轮训可用链接时间复杂度O(n)

网卡收到客户端数据，网卡发起中断程序，包含6个操作
1. DMA拷贝技术，网卡数据拷贝到内存缓冲区
2. 修改文件描述符为就绪态
3. 把内核缓冲区数据拷贝到channel数据接收队列
4. 修改内核态的文件描述符信息（修改为就绪态），返回给用户态
5. 唤醒进程等待队列中的进程a，进程a进入CPU运行队列（进程a在select方法调用且连接没有数据时让出CPU运行队列，阻塞[进入channel的进程等待队列]）

## poll

执行原理
1. 将当前进程的所有文件描述符，一次性的从用户态拷贝到内核态（若fd数量不宜过多）
2. 在内中快速的无差别遍历每个fd，判断是否有数据达到。
3. 将所有fd状态，从内核态拷贝到用户态，并返回已就绪fd的个数
4. 在用户态遍历判断具体哪个fd已就绪，然后进行相应的事件处理

问题和不足
1. po11 模型采用的 pollfd结构数组,解决了 Select 1024个文件描述符的限制。
2. 但仍然在在巅繁的用户态和内核态拷贝，性能开销较大。
3. 需对文件描述符表进行遍历，0(n)的轮询时间复杂度，

## epoll
- epoll模型执行原理
启动监听，epoll_ctl函数将链接的文件描述符拷贝到内核态，同时注册回调函数
数据到达内核缓冲区时，调用回调函数将就绪的文件描述符添加到就绪队列（双向链表）
两种触发机制：水平触发、边缘触发
水平触发：内核缓冲区存在数据就会一直通知用户态有数据到达
边缘触发：只会在由新数据到达内核缓冲区时通知（内核/用户态交换次数少，性能高，redis应用）
- 优点
1. 在epo11_ct1()函数中，为每个文件描述符都指定了回调函数,基于回调函数把就绪事件放到就绪队列中，因此，把时间复杂度从0(n)降到了0(1)。
2. 只需要在epol1_ctl()时传递一次文件描述符，epol1_wait()不需要再次传递文件描述符。
3. 基于红黑树+双链表没有最大连接数的限制，不存在C1OK问题。
4. 注意:epoll没有使用MMAP零拷贝技术
- epoll比select和poll优势在哪里
poll优化了fbset（基于数组）最大1024个链接问题,可变长度结构体(pollfd)集合
```
pollfd {
    fd, //文件描述符
    events, // 监控的事件
    revents // 监控事件中满足条件返回的事件
}
```

epoll监听事件时将用户态文件描述符注册到内核态，当数据到达后触发回调函数将内核态文件描述符及数据拷贝到用户态（两次数据交换）
select和poll轮训不停的发生内核态和用户态数据交换

select和poll轮训复杂度O(n)
epoll O(1) 返回就绪的文件描述符双向量表

- epoll为什么使用红黑树而不是hash/b+树存储关键事件
不明确链接数量，hash冲突及扩容问题，高并发大量链接易导致冲突与频繁扩容，不适用高性能场景
b+树 增删改查时间复杂度log(n) 维护叶节点链表适用于mysql数据库作为索引
红黑树作为二叉平衡树时间复杂度log(n)
- 为什么还在使用poll
1. 并发量不高的情况下遍历hash表性能也很高


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




