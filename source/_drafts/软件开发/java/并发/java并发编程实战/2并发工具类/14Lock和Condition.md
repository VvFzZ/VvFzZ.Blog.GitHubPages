---
title: 14Lock和Condition
tags:
description:
---
Java SDK并发包实现管程：Lock、Condition接口来
Lock解决互斥问题，Condition解决同步问题

# 为什么再造管程
java语言层面synchronized实现管程为什么还提供SDK并发包里的实现呢？性能不是原因那是什么？
重新设计一把互斥锁解决不可抢占的问题
1. 能够响应中断
`void lockInterruptibly() `
2. 支持超时
`boolean tryLock(long time, TimeUnit unit) `
3. 非阻塞地获取锁
`boolean tryLock();`

synchronized阻塞状态调用线程的interrupt方法不会中断
## ReentrantLock
volatile/CAS/AQS

AQS 同步队列 FIFO 双向链表
实现条件变量的条件队列 单向链表 用于支持await/signal
调用await时，释放锁进入条件队列，调用signal时，从条件队列迁移至同步队列，重新竞争锁。

**同步队列为什么使用双向链表**
为了支持高效的线程管理和同步操作，
- 高效删除任意节点，单链表需遍历
如超时，取消等待，迁移到条件队列

**ReentrantLock 如何保证可见性**
关键点：volatile state
获取锁时先读写state，释放锁时再次读写state，happens-before传递性保证可见
```
class SampleLock {
  volatile int state;
  // 加锁
  lock() {
    // 省略代码无数
    state = 1;
  }
  // 解锁
  unlock() {
    // 省略代码无数
    state = 0;
  }
}
```

**可重入**
可重入锁
可重入函数，指的是多个线程可以同时调用该函数,每个线程都能得到正确结果:线程安全

**公平/非公平**


# Lock、Condition
## 利用两个条件变量快速实现阻塞队列
```
public class BlockedQueue<T>{
  final Lock lock =
    new ReentrantLock();
  // 条件变量：队列不满  
  final Condition notFull =
    lock.newCondition();
  // 条件变量：队列不空  
  final Condition notEmpty =
    lock.newCondition();
 
  // 入队
  void enq(T x) {
    lock.lock();
    try {
      while (队列已满){
        // 等待队列不满
        notFull.await();
      }  
      // 省略入队操作...
      // 入队后, 通知可出队
      notEmpty.signal();
    }finally {
      lock.unlock();
    }
  }
  // 出队
  void deq(){
    lock.lock();
    try {
      while (队列已空){
        // 等待队列不空
        notEmpty.await();
      }  
      // 省略出队操作...
      // 出队后，通知可入队
      notFull.signal();
    }finally {
      lock.unlock();
    }  
  }
}
```

## 同步与异步
如何实现异步
- 异步调用
调用方创建一个子线程，在子线程中执行方法调用
- 异步方法
方法实现的时候，创建一个新的线程执行主要逻辑，主线程直接 return

## Dubbo同步转异步
```
public class DubboInvoker{
  Result doInvoke(Invocation inv){
    // 下面这行就是源码中 108 行
    // 为了便于展示，做了修改
    return currentClient 
      .request(inv, timeout) //DefaultFuture
      .get();
  }
}
// 创建锁与条件变量
private final Lock lock 
    = new ReentrantLock();
private final Condition done 
    = lock.newCondition();
 
// 调用方通过该方法等待结果
Object get(int timeout){
  long start = System.nanoTime();
  lock.lock();
  try {
	while (!isDone()) {
	  done.await(timeout);
      long cur=System.nanoTime();
	  if (isDone() || 
          cur-start > timeout){
	    break;
	  }
	}
  } finally {
	lock.unlock();
  }
  if (!isDone()) {
	throw new TimeoutException();
  }
  return returnFromResponse();
}
// RPC 结果是否已经返回
boolean isDone() {
  return response != null;
}
// RPC 结果返回时调用该方法   
private void doReceived(Response res) {
  lock.lock();
  try {
    response = res;
    if (done != null) {
      done.signal();
    }
  } finally {
    lock.unlock();
  }
}
```
获取结果时await，等待doReceived调用signal唤醒

## 总结
Lock&Condition实现的管程相对于synchronized更灵活、功能更丰富