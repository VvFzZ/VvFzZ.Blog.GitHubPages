---
title: 19CountDownLatch和CyclicBarrier
tags:
description:
---
让多线程步调一致

业务介绍：
在线商城下单，生成电子订单，保存在订单库；
物流生成派送单发货，派送单保存在派送单库。
为防止漏派送或重复派送，对账系统每天还会校验是否存在异常订单。

# 串行方式
```
while(存在未对账订单){
  // 查询未对账订单
  pos = getPOrders();
  // 查询派送单
  dos = getDOrders();
  // 执行对账操作
  diff = check(pos, dos);
  // 差异写入差异库
  save(diff);
} 
```
<img src="CountDownLatch串行.png" width="300" height="200">

# 并行优化对账系统

## 并行查询订单和派送单
```
while(存在未对账订单){
  // 查询未对账订单
  Thread T1 = new Thread(()->{
    pos = getPOrders();
  });
  T1.start();
  // 查询派送单
  Thread T2 = new Thread(()->{
    dos = getDOrders();
  });
  T2.start();
  // 等待 T1、T2 结束
  T1.join();
  T2.join();
  // 执行对账操作
  diff = check(pos, dos);
  // 差异写入差异库
  save(diff);
} 
```
<img src="CountDownLatch并行1.png.png" width="300" height="200">

### 线程池优化
```
// 创建 2 个线程的线程池
Executor executor = 
  Executors.newFixedThreadPool(2);
while(存在未对账订单){
  // 查询未对账订单
  executor.execute(()-> {
    pos = getPOrders();
  });
  // 查询派送单
  executor.execute(()-> {
    dos = getDOrders();
  });
  
  /* ？？如何实现等待？？*/
  
  // 执行对账操作
  diff = check(pos, dos);
  // 差异写入差异库
  save(diff);
}
```
如下，使用线程池如何知道查询线程完成了呢
1. 可通过管程实现计数器，计数器初始2，查询完成--，计数器为0则重置为2并执行对对账入库
2. 使用CountDownLatch
### CountDownLatch优化
```
// 创建 2 个线程的线程池
Executor executor = 
  Executors.newFixedThreadPool(2);
while(存在未对账订单){
  // 计数器初始化为 2
  CountDownLatch latch = 
    new CountDownLatch(2);
  // 查询未对账订单
  executor.execute(()-> {
    pos = getPOrders();
    latch.countDown();
  });
  // 查询派送单
  executor.execute(()-> {
    dos = getDOrders();
    latch.countDown();
  });
  
  // 等待两个查询操作结束
  latch.await();
  
  // 执行对账操作
  diff = check(pos, dos);
  // 差异写入差异库
  save(diff);
}
```

## 进一步性能优化
优化点：两个查询操作和对账操作check、save仍是串行

需要引入订单队列和派送单队列，T1查询订单，T2查询派送单，T1T2各自生产1条数据后通知T3执行对账。（T1T2要互相等待）

### 实现计数器优化
可以利用一个计数器来解决这两个难点，计数器初始化为 2，线程 T1 和 T2 生产完一条数据都将计数器减 1，如果计数器大于 0 则线程 T1 或者 T2 等待。如果计数器等于 0，则通知线程 T3，并唤醒等待的线程 T1 或者 T2，与此同时，将计数器重置为 2，这样线程 T1 和线程 T2 生产下一条数据的时候就可以继续使用这个计数器了。

但建议使用Java并发包工具类：CyclicBarrier。

### CyclicBarrier

<img src="CountDownLatch并行2.png.png" width="300" height="200">

```
// 订单队列
Vector<P> pos;
// 派送单队列
Vector<D> dos;
// 执行回调的线程池 
Executor executor = 
  Executors.newFixedThreadPool(1);
final CyclicBarrier barrier =
  new CyclicBarrier(2, ()->{
    executor.execute(()->check());
});

void check(){
  P p = pos.remove(0);
  D d = dos.remove(0);
  // 执行对账操作
  diff = check(p, d);
  // 差异写入差异库
  save(diff);
}
  
void checkAll(){
  // 循环查询订单库
  Thread T1 = new Thread(()->{
    while(存在未对账订单){
      // 查询订单库
      pos.add(getPOrders());
      // 等待
      barrier.await();
    }
  }
  T1.start();  
  // 循环查询运单库
  Thread T2 = new Thread(()->{
    while(存在未对账订单){
      // 查询运单库
      dos.add(getDOrders());
      // 等待
      barrier.await();
    }
  }
  T2.start();
}
```

# 总结

CountDownLatch 主要用来解决一个线程等待多个线程的场景，计数器是不能循环利用的，计数器为0时await直接通过
CyclicBarrier 是一组线程之间互相等待，计数器是可以循环利用的，可设置回调函数


## 还可使用线程池Future优化
```
CompletableFuture<List> pOrderFuture = CompletableFuture.supplyAsync(this::getPOrders);
CompletableFuture<List> dOrderFuture = CompletableFuture.supplyAsync(this::getDOrders);
pOrderFuture.thenCombine(dOrderFuture, this::check).thenAccept(this::save);
```
# 问题
CyclicBarrier 的回调函数我们使用了一个固定大小的线程池，有必要吗？
有，