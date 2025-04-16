---
title: 34WorkerThread模式
tags:
description:
---
# 正确地创建线程池
- 使用有界队列
- 指明拒绝策略
- 业务相关的名字

# 线程死锁的场景
现象：应用每运行一段时间偶尔就会处于无响应的状态，监控数据看上去一切都正常，但是实际上已经不能正常工作。

```
//L1、L2两阶段任务共用一个线程池
ExecutorService es = Executors.
  newFixedThreadPool(2);
//L1阶段的闭锁    
CountDownLatch l1=new CountDownLatch(2);
for (int i=0; i<2; i++){
  System.out.println("L1");
  //执行L1阶段任务
  es.execute(()->{
    //L2阶段的闭锁 
    CountDownLatch l2=new CountDownLatch(2);
    //执行L2阶段子任务
    for (int j=0; j<2; j++){
      es.execute(()->{
        System.out.println("L2");
        l2.countDown();
      });
    }
    //等待L2阶段任务执行完
    l2.await();
    l1.countDown();
  });
}
//等着L1阶段任务执行完
l1.await();
System.out.println("end");
```
两个线程全部都阻塞在 l2.await();没有空闲的线程执行L2阶段的任务了.
解决办法：不同阶段任务使用不同线程池

**提交到相同线程池中的任务一定是相互独立的，否则就一定要慎重**
# 总结
- 正确创建线程池
使用有界队列
指明拒绝策略
业务相关的名字
- 避免死锁
- ThreadLocal内存泄露问题
- 异常处理