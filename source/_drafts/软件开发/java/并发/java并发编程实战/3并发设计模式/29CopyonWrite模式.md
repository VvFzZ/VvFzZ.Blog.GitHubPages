---
title: 29CopyonWrite模式
tags:
description:
---
不可变对象的写操作往往都是使用Copy-on-Write方法解决的
COW 写时复制

CopyOnWriteArrayList和CopyOnWriteArraySet这两个Copy-on-Write容器在修改时复制整个数组，所以如果容器经常被修改或者这个数组本身就非常大的时候，不建议使用的。修改非常少、数组数量也不大，并且对读性能要求苛刻的场景，使用Copy-on-Write容器效果就非常好了。

# Copy-on-Write模式的应用领域
CopyOnWriteArrayList和CopyOnWriteArraySet这两个Copy-on-Write容器,读操无锁,性能极好
**创建进程**
类Unix的操作系统中创建进程的API是fork()，传统的fork()函数会创建父进程的一个完整副本，例如父进程的地址空间现在用到了1G的内存，那么fork()子进程的时候要复制父进程整个进程的地址空间（占有1G内存）给子进程，这个过程是很耗时的。而Linux中的fork()函数就聪明得多了，fork()子进程的时候，并不复制整个进程的地址空间，而是让父子进程共享同一个地址空间；**只用在父进程或者子进程需要写入的时候才会复制地址空间，从而使父子进程拥有各自的地址空间。**
**文件系统**
Btrfs (B-Tree File System)、aufs（advanced multi-layered unification filesystem）等

# 设计路由表
对读的性能要求很高，读多写少，弱一致性

```
//路由信息
public final class Router{
  private final String  ip;
  private final Integer port;
  private final String  iface;
  //构造函数
  public Router(String ip, 
      Integer port, String iface){
    this.ip = ip;
    this.port = port;
    this.iface = iface;
  }
  //重写equals方法
  public boolean equals(Object obj){
    if (obj instanceof Router) {
      Router r = (Router)obj;
      return iface.equals(r.iface) &&
             ip.equals(r.ip) &&
             port.equals(r.port);
    }
    return false;
  }
  public int hashCode() {
    //省略hashCode相关代码
  }
}
//路由表信息
public class RouterTable {
  //Key:接口名
  //Value:路由集合
  ConcurrentHashMap<String, CopyOnWriteArraySet<Router>> 
    rt = new ConcurrentHashMap<>();
  //根据接口名获取路由表
  public Set<Router> get(String iface){
    return rt.get(iface);
  }
  //删除路由
  public void remove(Router router) {
    Set<Router> set=rt.get(router.iface);
    if (set != null) {
      set.remove(router);
    }
  }
  //增加路由
  public void add(Router router) {
    Set<Router> set = rt.computeIfAbsent(
      route.iface, r -> 
        new CopyOnWriteArraySet<>());
    set.add(router);
  }
}
```
## 设计思考
服务提供方上线、下线都会更新路由信息，这时有两种选择。
一种通过更新Router的状态位来标识，这样做所有访问该状态位的地方都需要同步访问，很影响性能。
一种采用Immutability模式，每次上线、下线创建新的Router对象或者删除对应的Router对象。由于上线、下线的频率很低，所以后者是最好的选择。































