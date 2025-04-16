---
title: 26ForkJoin
tags:
description:
---
Fork/Join并行计算框架，支持分治任务模型
解决复杂问题的思维方法和模式
分治：复杂问题分解成相似子问题，直到子问题简单到可直接求解

# 分治任务模型
两阶段：Fork任务分解、Join结果合并
两部分：分治任务线程池ForkJoinPool，分治任务ForkJoinTask
类似ThreadPoolExecutor和Runnable的关系，都可以理解为提交任务到线程池，不过分治任务有自己独特类型ForkJoinTask。

# Fork/Join使用
ForkJoinTask是一个抽象类包含两个方法：
- fork()方法会异步地执行一个子任务
- join()方法则会阻塞当前线程等待子任务执行结果
ForkJoinTask两个子抽象类，定义了compute方法
- RecursiveAction
compute方法没有返回
- RecursiveTask
compute方法有返回

```
//Fork/Join这个并行计算框架计算斐波那契数列
static void main(String[] args){
  //创建分治任务线程池  
  ForkJoinPool fjp = 
    new ForkJoinPool(4);
  //创建分治任务
  Fibonacci fib = 
    new Fibonacci(30);   
  //启动分治任务  
  Integer result = 
    fjp.invoke(fib);
  //输出结果  
  System.out.println(result);
}
//递归任务
static class Fibonacci extends 
    RecursiveTask<Integer>{
  final int n;
  Fibonacci(int n){this.n = n;}
  protected Integer compute(){
    if (n <= 1)
      return n;
    Fibonacci f1 = 
      new Fibonacci(n - 1);
    //创建子任务  
    f1.fork();
    Fibonacci f2 = 
      new Fibonacci(n - 2);
    //等待子任务结果，并合并结果  
    return f2.compute() + f1.join();
  }
}
```
# ForkJoinPool工作原理
- ThreadPoolExecutor
是一个生产者-消费者模式的实现，内部一个任务队列，任务队列是生产者和消费者通信的媒介
- ThreadPoolExecutor
可以有多个工作线程，但是这些工作线程都共享一个任务队列（双端队列）。

ForkJoinPool内部有多个任务队列，通过ForkJoinPool的invoke()或者submit()方法提交任务时，ForkJoinPool根据一定的路由规则把任务提交到一个任务队列中，如果任务在执行过程中会创建出子任务，子任务会提交到工作线程对应的任务队列中。


**"任务窃取"机制**让所有线程的工作量基本均衡,不会出现忙线程和闲线程，性能很好。
工作线程正常获取任务和“窃取任务”分别是从任务队列不同的端消费，这样能避免很多不必要的数据竞争。

# Stream API应用ForkJoinPool
Java1.8提供的Stream API并行流以ForkJoinPool为基础，默认所有并行流计算共享一个ForkJoinPool，默认的线程数是CPU的核数。
所有的并行流计算都是CPU密集型计算完全没有问题，但是如果存在I/O密集型的并行流计算，可能会因为一个很慢的I/O计算而拖慢整个系统的性能。所以建议用不同的ForkJoinPool执行不同类型的计算任务。




