---
title: 4Zookeeper服务发布和订阅机制解析
description: 4Zookeeper服务发布和订阅机制解析
date: 2024-09-19 21:21:06
tags: zookeeper
---
![](4.png)
Dubbo框架集成注册中心Zookeeper
Zookeeper定义：
应用程序分布式协调工具；精简文件系统，基于目录（ZNode）树方式存储数据，提供排序，通知和监控等抽象操作
# Dubbo服务注册中心

## 注册中心结构
![](4-Zookeeper-注册中心结构.png)


## Dubbo 中注册中心功能特性
### 核心功能
-  支持对等集群 （多无状态的实例，实现高可用）
-  提供CRUD接口（提供访问接口）
-  订阅发布机制 
-  变更通知机制 
### 连接方式
- 直连
```
<dubbo:reference id="xxxService" interface="com.alibaba.xxx.XxxServiceurl="dubbo://localhost:20890”/>
```
测试时不想用注册中心
- 只注册
```
<dubbo:registry address="10.20.153.10:9090" register="false” />
```
- 只订阅
```
<dubbo:registry address="10.20.153.10:9090" subscribe="false” />
```
### 多注册中心
通常使用一个注册中心。
同时调用两个不同注册中心中的服务，接口及版本号都一样，但连的数据库不一样
```
<!-- 多注册中心配置 -->
    <dubbo:registry id="aRegistry" address="10.20.141.150:9090" />
    <dubbo:registry id="bRegistry" address="10.20.154.177:9010" default="false" />

    <!-- 引用中文站服务 -->
    <dubbo:reference id="customerAService" interface="org.geekbang.projects.cs.CustomerService" 		version="1.0.0" registry="aRegistry" />
    <!-- 引用国际站服务 -->
    <dubbo:reference id="customerBService" interface="org.geekbang.projects.cs.CustomerService" 		version="1.0.0" registry="bRegistry" />
```

## Dubbo中的注册中心
- Multicast
- *Zookeeper*
- Redis
- Consul
- *Nacos*
- Etcd3

### Dubbo中的注册中心定义

**如何抽象设计的？**
接口：*RegistryService*
```
public interface RegistryService {
    //注册
    void register(URL url);
    //取消注册
    void unregister(URL url);
    //订阅
    void subscribe(URL url, NotifyListener listener);
    //取消订阅
    void unsubscribe(URL url, NotifyListener listener); // listener监听器，异步通知服务发生了变更
    //根据URL查询对应的注册信息
    List<URL> lookup(URL url);
}

public interface NotifyListener {
    //针对不同URL执行注册中心变更通知
    void notify(List<URL> urls);
}

```
### Dubbo中的注册中心实现
``` 
@SPI("dubbo")
public interface RegistryFactory{
    Registry getRegistry(URL url);
}

public interface Registry extends Node, RegistryService {
}
```

工厂类结构：
![](4-Zookeeper-注册中心实现.png)

# Zookeeper功能

## Zookeeper结构
分布式协调工具，提供服务注册发现、配置管理、一致性锁等功能。
精简文件系统，基于目录（ZNode）树方式存储数据，提供排序，通知和监控等抽象操作
![](4-Zookeeper注册中心结构.png)

## Zookeeper特性
通过路径引用
- 原子性访问
所有请求的处理结果在整个Zookeeper集群中所有机器是一致的
- 顺序访问
从同一客户端发起的事务请求，会按照其发起顺序严格应用到Zookeeper

## Zookeeper操作模型 - 会话
客户端访问Zookeeper服务的会话机制
- 发送请求
- TCP连接
- 接收Watch事件（变更通知的基础）

---

- 临时 Ephemeral（会话结束删除节点）
- 持久 Persistent
## Zookeeper操作模型 - Watcher
分布式环境下的回调

## 核心API
create 在ZooKeeper命名空间的指定路径中创建一个ZNode
delete 从ZooKeeper命名空间的指定路径中删除一个ZNode
exists 检查路径中是否存在ZNode
getChildren 获取ZNode的子节点列表
getData 获取与ZNode相关的数据
setData 将数据设置/号入zNode的数据字段
getACL 获取ZNode的访问控制列表(ACL)策略
setACL 在ZNode中设置访问控制列表(ACL)策略
sync 将客户端的ZNode视图与ZooKeeper同步

# Zookeeper注册中心实现过程
## 交互流程
客户端会缓存服务地址，即使注册中心挂掉也可以访问服务
![](4-Zookeeper-与注册中心交互流程.png)

## 存储模型
![](4-Zookeeper与注册中心存储模型.png)
> 可视化工具Zookeeper Explorer

## 核心类
![](4-Zookeeper注册中心类结构-容错性.png)

### ZookeeperRegistry 
Zookeeper注册器
```
public ZookeeperRegistry(URL url, ZookeeperTransporter, zookeeperTransporter) {
        super(url);
        ...
        String group = url.getParameter(Constants.GROUP_KEY, DEFAULT_ROOT);
        if (!group.startsWith(Constants.PATH_SEPARATOR)) {
            group = Constants.PATH_SEPARATOR + group;
        }
        this.root = group;
        zkClient = zookeeperTransporter.connect(url);
        zkClient.addStateListener(new StateListener() {
            public void stateChanged(int state) {
                if (state == RECONNECTED) {
                    try {
                        recover();
                    } catch (Exception e) {
                        logger.error(e.getMessage(), e);
                    }
                }
            }
        });
}
```
### ZookeeperTransporter
底层通信组件
ZookeeperTransporter是网络通信的封装 
ZookeeperTransporter本身是一个接口，根据传入的URL通过创建与Zookeeper服务器的连接获取一个ZookeeperClient对象

### ZookeeperClient
包含注册中心运行过程中的所有数据操作
```
public interface ZookeeperClient {
    void create(String path, boolean ephemeral);
    void delete(String path);
    List<String> getChildren(String path); 
    List<String> addChildListener(String path, ChildListener listener);
    void removeChildListener(String path, ChildListener listener);
    void addStateListener(StateListener listener);
    void removeStateListener(StateListener listener);
    boolean isConnected();
    void close();
    URL getUrl();
}
```
###  ZookeeperTransporter和ZookeeperClient
![](4-Zookeeper注册中心核心类型.png)

### 核心方法
url节点是默认临时节点，优点：断开自动删除，服务不可用自动删除，不需要维护状态
- 注册 doRegister
利用zkclient在服务端创建一个url节点（临时节点）
- 取消注册 doUnregister
删除url节点
- 订阅 
添加监听器（对url节点添加监听），一旦变化触发回调

Dubbo会订阅父级目录, 而子节点变化会触发ChildListener中的回调，该函数会对该路径下的所有子节点执行subscribe操作

- 取消订阅 doUnsubscribe
删除监听器，去掉URL上已经注册的监听器

### 容错性
FailbackRegistry构造函数中会创建一个定时任务，每隔一段时间执行该retry方法
从失败集合中获取URL，然后对每个URL执行doRegister操作从而实现重新注册
# 问题
如果位于注册中心中的服务定义发生了变化，Zookeeper是如何确保客户端进行实时更新的？
