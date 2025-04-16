---
title: 42Actor模型
tags:
description:
---
Actor模型本质：以Actor作为基本计算单元的计算模型
在面向对象编程里面，一切都是对象；
在Actor模型里，一切都是Actor，并且Actor之间是完全隔离的，**不会共享任何变量**。

Actor异步模型缺点：
- 理论上不保证消息百分百送达
- 不保证消息送达和发送顺序一致 
- 无法保证消息会被百分百处理

Java需要借助第三方类库使用Actor模型，如Akka、Vert.x
```
    //该Actor当收到消息message后，
    //会打印Hello message
    static class HelloActor extends UntypedActor {
        @Override
        public void onReceive(Object message) {
            System.out.println("Hello	" + message);
        }
    }

    public static void main(String[] args) {
        //创建Actor系统
        ActorSystem system = ActorSystem.create("HelloSystem");
        //创建HelloActor
        ActorRef helloActor = system.actorOf(Props.create(HelloActor.class));
        //发送消息给HelloActor
        helloActor.tell("Actor", ActorRef.noSender());
    }
```

# 消息机制
Actor模型异步消息机制：发送消息仅仅是发送出去，接收到后可能不会立即处理

内部可保存消息表，接收到消息放入消息表，如果消息表中有数据则新消息不会马上得到处理
单线程处理消息,无并发问题

**Actor不仅适用于并发计算，且适用于分布式计算**
发送消息和接收消息的Actor可以不在一个进程中，也可以不在同一台机器上，只需要知道对方的地址。

# Actor的规范化定义？？？
基础的计算单元，具体来讲包括三部分能力
1. 处理能力，处理接收到的消息。
2. 存储能力，Actor可以存储自己的内部状态，并且内部状态在不同Actor之间是绝对隔离的。
3. 通信能力，Actor可以和其他Actor之间通信。
当一个Actor接收的一条消息之后，这个Actor可以做以下三件事：
1. 创建更多的Actor；
2. 发消息给其他Actor；
3. 确定如何处理下一条消息。

# Actor实现累加器
```
 //累加器
    static class CounterActor extends UntypedActor {
        private int counter = 0;

        @Override
        public void onReceive(Object message) {
        //如果接收到的消息是数字类型，执⾏累加操作，
        //否则打印counter的值
            if (message instanceof Number) {
                counter += ((Number) message).intValue();
            } else {
                System.out.println(counter);
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        //创建Actor系统
        ActorSystem system = ActorSystem.create("HelloSystem");
        //4个线程⽣产消息
        ExecutorService es = Executors.newFixedThreadPool(4);
        //创建CounterActor	
        ActorRef counterActor =
                system.actorOf(Props.create(CounterActor.class));
        //⽣产4*100000个消息
        for (int i = 0; i < 4; i++) {
            es.execute(() -> {
                for (int j = 0; j < 100000; j++) {
                    counterActor.tell(1, ActorRef.noSender());
                }
            });
        }
        //关闭线程池
        es.shutdown();
        //等待CounterActor处理完所有消息
        Thread.sleep(1000);
        //打印结果
        counterActor.tell("", ActorRef.noSender());
        //关闭Actor系统
        system.shutdown();
    }
```

