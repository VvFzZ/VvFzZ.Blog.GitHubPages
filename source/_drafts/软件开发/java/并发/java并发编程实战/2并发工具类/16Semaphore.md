---
title: 16Semaphore
tags:
description:
---

1965迪杰斯特拉提出，之后15年是并发编程领域的终结者，直到 1980年管程提出来，才有了第二选择

# 信号量模型
一个计数器，一个等待队列，三个方法（init、down、up）
计数器和等待队列对外是透明的，只能通过信号量模型提供的三个方法来访问它们
- init
设置计数器的初始值。
- down
计数器值减1，如果计数器的值小于0，则当前线程将被阻塞，否则继续执行。
- up
计数器值加1，如果计数器值小于或者等于0，则唤醒等待队列中的一个线程，并将其移除。


# 快速实现一个限流器
```
class ObjPool<T, R> {
  final List<T> pool;
  // 用信号量实现限流器
  final Semaphore sem;
  // 构造函数
  ObjPool(int size, T t){
    pool = new Vector<T>(){};
    for(int i=0; i<size; i++){
      pool.add(t);
    }
    sem = new Semaphore(size);
  }
  // 利用对象池的对象，调用 func
  R exec(Function<T,R> func) {
    T t = null;
    sem.acquire();
    try {
      t = pool.remove(0);
      return func.apply(t);
    } finally {
      pool.add(t);
      sem.release();
    }
  }
}
// 创建对象池
ObjPool<Long, String> pool = 
  new ObjPool<Long, String>(10, 2);
// 通过对象池获取 t，之后执行  
pool.exec(t -> {
    System.out.println(t);
    return t.toString();
});
```

注意：Semaphore 可以允许多个线程访问一个临界区，所以在acquire后的操作要保证线程安全
# 思考题
- 对象保存在了 Vector 中，Vector 是 Java 提供的线程安全的容器，如果我们把 Vector 换成 ArrayList，是否可以呢？
不可，semophore允许多线程访问临界区，即多线程同时调用pool.remove方法时应保证线程安全