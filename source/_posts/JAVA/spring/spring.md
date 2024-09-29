---
title: spring
date: 2024-07-21 21:07:15
tags:
description: spring
---

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

