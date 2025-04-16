---
title: spring
date: 2024-07-21 21:07:15
tags: spring
description: spring
---

- spring核心特性
- web技术
- 数据存储
- 框架整合
- 测试


# spring核心特性
IOC容器、AOP、Events、资源管理、校验、数据绑定、国际化、类型转换、SEL (spring express language spring表达式)
# web技术
    1. Web Servlet技术
        MVC、WebSocket
    2. Web Reactive技术 spring5引入
        WebFlux、WebClient、WebSocket
# 数据存储
jdbc、事务抽象、DAO Support、O/R Mapping、XML序列化 (XML Marshalling)
# 框架整合
远程调用(Remoting) 同步调用
Java 消息服务(JMS) ActiveMQ异步调用（kafka、RocketMQ不是JMS规范）
Java 连接架构(JCA)
Java 管理扩展(JMX)
Java 邮件客户端(Email)
本地任务(Tasks) 
本地调度(Scheduling)
缓存抽象(Caching)Spring 
测试(Testing)
# 测试
模拟对象 Mock Objects
TestContext框架（TestContext Framework）
Spring MVC测试
Web测试客户端 WebTestClien




PostProcessor
    - BeanFactoryPostProcessor 修改BeanDefinition信息
    - BeanPostProcessor 修改Bean信息
BeanFactory
    ignoreDependencyType
    ignoreDependencyInterface
创建实例(实例化+初始化)：
构造方法 -> 设置属性 -> setAware属性 -> BeanFactory.Before -> init-method -> BeanFactory.After

Aware接口作用
需要其他Bean对象时可实现此接口，获取其他容器对象

xml、json、yaml、properties文件 
BeanDefinitionReader（定义读取规范，方便扩展）
BeanDefinition
BeanFactory->反射创建对象
    - 实例化
    - 初始化
        - 设置属性
        - 设置aware属性
        - BeanFactoryPostProcessor.before
        - ini-method
        - BeanFactoryPostProcessor.after



BeanFactory
FactoryBean
Aware
BeanDefinition
BeanDefinitionReader
BeanFactoryPostProcessor
BeanPostProcessor
Environment

BeanFactory与FactoryBean的区别：BeanFactory遵循spring对象的声明周期；FactoryBean通过getObject对象获取具体对象，创建过程由用户控制。


# spring事务
## 多线程失效
原因：启动新线程找不到原线程的connection
```
public void parentMethod() {
    TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
    
    // 主线程事务
    transactionTemplate.execute(status -> {
        repository.save(entity1);
        return null;
    });
    
    // 子线程事务
    new Thread(() -> {
        transactionTemplate.execute(status -> {
            repository.save(entity2);
            return null;
        });
    }).start();
}
```