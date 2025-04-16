---
title: 18StampedLock
tags:
description:
---

# 使用
三种模式锁：写锁、悲观读锁、乐观读
乐观读允许其他线程获取写锁，它是无锁的，性能比ReadWriteLock更好

注意事项：
- 不支持重入
- 不支持条件变量
- 中断使用readLockInterruptibly、writeLockInterruptibly
```
final StampedLock sl = new StampedLock();  
// 获取 / 释放悲观读锁示意代码
long stamp = sl.readLock();
try {
  // 省略业务相关代码
} finally {
  sl.unlockRead(stamp);
}
 
// 获取 / 释放写锁示意代码
long stamp = sl.writeLock();
try {
  // 省略业务相关代码
} finally {
  sl.unlockWrite(stamp);
}

class Point {
  private int x, y;
  final StampedLock sl = 
    new StampedLock();
  // 计算到原点的距离  
  int distanceFromOrigin() {
    // 乐观读
    long stamp = sl.tryOptimisticRead();
    // 读入局部变量，
    // 读的过程数据可能被修改
    int curX = x, curY = y;
    // (判断版本号)判断执行读操作期间，是否存在写操作，如果存在，则 sl.validate 返回 false； 
    if (!sl.validate(stamp)){ //
      // 升级为悲观读锁
      stamp = sl.readLock();
      try {
        curX = x;
        curY = y;
      } finally {
        // 释放悲观读锁
        sl.unlockRead(stamp);
      }
    }
    return Math.sqrt(
      curX * curX + curY * curY);
  }
}
```
上例中升级为悲观读锁是合理的，否则需要循环执行乐观读直到乐观读期间没有写操作，避免循环读浪费大量CPU。

## 数据库乐观锁
增加版本号列，每次更新时验证版本号是否是最新的
优点：利用数据库行锁进行并发控制，降低锁粒度。相对业务悲观锁降低复杂度，不需要处理死锁及超时问题。
应用场景：短事务，不侵入业务处理，集成简单
