---
title: 22Executor与线程池
tags:
description:
---
创建线程不仅在堆区分配内存（普通对象），还需要操作系统调用系统内核API为线程分配资源，成本很高。
作为重量级对象，应避免频繁创建销毁。

**生产-消费模式**
ThreadPoolExecutor不像通常的池资源那样pool.aquaire，pool.release，而是强调executor的生产消费模式，调用者是生产者，线程池是消费者。

```
ThreadPoolExecutor(
  int corePoolSize,
  int maximumPoolSize,
  long keepAliveTime,
  TimeUnit unit,
  BlockingQueue<Runnable> workQueue,
  ThreadFactory threadFactory,
  RejectedExecutionHandler handler) 
```
- corePoolSize 核心线程数
- maximumPoolSize 最大线程数
- keepAliveTime & unit 超过指定时间回收非核心线程
- workQueue 工作队列（任务队列）
- threadFactory 自定义如何创建线程，例如你可以给线程指定一个有意义的名字
- handler 自定义任务的拒绝策略（前提有界队列）
    1. CallerRunsPolicy：提交任务的线程自己去执行该任
    2. AbortPolicy：默认的拒绝策略，会throws RejectedExecutionException。
    3. DiscardPolicy：直接丢弃任务，没有任何异常抛出。
    4. DiscardOldestPolicy：丢弃最老的任务,新任务加入到工作队列

Java1.6增加了allowCoreThreadTimeOut(boolean value)方法允许核心线程超时

**不建议使用无界队列**
不建议使用Executors的最重要的原因是：Executors提供的很多方法默认使用的都是无界的LinkedBlockingQueue，高负载情境下，无界队列很容易导致OOM，而OOM会导致所有请求都无法处理，这是致命问题。所以强烈建议使用有界队列。

**拒绝策略**
有界队列，任务过多触发拒绝策略，线程池默认拒绝策略会throw RejectedExecutionException运行时异常，编译器不会强制处理它，避免容易忽略，默认拒绝策略要慎用。
重要的任务要自定义拒绝策略，与降级策略配合使用。
**异常**
ThreadPoolExecutor.execute提交任务，执行出现异常线程终止，但获取不到通知，需自己捕获异常按需处理。

# 其他
SpringBoot线程池 ThreadPoolTaskExecutor 可设置线程名前缀