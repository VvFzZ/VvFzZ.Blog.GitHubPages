---
title: 5使用Dubbo消费分布式服务
description: 5使用Dubbo消费分布式服务
date: 2024-09-19 21:21:12
tags:
---
- Dubbo框架服务发布机制
    - Dubbo服务引用流程
    - Dubbo服务引用核心技术
- 演示
## 服务引用流程
![](5-Dubbo-服务引用时序图.png)
### 本地接口 -> 远程调用
1. 导入服务提供者接口API和服务信息
2. 根据API生成远程服务的本地动态代理对象
3. 本地API调用转换成远程服务调用，返回调用结果

为什么使用Dubbo接口进行远程访问就像在使用本地接口一样？
通过代理机制，创建服务API代理对象，代理对象通过远程调用返回结果。

## 核心功能
### 回声测试
测试整个调用是否通畅，可用于监控(常用语自动化脚本)

```
public interface EchoService {
    //定义回声方法
    Object $echo(Object message);
}

public static void main(String[] args) throws Exception {
    ClassPathXmlApplicationContext context = new 				
ClassPathXmlApplicationContext("spring/dubbo-consumer.xml");
    context.start();
    UserService userService = context.getBean("userService", UserService.class);
    System.out.println("result: " + 				userService.getUserByUserName("*").toString());

//使用回声测试
    EchoService echoService = (EchoService)userService;
    String status = (String)echoService.$echo("OK");
    System.out.println("status:" +  status);
}
```
### 异步调用
基于NIO的非阻塞实现并行调用，以CompletableFuture为基础,客户端不需要启动多线程即可完成并行调用多个远程服务，相对多线程开销较小

### 泛化调用
违反接口契约，慎用


## 案例
### 引入依赖

### 配置
```
dubbo:
  protocol:
    name: dubbo
    port: -1
  registry:
    address: zookeeper://127.0.0.1:2181
    file: D:/dubbo/customer-service/cache
  scan:
    base-packages: org.geekbang.projects.cs
#服务版本号
integration:
  service:
    version: 1.0.0
```
### DubboReference
```
@Component
public class CustomClient {

    @DubboReference(version = "${customer.service.version}")
    private CustomerStaffSyncService service;

    public void get1() {
        String s = service.syncOutsourcingCustomerStaffsBySystemId(1L);
        System.out.println(s);
    }
}
```
## 问题
针对服务引用，Dubbo提供哪些功能特性？





