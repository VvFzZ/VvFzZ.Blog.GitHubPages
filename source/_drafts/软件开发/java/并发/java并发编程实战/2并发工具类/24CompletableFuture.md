---
title: 24CompletableFuture
tags:
description:
---
CompletableFuture异步编程（java1.8）

# 创建CompletableFuture对象
- 两个基础接口：
`runAsync(Runnable runnable) 与 supplyAsync(Supplier<U> supplier)`区别:是否有返回值
- 两个重载接口-可自定义线程池：
`runAsync(Runnable runnable, Executor executor)、supplyAsync(Supplier<U> supplier, Executor executor) `
CompletableFuture 实现 Future<T>和CompletionStage<T>，Futrue接口可获取线程运行状态和结果

# 如何理解CompletionStage接口
描述任务间的时序关系
## 串行
- thenApply 
有参数和返回值
- thenAccept
有参数无返回值
- thenRun
无参数无返回值
- thenCompose

以上接口区别：fn、consumer、action这三个核心参数不同

*Async版本接口在ForkjoinPool线程池中获取一个线程继续执行

```
CompletableFuture<String> f0 = 
  CompletableFuture.supplyAsync(
    () -> "Hello World")      //①
  .thenApply(s -> s + " QQ")  //②
  .thenApply(String::toUpperCase);//③

System.out.println(f0.join());
//输出结果
HELLO WORLD QQ
```
supplyAsync启动一个异步流程，之后是两个串行操作,任务①②③串行执行。

## AND汇聚关系
- thenCombine
有参数有返回值
- thenAcceptBoth
有参数无返回值
- runAfterBoth
无参数无返回值

## OR汇聚关系
- applyToEither
有参数有返回值
- acceptEither
有参数无返回值
- runAfterEither
无参数无返回值


## 异常
注意：外部无法自动捕获异常，需使用以下方法
1. catch
    - exceptionally(ex)
2. finally
    - handle(result,ex) 
    有返回值
    - whenComplete(result,ex) 
    无返回值


# 思考题
## 以下代码是否有问题？
```
//采购订单
PurchersOrder po;
CompletableFuture<Boolean> cf = 
  CompletableFuture.supplyAsync(()->{
    //在数据库中查询规则
    return findRuleByJdbc();
  }).thenApply(r -> {
    //规则校验
    return check(po, r);
});
Boolean isOk = cf.join();
```

答：findRuleByJdbc方法隐藏着阻塞式I/O，这意味着会阻塞调用线程。
默认情况下所有的CompletableFuture共享一个ForkJoinPool，当有阻塞式I/O时，可能导致所有的ForkJoinPool线程都阻塞，进而影响整个系统的性能。
利用共享往往能让我们快速实现功能，有福同享，代价就是有难要同当。强调高可用的今天，大多数人更倾向于隔离方案。





