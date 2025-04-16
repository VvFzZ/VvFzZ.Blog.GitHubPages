---
title: 23Future
tags:
description:
---
void execute(Runnable command)方法无法获取线程执行结果

# 获取任务执行结果
## submit方法
Java通过ThreadPoolExecutor的3个submit()方法和1个FutureTask工具类支持获得任务执行结果
```
//提交Runnable任务,Future结果对象为空，可通过此对象判断任务是否结束
Future<?> submit(Runnable task);
//提交Runnable任务及结果引用，
<T> Future<T> submit(Runnable task, T result);

//提交Callable任务
<T> Future<T> submit(Callable<T> task);
```
### submit(Runnable,result)
`<T> Future<T> submit(Runnable task, T result);`
通过future.get获取的结果和submit参数result是一个对象。
经典用法：Runnable接口的实现类Task声明了一个有参构造函数Task(Result r) 
创建Task对象的时传入了result对象，即可在类Task的run()方法中对result进行各种操作（即在子线程中操作）。
result相当于主线程和子线程之间的桥梁，通过它主子线程可以共享数据。
## Future
Future接口有5个方法
取消任务的方法 cancel()
判断任务是否已取消的方法 isCancelled()
判断任务是否已结束的方法 isDone()
获得任务执行结果2个 get()和get(timeout, unit)

```
//取消任务
boolean cancel(boolean mayInterruptIfRunning);
//判断是否已取消  
boolean isCancelled();
//判断是否已结束
boolean isDone();
//获得执行结果
get();
//获得执行结果，支持超时
get(long timeout, TimeUnit unit);
```
### FutureTask
FutureTask实现了Runnable和Future接口
实现Runnable接口，所以可以将FutureTask提交给ThreadPoolExecutor执行，也可被Thread执行
实现Future接口，所以也能获得任务结果

示例1.提交给ThreadPoolExecutor去执行
```
// 创建FutureTask
FutureTask<Integer> futureTask
  = new FutureTask<>(()-> 1+2);
// 创建线程池
ExecutorService es = Executors.newCachedThreadPool();
// 提交FutureTask 
es.submit(futureTask);
// 获取计算结果
Integer result = futureTask.get();
```
示例2：Thread执行
```
// 创建FutureTask
FutureTask<Integer> futureTask
  = new FutureTask<>(()-> 1+2);
// 创建并启动线程
Thread T1 = new Thread(futureTask);
T1.start();
// 获取计算结果
Integer result = futureTask.get();
```

# 总结
Future可以很容易获得异步（线程池或新建线程）任务的执行结果
任务之间依赖关系，基本上可用Future来解决，可用有向图描述任务间的依赖关系，同时做好线程分工
多线程可将串行的任务并行化提高性能





















































