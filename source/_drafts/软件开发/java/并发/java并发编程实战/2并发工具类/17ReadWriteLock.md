---
title: 17ReadWriteLock
tags:
description:
---

管程和信号量可以解决所有并发问题，java SDK提供其他工具类有什么用呢？分场景性能优化，提升易用性

ReadWriteLock 读多写少场景

**读写锁的原则**
1. 允许多线程读共享变量
2. 只允许一个线程写共享变量
3. 一个线程写时，其他线程禁止读写

读多写少的情况下优于互斥锁

# 快速实现一个缓存
不支持懒加载，需一次性初始化
```
class Cache<K,V> {
  final Map<K, V> m =
    new HashMap<>();
  final ReadWriteLock rwl =
    new ReentrantReadWriteLock();
  // 读锁
  final Lock r = rwl.readLock();
  // 写锁
  final Lock w = rwl.writeLock();
  // 读缓存
  V get(K key) {
    r.lock();
    try { return m.get(key); }
    finally { r.unlock(); }
  }
  // 写缓存
  V put(String key, Data v) {
    w.lock();
    try { return m.put(key, v); }
    finally { w.unlock(); }
  }
}
```

支持懒加载版本
```
class Cache<K,V> {
  final Map<K, V> m =
    new HashMap<>();
  final ReadWriteLock rwl = 
    new ReentrantReadWriteLock();
  final Lock r = rwl.readLock();
  final Lock w = rwl.writeLock();
 
  V get(K key) {
    V v = null;
    // 读缓存
    r.lock();         ①
    try {
      v = m.get(key); ②
    } finally{
      r.unlock();     ③
    }
    // 缓存中存在，返回
    if(v != null) {   ④
      return v;
    }  
    // 缓存中不存在，查询数据库
    w.lock();         ⑤
    try {
      // 再次验证
      // 其他线程可能已经查询过数据库
      v = m.get(key); ⑥
      if(v == null){  ⑦
        // 查询数据库
        v= 省略代码无数
        m.put(key, v);
      }
    } finally{
      w.unlock();
    }
    return v; 
  }
}
```
## 锁升级降级
锁升级：先是获取读锁，再升级为写锁
ReadWriteLock不支持锁升级，支持降级
不支持升级原因：读锁未释放时获取写锁，导致写锁永久等待，线程阻塞无法被唤醒。

```
lass CachedData {
  Object data;
  volatile boolean cacheValid;
  final ReadWriteLock rwl =
    new ReentrantReadWriteLock();
  // 读锁  
  final Lock r = rwl.readLock();
  // 写锁
  final Lock w = rwl.writeLock();
  
  void processCachedData() {
    // 获取读锁
    r.lock();
    if (!cacheValid) {
      // 释放读锁，因为不允许读锁的升级
      r.unlock();
      // 获取写锁
      w.lock();
      try {
        // 再次检查状态  并发很低可不检查
        if (!cacheValid) {
          data = ...
          cacheValid = true;
        }
        // 释放写锁前，降级为读锁
        // 降级是可以的
        r.lock(); ①
      } finally {
        // 释放写锁
        w.unlock(); 
      }
    }
    // 此处仍然持有读锁
    try {use(data);} 
    finally {r.unlock();}
  }
}
```

# 总结
读写锁的读锁不支持条件变量，写锁支持

# 问题
## 如何保证缓存与数据库数据一致？
1. 延迟双删策略
先删除缓存，再更新数据库,更新数据库后，延迟一段时间再次删除缓存
减少高并发场景下的数据不一致问题，但仍然存在一些挑战，如延迟时间的选择和第二次删除缓存失败的处理
2. 加锁串行化
强一致实现方案，会导致性能下降
3. 订阅binlog
需要额外的系统支持，减少业务代码入侵
## 系统停止响应了，CPU 利用率很低，你怀疑有同学一不小心写出了读锁升级写锁的方案，那你该如何验证自己的怀疑呢？
尝试获取读/写锁看是否能获取到
