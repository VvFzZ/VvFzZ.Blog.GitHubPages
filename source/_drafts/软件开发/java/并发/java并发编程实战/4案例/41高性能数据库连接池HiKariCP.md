---
title: 41高性能数据库连接池HiKariCP
tags:
description:
---

# 什么是数据库连接池

作用：避免重量级资源（数据库连接）频繁创建和销毁

HiKariCP性能高 微观上在字节码角度优化java代码，编译出的字节码更高效
宏观上和两个数据结构有关：FastList、ConcurrentBag

# FastList解决了哪些性能问题
## 查找顺序变逆序查找
假设一个Connection依次创建6个Statement，分别是S1、S2、S3、S4、S5、S6，按照正常的编码习惯，关闭Statement的顺序一般是逆序的，关闭的顺序是：S6、S5、S4、S3、S2、S1，而ArrayList的remove(Object	o)方法是顺序遍历查找，逆序删除而顺序查找，这样的查找效率就太慢了。如何优化呢？很简单，优化成逆序查找就可以了。
## 优化越界检查
保证不会越界，不需要每次进行越界检查
# ConcurrentBag
## add方法
创建一个数据库连接，add方法加入到ConcurrentBag中
逻辑说明：将连接加入共享队列sharedList中，如果此时有线程在等待数据库连接，那么就通过handoffQueue将其分配给等待的线程。
```
//将空闲连接添加到队列
void	add(final	T	bagEntry){
    //加⼊共享队列
    sharedList.add(bagEntry);
    //如果有等待连接的线程，
    //则通过handoffQueue直接分配给等待的线程
    while(waiters.get()	>	0
    &&	bagEntry.getState()	==	STATE_NOT_IN_USE	
    &&	!handoffQueue.offer(bagEntry))	{
        yield();
    }
}
```
## borrow方法，获取空闲数据库连接
1. 优先从线程本地存储获取空闲连接
    - 需要用CAS方法防止重复分配,因为本地存储中的连接是可以被其他线程窃取
2. 没有，则到共享队列获取(CAS获取)
3. 共享队列中没有，则请求线程等待

## requite 释放连接
连接状态更改为STATE_NOT_IN_USE
有等待线程则分配给它，没有则保存到线程本地存储

# 总结
HiKariCP中的FastList和ConcurrentBag这两个数据结构设计巧妙，适用于数据库连接池这个特定的场景。
FastList适用于逆序删除场景
ConcurrentBag通过ThreadLocal做一次预分配，避免直接竞争共享资源，非常适合池化资源的分配。


